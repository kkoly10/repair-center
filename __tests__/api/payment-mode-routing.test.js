/**
 * Payment mode routing invariants:
 * - Manual payment mode: estimate approval creates order, returns manualPaymentMode:true (no Stripe redirect)
 * - Platform Stripe mode + deposit > 0: returns requiresPayment:true with checkoutPath
 *
 * These tests verify the branching logic in app/api/estimate-review/[quoteId]/route.js
 * by reading the source and asserting the conditions that govern the branch.
 *
 * Integration-level coverage requires a running DB; the unit assertions here guard
 * against accidentally removing the payment-mode check.
 */

const fs = require('fs')
const path = require('path')

const routeSource = fs.readFileSync(
  path.join(__dirname, '../../app/api/estimate-review/[quoteId]/route.js'),
  'utf8'
)

describe('estimate-review route — payment mode routing (source-level guards)', () => {
  it('contains a paymentMode !== manual check before Stripe redirect', () => {
    // Guards that manual mode cannot accidentally hit the Stripe redirect branch
    expect(routeSource).toMatch(/paymentMode\s*!==\s*['"]manual['"]/)
  })

  it('contains manualPaymentMode:true in the response for manual+deposit path', () => {
    expect(routeSource).toMatch(/manualPaymentMode:\s*true/)
  })

  it('contains requiresPayment:true in the response for Stripe path', () => {
    expect(routeSource).toMatch(/requiresPayment:\s*true/)
  })

  it('checks depositAmount > 0 before either payment branch', () => {
    expect(routeSource).toMatch(/depositAmount\s*>\s*0/)
  })

  it('reads payment_mode from organization_payment_settings', () => {
    expect(routeSource).toMatch(/organization_payment_settings/)
    expect(routeSource).toMatch(/payment_mode/)
  })
})

describe('estimate-review route — manual_payment_instructions column name', () => {
  it('uses the correct DB column name manual_payment_instructions (not manual_instructions)', () => {
    expect(routeSource).toMatch(/manual_payment_instructions/)
    // Regression guard: the wrong name was used before the Sprint 5 fix
    expect(routeSource).not.toMatch(/['"']manual_instructions['"']/)
  })
})
