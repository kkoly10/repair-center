export const WARRANTY_TIERS = [
  {
    key: 'standard',
    label: 'Standard Warranty',
    days: 90,
    price: 0,
    description: 'Included free with every repair. Covers parts and labor for manufacturing defects.',
  },
  {
    key: 'extended',
    label: 'Extended Warranty',
    days: 180,
    price: 29,
    description: '6-month coverage for extra peace of mind. Covers parts and labor.',
  },
  {
    key: 'premium',
    label: 'Premium Warranty',
    days: 365,
    price: 49,
    description: 'Full year of coverage. Includes one free re-repair if the same issue recurs.',
  },
]

export function getWarrantyTier(key) {
  return WARRANTY_TIERS.find((t) => t.key === key) || WARRANTY_TIERS[0]
}

export function getWarrantyPrice(key) {
  return getWarrantyTier(key).price
}

export function getWarrantyDays(key) {
  return getWarrantyTier(key).days
}

export function formatWarrantyLabel(key) {
  const tier = getWarrantyTier(key)
  return tier.price > 0 ? `${tier.label} (+$${tier.price})` : tier.label
}
