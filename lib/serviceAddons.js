export const SERVICE_ADDONS = [
  {
    key: 'data-backup',
    label: 'Data Backup',
    price: 39,
    description: 'We back up your photos, contacts, and files before starting the repair. Delivered via secure download link.',
    availableFor: ['phone', 'tablet', 'laptop'],
  },
  {
    key: 'express-service',
    label: 'Express Service',
    price: 49,
    description: 'Priority handling. Your repair moves to the front of the queue with 1-2 business day turnaround.',
    availableFor: ['phone', 'tablet', 'laptop'],
  },
  {
    key: 'screen-protector',
    label: 'Screen Protector Install',
    price: 19,
    description: 'Premium tempered glass screen protector installed before return shipping.',
    availableFor: ['phone', 'tablet'],
  },
]

export function getAddonsForCategory(category) {
  return SERVICE_ADDONS.filter((addon) => addon.availableFor.includes(category))
}

export function getAddon(key) {
  return SERVICE_ADDONS.find((a) => a.key === key) || null
}

export function calculateAddonsTotal(addonKeys) {
  return addonKeys.reduce((sum, key) => {
    const addon = getAddon(key)
    return sum + (addon ? addon.price : 0)
  }, 0)
}
