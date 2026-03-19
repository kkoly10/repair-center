export const CATEGORY_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'laptop', label: 'Laptop' },
]

export const REPAIR_STATUS_STEPS = [
  'Estimate received',
  'Human review',
  'Approved for mail-in',
  'Device received',
  'Inspection complete',
  'Repair in progress',
  'Shipped back',
]

export const REPAIR_CATALOG = [
  {
    category: 'phone',
    brand: 'Apple',
    modelKey: 'iphone-13',
    model: 'iPhone 13',
    repairs: [
      { key: 'screen', label: 'Screen replacement', mode: 'range', min: 159, max: 189, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
      { key: 'battery', label: 'Battery replacement', mode: 'fixed', price: 119, deposit: 25, shipping: 14.95, turnaround: '2–4 business days' },
      { key: 'charging', label: 'Charging port repair', mode: 'range', min: 109, max: 149, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
      { key: 'software', label: 'Software restore', mode: 'fixed', price: 79, deposit: 25, shipping: 14.95, turnaround: '1–2 business days' },
    ],
  },
  {
    category: 'phone',
    brand: 'Apple',
    modelKey: 'iphone-14-pro',
    model: 'iPhone 14 Pro',
    repairs: [
      { key: 'screen', label: 'Screen replacement', mode: 'range', min: 229, max: 279, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
      { key: 'battery', label: 'Battery replacement', mode: 'fixed', price: 139, deposit: 25, shipping: 14.95, turnaround: '2–4 business days' },
      { key: 'charging', label: 'Charging port repair', mode: 'range', min: 129, max: 169, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
      { key: 'camera', label: 'Rear camera repair', mode: 'range', min: 179, max: 249, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
    ],
  },
  {
    category: 'phone',
    brand: 'Samsung',
    modelKey: 'galaxy-s24-fe',
    model: 'Galaxy S24 FE',
    repairs: [
      { key: 'screen', label: 'Screen replacement', mode: 'fixed', price: 129, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
      { key: 'battery', label: 'Battery replacement', mode: 'fixed', price: 119, deposit: 25, shipping: 14.95, turnaround: '2–4 business days' },
      { key: 'charging', label: 'Charging port repair', mode: 'range', min: 109, max: 149, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
    ],
  },
  {
    category: 'phone',
    brand: 'Samsung',
    modelKey: 'galaxy-s24-ultra',
    model: 'Galaxy S24 Ultra',
    repairs: [
      { key: 'screen', label: 'Screen replacement', mode: 'range', min: 249, max: 289, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
      { key: 'battery', label: 'Battery replacement', mode: 'range', min: 129, max: 159, deposit: 25, shipping: 14.95, turnaround: '2–4 business days' },
      { key: 'camera', label: 'Rear camera repair', mode: 'range', min: 189, max: 259, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
    ],
  },
  {
    category: 'tablet',
    brand: 'Apple',
    modelKey: 'ipad-10th-gen',
    model: 'iPad 10th Gen',
    repairs: [
      { key: 'screen', label: 'Screen / glass repair', mode: 'range', min: 169, max: 229, deposit: 25, shipping: 14.95, turnaround: '4–6 business days' },
      { key: 'battery', label: 'Battery replacement', mode: 'range', min: 129, max: 159, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
      { key: 'charging', label: 'Charging port repair', mode: 'range', min: 109, max: 149, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
    ],
  },
  {
    category: 'tablet',
    brand: 'Apple',
    modelKey: 'ipad-air-m2',
    model: 'iPad Air M2',
    repairs: [
      { key: 'screen', label: 'Display repair', mode: 'range', min: 249, max: 329, deposit: 25, shipping: 14.95, turnaround: '4–6 business days' },
      { key: 'battery', label: 'Battery replacement', mode: 'range', min: 149, max: 189, deposit: 25, shipping: 14.95, turnaround: '3–5 business days' },
    ],
  },
  {
    category: 'laptop',
    brand: 'Apple',
    modelKey: 'macbook-air-m2-13',
    model: 'MacBook Air 13-inch M2',
    repairs: [
      { key: 'battery', label: 'Battery replacement', mode: 'range', min: 199, max: 249, deposit: 45, shipping: 24.95, turnaround: '3–5 business days' },
      { key: 'software', label: 'macOS reinstall / cleanup', mode: 'fixed', price: 99, deposit: 45, shipping: 24.95, turnaround: '1–2 business days' },
      { key: 'diagnostic', label: 'No power / deeper inspection', mode: 'manual', deposit: 45, shipping: 24.95, turnaround: 'Inspection required' },
    ],
  },
  {
    category: 'laptop',
    brand: 'Dell',
    modelKey: 'dell-inspiron-15',
    model: 'Dell Inspiron 15',
    repairs: [
      { key: 'battery', label: 'Battery replacement', mode: 'range', min: 139, max: 199, deposit: 45, shipping: 24.95, turnaround: '3–5 business days' },
      { key: 'ssd-upgrade', label: 'SSD install + setup', mode: 'range', min: 149, max: 229, deposit: 45, shipping: 24.95, turnaround: '2–4 business days' },
      { key: 'software', label: 'Windows reinstall / cleanup', mode: 'fixed', price: 99, deposit: 45, shipping: 24.95, turnaround: '1–2 business days' },
      { key: 'keyboard', label: 'Keyboard replacement', mode: 'range', min: 149, max: 239, deposit: 45, shipping: 24.95, turnaround: '3–5 business days' },
    ],
  },
  {
    category: 'laptop',
    brand: 'Lenovo',
    modelKey: 'thinkpad-t14',
    model: 'ThinkPad T14',
    repairs: [
      { key: 'battery', label: 'Battery replacement', mode: 'range', min: 149, max: 209, deposit: 45, shipping: 24.95, turnaround: '3–5 business days' },
      { key: 'keyboard', label: 'Keyboard replacement', mode: 'range', min: 159, max: 249, deposit: 45, shipping: 24.95, turnaround: '3–5 business days' },
      { key: 'software', label: 'Windows reinstall / cleanup', mode: 'fixed', price: 99, deposit: 45, shipping: 24.95, turnaround: '1–2 business days' },
    ],
  },
]

export function getBrandsByCategory(category) {
  if (!category) return []
  return [...new Set(REPAIR_CATALOG.filter((item) => item.category === category).map((item) => item.brand))]
}

export function getModelsByBrandAndCategory(category, brand) {
  if (!category || !brand) return []
  return REPAIR_CATALOG.filter((item) => item.category === category && item.brand === brand).map((item) => ({
    modelKey: item.modelKey,
    model: item.model,
  }))
}

export function getRepairsByModel(modelKey) {
  return REPAIR_CATALOG.find((item) => item.modelKey === modelKey)?.repairs ?? []
}

export function getCatalogEntry(modelKey) {
  return REPAIR_CATALOG.find((item) => item.modelKey === modelKey) ?? null
}

export function getPricingForSelection(modelKey, repairKey) {
  const entry = getCatalogEntry(modelKey)
  if (!entry) return null
  return entry.repairs.find((repair) => repair.key === repairKey) ?? null
}

export function formatPriceDisplay(repair) {
  if (!repair) return 'Select a device and repair to preview pricing.'
  if (repair.mode === 'fixed') return `$${repair.price}`
  if (repair.mode === 'range') return `$${repair.min}–$${repair.max}`
  return 'Inspection required'
}
