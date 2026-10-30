import { describe, expect, it } from 'vitest';
import { childrenOf, pathLabel } from '@slate/domain';
import { seedCategories } from './taxonomy';

describe('seeded category master', () => {
  const nodes = seedCategories();
  const names = (parent: string) => childrenOf(nodes, nodes.find(n => pathLabel(nodes, n.id) === parent)!.id).map(n => n.name);

  it('has 3 levels with stable unique ids', () => {
    expect(new Set(nodes.map(n => n.id)).size).toBe(nodes.length);
    expect(nodes.every(n => (n.level === 1 ? n.parentId === null : nodes.find(p => p.id === n.parentId)?.level === n.level - 1))).toBe(true);
  });
  it('repeats blank first / second columns and keeps given spellings', () => {
    expect(names('Auto')).toEqual(['Automotive', 'Services']);
    expect(names('E-Commerce Portal')).toEqual(['E-Commerce', 'Online Platforms', 'Retail', 'Software Providers']);
    expect(names('Consumer Durables / Consumer Electronics & Appliances')).toContain('Kittcheware');
    expect(names('Industrial Goods / Products')).toContain('Stationary / (Pens/Boards/Papers/Books)');
  });
  it('does not split commas inside brackets and keeps repeated sub-category names distinct per category', () => {
    expect(names('Consumer Durables / Consumer Electronics & Appliances')).toContain('Personal Electronics (TV, Audio, Cameras)');
    const retail = nodes.filter(n => n.name === 'Retail' && n.level === 2);
    expect(retail.length).toBeGreaterThan(2);
    expect(new Set(retail.map(n => n.parentId)).size).toBe(retail.length);
  });
});
