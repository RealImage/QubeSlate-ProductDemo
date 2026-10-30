import { describe, expect, it } from 'vitest';
import {
  brandCategoryIds, brandMappings, brandMatchesCategory, categoryPath, deleteBlock, nodeNameError, pathLabel, pathLabels, redundantIds,
  childrenOf, subtreeIds, usageCounts, type CategoryNode
} from './catalog';

const n = (id: string, parentId: string | null, level: 1 | 2 | 3, name: string): CategoryNode => ({ id, parentId, level, name });
const nodes: CategoryNode[] = [
  n('A', null, 1, 'Auto'), n('A1', 'A', 2, 'Automotive'), n('A1a', 'A1', 3, 'Cars'), n('A1b', 'A1', 3, 'Bikes'), n('A2', 'A', 2, 'Services'),
  n('F', null, 1, 'FMCG'), n('F1', 'F', 2, 'Consumer Goods'), n('F1a', 'F1', 3, 'Food & Beverages')
];
const brand = (name: string, categoryIds: string[], products: { name: string; categoryIds?: string[]; variants?: { name: string; categoryIds?: string[] }[] }[] = []) => ({
  name, categoryIds,
  products: products.map((p, i) => ({ id: `P${i}`, name: p.name, categoryIds: p.categoryIds ?? [], variants: (p.variants ?? []).map((v, j) => ({ id: `V${i}${j}`, name: v.name, categoryIds: v.categoryIds ?? [] })) }))
});

describe('paths', () => {
  it('resolves a path from the top category down', () => {
    expect(categoryPath(nodes, 'A1a')).toEqual(['Auto', 'Automotive', 'Cars']);
    expect(pathLabel(nodes, 'A')).toBe('Auto');
    expect(pathLabel(nodes, 'A1a')).toBe('Auto / Automotive / Cars');
    expect(pathLabel(nodes, 'gone')).toBe('');
  });
  it('drops unknown ids when rendering a list', () => {
    expect(pathLabels(nodes, ['A', 'gone', 'F1'])).toEqual(['Auto', 'FMCG / Consumer Goods']);
  });
});

describe('sibling names', () => {
  it('rejects duplicates case-insensitively among siblings only', () => {
    expect(nodeNameError(nodes, 'A1', ' cars ')).toMatch(/already exists/);
    expect(nodeNameError(nodes, 'A1', 'Cars', 'A1a')).toBeNull(); // renaming to itself
    expect(nodeNameError(nodes, 'F1', 'Cars')).toBeNull(); // different parent
    expect(nodeNameError(nodes, null, 'auto')).toMatch(/already exists/);
    expect(nodeNameError(nodes, null, '  ')).toMatch(/name/);
  });
});

describe('ordering', () => {
  it('lists siblings alphabetically, ignoring case', () => {
    expect(childrenOf(nodes, 'A1').map(x => x.name)).toEqual(['Bikes', 'Cars']);
    expect(childrenOf([...nodes, n('a', null, 1, 'apparel')], null).map(x => x.name)).toEqual(['apparel', 'Auto', 'FMCG']);
  });
});

describe('brand mappings', () => {
  const b = brand('Hero', ['A'], [{ name: 'Splendor', categoryIds: ['A1'], variants: [{ name: 'Plus', categoryIds: ['A1b', 'A'] }] }]);
  it('lists mappings with their level', () => {
    expect(brandMappings(b).map(m => [m.categoryId, m.source])).toEqual([['A', 'brand'], ['A1', 'product'], ['A1b', 'variant'], ['A', 'variant']]);
  });
  it('unions and deduplicates across levels', () => {
    expect(brandCategoryIds(b)).toEqual(['A', 'A1', 'A1b']);
  });
  it('flags a node mapped together with its ancestor', () => {
    expect(redundantIds(nodes, ['A', 'A1a', 'F'])).toEqual(['A1a']);
    expect(redundantIds(nodes, ['A1a', 'F1a'])).toEqual([]);
  });
});

describe('category filter', () => {
  const direct = brand('X', ['A']);
  const viaVariant = brand('Y', [], [{ name: 'p', variants: [{ name: 'v', categoryIds: ['A1a'] }] }]);
  const other = brand('Z', ['F1a']);
  it('matches the node itself or a descendant, at any level of the brand', () => {
    expect(subtreeIds(nodes, 'A1')).toEqual(new Set(['A1', 'A1a', 'A1b']));
    expect(brandMatchesCategory(nodes, direct, 'A')).toBe(true);
    expect(brandMatchesCategory(nodes, viaVariant, 'A')).toBe(true);
    expect(brandMatchesCategory(nodes, viaVariant, 'A1')).toBe(true);
    expect(brandMatchesCategory(nodes, viaVariant, 'A1b')).toBe(false);
    expect(brandMatchesCategory(nodes, other, 'A')).toBe(false);
  });
  it('does not match a parent filter when the brand is only mapped above it', () => {
    expect(brandMatchesCategory(nodes, direct, 'A1a')).toBe(false);
  });
});

describe('usage and delete blocking', () => {
  const brands = [brand('X', ['A']), brand('Y', [], [{ name: 'p', variants: [{ name: 'v', categoryIds: ['A1a'] }] }]), brand('W', ['A1a'], [{ name: 'p', categoryIds: ['A1a'] }])];
  it('counts distinct brands per node across all three levels, including descendants', () => {
    const c = usageCounts(nodes, brands);
    expect(c.get('A')).toBe(3);
    expect(c.get('A1')).toBe(2);
    expect(c.get('A1a')).toBe(2);
    expect(c.get('A1b')).toBe(0);
    expect(c.get('F')).toBe(0);
  });
  it('blocks deleting a node whose descendant is mapped by a variant', () => {
    const only = [brands[1]!];
    expect(deleteBlock(nodes, only, 'A1').blocked).toBe(true);
    expect(deleteBlock(nodes, only, 'A1').message).toMatch(/1 brand/);
    expect(deleteBlock(nodes, only, 'A1b').blocked).toBe(false);
    expect(deleteBlock(nodes, only, 'F').blocked).toBe(false);
  });
});
