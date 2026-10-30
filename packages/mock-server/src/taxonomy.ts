import type { CategoryNode } from '@slate/domain';

/**
 * The category master as supplied: Category | SubCategory1 | SubCategory2 list. A blank first or second column repeats the value above.
 * Spellings are kept exactly as given (including "Kittcheware" and "Stationary").
 */
const TABLE = `
Auto | Automotive | Cars, Bikes, Commercial Vehicles, Auto Accessories
 | Services | Auto Insurance, Car Servicing & Maintenance
BFSI | Financial Services | Banks, Insurance, Mutual Funds
 | Financial Technology (FinTech) | Digital Payment Platforms, Loan Aggregators
Consumer Durables | Consumer Electronics & Appliances | Home Appliances, Personal Electronics (TV, Audio, Cameras), Kitchen Appliances, Laptops / Desktops, Batteries / Water Pumps, Houseware, Kittcheware, Mobile Phones
 | Home & Living | Smart Home Products
DTH | Media & Communication | DTH, Satellite TV Services, Cable Providers
E-Commerce Portal | E-Commerce | Online Marketplaces, Classifieds
 | Online Platforms | Fin-Tech / Trading Platform, Gaming Sites, Gambling Sites, Ed-Tech, Independent Apps, Mobility Apps
 | Retail | Online Grocery, Online Retail
 | Software Providers | Software with only online presence
Education | Educational Services | Schools, Colleges, Extra Curricular
Events & Exhibitions | Event Management | Exhibitions, Trade Shows
 | Entertainment | Concerts & Festivals
Film Trailer | Media & Entertainment | Trailers
FMCG | Consumer Goods | Food & Beverages, Personal Care
 | Household | Household Products
Furniture & Furnishings | Home & Living | Furniture, Home Décor
Health Care & Hospitals | Health Care Services | Hospitals, Clinics, Labs, Health Care Devices
Hospitality | Tourism & Travel | Hotels, Resorts
 | Services | Event Venues
Industrial Goods | Manufacturing & Industry | Machinery, Tools
 | Products | Cement, Paints, TMT / Sariya / Pipes / PVC, Bath Fittings, Tiles, Stationary / (Pens/Boards/Papers/Books), Others
 | Services | Logistics Services, Wires & Cables, Marble Goods, Packers & Movers
IT & IT Enabled Services | Technology | Software Solutions, IT Support Services
Lifestyle | Fashion | Apparel, Accessories
Government | Public Services | Civic Projects
Organised Retail | Retail | Department Stores, Supermarkets, Pharmacy
Pan Masala/Liquor/Tobacco | Consumer Goods | Pan Masala, Tobacco, Alcohol
Pharma | Pharmaceuticals | Medicines, Pharma other than OTC
Political | Advocacy | Campaigns, Awareness Programs
Real Estate | Property & Housing | Residential Real Estate, Commercial Real Estate
Shops | Retail | Local Retail Stores, Restaurants
Social Advertisements | Public Services | Social Awareness
Telecom & Handsets | Telecommunications | Mobile Services, Mobile Accessories, Service Carriers, VAS Services, Dongle / Wifi Provider, Handsets
Travel/Tourism | Tourism & Travel | Airlines, Tour Operators, E-commerce
TV Channels/Media | Media & Communication | TV Channels / OTT / Print Publication / OOH / Magazines / Media Related Brand
`;

/** Splits on commas that are not inside brackets, so "Personal Electronics (TV, Audio, Cameras)" stays one item. */
function splitLeaves(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}

/** Builds the nodes with stable, sequential ids (CAT-001 …) and per-parent sort order. */
export function seedCategories(): CategoryNode[] {
  const nodes: CategoryNode[] = [];
  const next = () => `CAT-${String(nodes.length + 1).padStart(3, '0')}`;
  let cat = '', sub = '';
  let catId: string | null = null, subId: string | null = null;
  const orderUnder = (parentId: string | null) => nodes.filter(n => n.parentId === parentId).length + 1;
  for (const line of TABLE.split('\n')) {
    if (!line.trim()) continue;
    const [c = '', s = '', leaves = ''] = line.split('|').map(x => x.trim());
    if (c) { cat = c; sub = ''; catId = null; subId = null; }
    if (!catId) { catId = next(); nodes.push({ id: catId, parentId: null, level: 1, name: cat, order: orderUnder(null) }); }
    // A repeated sub-category name under the same category continues the same node.
    const existing = nodes.find(n => n.parentId === catId && n.name === s);
    if (existing) subId = existing.id;
    else { sub = s; subId = next(); nodes.push({ id: subId, parentId: catId, level: 2, name: sub, order: orderUnder(catId) }); }
    for (const leaf of splitLeaves(leaves)) nodes.push({ id: next(), parentId: subId, level: 3, name: leaf, order: orderUnder(subId) });
  }
  return nodes;
}
