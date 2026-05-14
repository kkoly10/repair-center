// Centralized legal contact values — set via env vars before launch.
// All vars use NEXT_PUBLIC_ prefix so they are available in both server
// components and client components without special handling.
//
// Required in production:
//   NEXT_PUBLIC_BUSINESS_NAME    — legal business entity name (e.g. "Acme Repair LLC")
//   NEXT_PUBLIC_MAILING_ADDRESS  — physical mailing address for legal notices
//   NEXT_PUBLIC_SUPPORT_EMAIL    — customer-facing support email
//   NEXT_PUBLIC_PRIVACY_EMAIL    — privacy rights request email (may be same as support)

export const LEGAL = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'RepairCenter',
  mailingAddress: process.env.NEXT_PUBLIC_MAILING_ADDRESS || null,
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    'hello@repaircenter.app',
  privacyEmail:
    process.env.NEXT_PUBLIC_PRIVACY_EMAIL ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    'hello@repaircenter.app',
}
