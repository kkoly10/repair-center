export const PUBLIC_BUSINESS_INFO = {
  businessName: process.env.REPAIR_BUSINESS_NAME || 'Repair Center',
  supportEmail:
    process.env.REPAIR_SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@repaircenter.com',
  privacyEmail:
    process.env.REPAIR_PRIVACY_EMAIL ||
    process.env.REPAIR_SUPPORT_EMAIL ||
    process.env.EMAIL_FROM ||
    'privacy@repaircenter.com',
  supportPhone: process.env.REPAIR_SUPPORT_PHONE || '(540) 000-0000',
  mailingAddress: {
    line1:
      process.env.REPAIR_MAILING_ADDRESS_LINE1 ||
      process.env.REPAIR_RECEIVING_ADDRESS_LINE1 ||
      'Mailing address to be configured',
    line2:
      process.env.REPAIR_MAILING_ADDRESS_LINE2 ||
      process.env.REPAIR_RECEIVING_ADDRESS_LINE2 ||
      '',
    city:
      process.env.REPAIR_MAILING_CITY ||
      process.env.REPAIR_RECEIVING_CITY ||
      'Fredericksburg',
    state:
      process.env.REPAIR_MAILING_STATE ||
      process.env.REPAIR_RECEIVING_STATE ||
      'VA',
    postalCode:
      process.env.REPAIR_MAILING_POSTAL_CODE ||
      process.env.REPAIR_RECEIVING_POSTAL_CODE ||
      '22401',
  },
}
