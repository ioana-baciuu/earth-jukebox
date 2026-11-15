export type CostItem = { name: string; low: number; high: number; note?: string };

export const KIOSK_COSTS: CostItem[] = [
  { name: '24–27″ capacitive touchscreen monitor', low: 250, high: 450 },
  { name: 'Fanless mini PC', low: 150, high: 250, note: 'Proposed offline kiosk computer' },
  { name: 'Two durable over-ear headphones + splitter or amplifier', low: 80, high: 160 },
  { name: 'Large-button controller', low: 40, high: 80, note: 'Adapt to the prototype’s four dataset keys and east/west joystick' },
  { name: 'Tactile or raised globe', low: 80, high: 300, note: 'Basic bought or 3D-printed globe; advanced actuated pins are not included' },
  { name: 'Enclosure and height-adjustable stand', low: 300, high: 800, note: 'Child- and wheelchair-friendly design' },
  { name: 'Cables, power, mounts and lock', low: 50, high: 100 },
  { name: 'Shipping and installation', low: 100, high: 200 },
];

export const LAUNCH_COSTS: CostItem[] = [
  { name: 'Production hardening of the app', low: 5000, high: 12000, note: 'Offline delivery, performance and fixes; outsourced estimate, or team time' },
  { name: 'Sound design', low: 1000, high: 3000, note: 'Composed, licensed or recorded sounds' },
  { name: 'Accessibility audit and user testing', low: 1500, high: 4000, note: 'With blind and low-vision users' },
  { name: 'Teacher and museum curriculum guides', low: 1000, high: 3000 },
  { name: 'Translations', low: 500, high: 1500, note: 'Romanian plus one or two languages' },
  { name: 'Legal review', low: 500, high: 1500, note: 'Children’s privacy, GDPR, terms and NASA branding' },
  { name: 'Prototype kiosk and pilot setup', low: 2000, high: 3500 },
];

export const ANNUAL_COSTS: CostItem[] = [
  { name: 'Hosting, domain and data delivery', low: 100, high: 600 },
  { name: 'Maintenance and updates', low: 1500, high: 4000 },
  { name: 'Insurance, accounting and administration', low: 500, high: 1500 },
];
export const REPAIR_RESERVE = 160;
export const PRICING: CostItem[] = [
  { name: 'Web app', low: 0, high: 0, note: 'Proposed free access for schools and home use' },
  { name: 'Museum kiosk', low: 3500, high: 6000, note: 'Per unit, including installation and one year of support' },
  { name: 'Kiosk lease', low: 100, high: 200, note: 'Per month, as an alternative to purchase' },
  { name: 'Software for existing museum hardware', low: 500, high: 1500, note: 'Per year' },
  { name: 'School pack', low: 150, high: 400, note: 'Teacher guide, classroom licence and headphone kit; paid extras, not a paywall for free web access' },
];

export function sumCosts(items: CostItem[]) {
  return items.reduce((total, item) => ({ low: total.low + item.low, high: total.high + item.high }), { low: 0, high: 0 });
}
export const ILLUSTRATIVE_SCENARIO = { salePrice: 4000, unitCost: 1600, launchBudget: 25000 };
export function breakEvenUnits(salePrice: number, unitCost: number, launchBudget: number) {
  if (salePrice <= unitCost) return null;
  return Math.ceil(launchBudget / (salePrice - unitCost));
}