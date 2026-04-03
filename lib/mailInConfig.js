export const MAIL_IN_CONFIG = {
  businessName: process.env.REPAIR_BUSINESS_NAME || 'Repair Center',
  supportEmail:
    process.env.REPAIR_SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@repaircenter.com',
  supportPhone: process.env.REPAIR_SUPPORT_PHONE || '(540) 000-0000',
  receivingAddress: {
    line1: process.env.REPAIR_RECEIVING_ADDRESS_LINE1 || 'Mail-in address to be configured',
    line2: process.env.REPAIR_RECEIVING_ADDRESS_LINE2 || '',
    city: process.env.REPAIR_RECEIVING_CITY || 'Fredericksburg',
    state: process.env.REPAIR_RECEIVING_STATE || 'VA',
    postalCode: process.env.REPAIR_RECEIVING_POSTAL_CODE || '22401',
  },
  packingChecklist: [
    'Back up your device before shipping if possible.',
    'Remove SIM cards, memory cards, stylus accessories, and cases unless they are relevant to the issue.',
    'Include only the charger if support specifically requested it.',
    'Wrap the device in protective padding and use a sturdy box.',
    'Write your quote ID clearly inside the package.',
  ],
  shippingNotes: [
    'Use tracked shipping.',
    'Signature confirmation is recommended for higher-value devices.',
    'Do not ship loose accessories unless requested.',
    'Keep your shipment receipt and tracking number until intake is confirmed.',
  ],
}
