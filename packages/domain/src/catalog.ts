import type { Brand } from './types';

/** One node of the category master: Category (1) › SubCategory1 (2) › SubCategory2 (3). */
export interface CategoryNode {
  id: string;
  parentId: string | null;
  level: 1 | 2 | 3;
  name: string;
  order: number;
}

export const CATEGORY_LEVEL_LABEL = { 1: 'Category', 2: 'SubCategory 1', 3: 'SubCategory 2' } as const;
export const PATH_SEPARATOR = ' / ';

type Mapped = Pick<Brand, 'name' | 'categoryIds' | 'products'>;

const byOrder = (a: CategoryNode, b: CategoryNode) => a.order - b.order || a.name.localeCompare(b.name);

export const childrenOf = (nodes: CategoryNode[], parentId: string | null) => nodes.filter(n => n.parentId === parentId).sort(byOrder);

/** Names from the top-level category down to the node; empty when the id is unknown. */
export function categoryPath(nodes: CategoryNode[], id: string): string[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const out: string[] = [];
  for (let n = byId.get(id), guard = 0; n && guard < 4; n = n.parentId ? byId.get(n.parentId) : undefined, guard++) out.unshift(n.name);
  return out;
}
/** "Auto / Automotive / Cars" */
export const pathLabel = (nodes: CategoryNode[], id: string) => categoryPath(nodes, id).join(PATH_SEPARATOR);

/** The node and everything beneath it. */
export function subtreeIds(nodes: CategoryNode[], id: string): Set<string> {
  const out = new Set<string>([id]);
  for (let grew = true; grew;) {
    grew = false;
    for (const n of nodes) if (n.parentId && out.has(n.parentId) && !out.has(n.id)) { out.add(n.id); grew = true; }
  }
  return out;
}
/** True when `id` is `ancestorId` or sits beneath it. */
export const isWithin = (nodes: CategoryNode[], id: string, ancestorId: string) => subtreeIds(nodes, ancestorId).has(id);

export const normaliseName = (s: string) => s.trim().replace(/\s+/g, ' ');

/** Sibling names are unique case-insensitively. Returns an error message, or null when the name is fine. */
export function nodeNameError(nodes: CategoryNode[], parentId: string | null, name: string, exceptId?: string): string | null {
  const n = normaliseName(name);
  if (!n) return 'Enter a name.';
  if (n.length > 80) return 'Keep the name under 80 characters.';
  const clash = nodes.some(x => x.parentId === parentId && x.id !== exceptId && x.name.toLowerCase() === n.toLowerCase());
  return clash ? `“${n}” already exists here.` : null;
}

/** Swap a node with its previous/next sibling and return the renumbered siblings, or null when it is already at the edge. */
export function reorderedSiblings(nodes: CategoryNode[], id: string, dir: 'up' | 'down'): CategoryNode[] | null {
  const node = nodes.find(n => n.id === id);
  if (!node) return null;
  const sibs = childrenOf(nodes, node.parentId);
  const i = sibs.findIndex(n => n.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= sibs.length) return null;
  const next = [...sibs];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next.map((n, k) => ({ ...n, order: k + 1 }));
}

// ---------- brand mappings ----------

export type MappingSource = 'brand' | 'product' | 'variant';
export interface BrandMapping { categoryId: string; source: MappingSource; /** The brand, product or "product › variant" the mapping sits on. */ owner: string }

export const dedupe = (ids: string[]) => [...new Set(ids)];

/** Every mapping on a brand, its products and their variants, with where each one lives. */
export function brandMappings(b: Mapped): BrandMapping[] {
  const out: BrandMapping[] = b.categoryIds.map(categoryId => ({ categoryId, source: 'brand', owner: b.name }));
  for (const p of b.products) {
    for (const categoryId of p.categoryIds) out.push({ categoryId, source: 'product', owner: p.name });
    for (const v of p.variants) for (const categoryId of v.categoryIds) out.push({ categoryId, source: 'variant', owner: `${p.name} › ${v.name}` });
  }
  return out;
}

/** The union of the brand's own, product and variant mappings, deduplicated, in first-seen order. */
export const brandCategoryIds = (b: Mapped) => dedupe(brandMappings(b).map(m => m.categoryId));

/** Resolved paths for a list of ids; unknown ids (deleted nodes) are dropped. */
export const pathLabels = (nodes: CategoryNode[], ids: string[]) => ids.map(i => pathLabel(nodes, i)).filter(Boolean);

/** A brand matches a filter node when any mapping is that node or one of its descendants. */
export function brandMatchesCategory(nodes: CategoryNode[], b: Mapped, nodeId: string): boolean {
  const sub = subtreeIds(nodes, nodeId);
  return brandCategoryIds(b).some(id => sub.has(id));
}

/** Ids in the list that also have an ancestor in the list (e.g. "Auto" and "Auto / Automotive / Cars" together). */
export function redundantIds(nodes: CategoryNode[], ids: string[]): string[] {
  const set = new Set(ids);
  const byId = new Map(nodes.map(n => [n.id, n]));
  return ids.filter(id => {
    for (let p = byId.get(id)?.parentId; p; p = byId.get(p)?.parentId) if (set.has(p)) return true;
    return false;
  });
}

/** Per node: how many brands use it directly or through a descendant (brand, product and variant mappings all count). */
export function usageCounts(nodes: CategoryNode[], brands: Mapped[]): Map<string, number> {
  const parent = new Map(nodes.map(n => [n.id, n.parentId]));
  const per = new Map<string, Set<number>>();
  brands.forEach((b, bi) => {
    for (const id of brandCategoryIds(b)) {
      for (let cur: string | null | undefined = id, guard = 0; cur && guard < 4; cur = parent.get(cur), guard++) {
        let s = per.get(cur);
        if (!s) per.set(cur, (s = new Set()));
        s.add(bi);
      }
    }
  });
  return new Map(nodes.map(n => [n.id, per.get(n.id)?.size ?? 0]));
}

/** A node cannot be deleted while it or a descendant is mapped by any brand, product or variant. */
export function deleteBlock(nodes: CategoryNode[], brands: Mapped[], id: string): { blocked: boolean; brands: number; message: string | null } {
  const sub = subtreeIds(nodes, id);
  const using = brands.filter(b => brandCategoryIds(b).some(c => sub.has(c))).length;
  if (!using) return { blocked: false, brands: 0, message: null };
  const name = nodes.find(n => n.id === id)?.name ?? 'This category';
  return { blocked: true, brands: using, message: `“${name}” is used by ${using} brand${using === 1 ? '' : 's'} (directly or through a sub-category). Remove those mappings first.` };
}

/** Which of the given ids are not in the master. */
export function unknownIds(nodes: CategoryNode[], ids: string[]): string[] {
  const s = new Set(nodes.map(n => n.id));
  return ids.filter(i => !s.has(i));
}
