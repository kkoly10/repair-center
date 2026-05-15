import { isReservedSlug, getReservedSlugs } from '../../lib/reservedSlugs'

describe('reservedSlugs', () => {
  test('rejects platform routes', () => {
    expect(isReservedSlug('admin')).toBe(true)
    expect(isReservedSlug('api')).toBe(true)
    expect(isReservedSlug('platform')).toBe(true)
    expect(isReservedSlug('shop')).toBe(true)
  })

  test('rejects common subdomain names', () => {
    expect(isReservedSlug('www')).toBe(true)
    expect(isReservedSlug('mail')).toBe(true)
    expect(isReservedSlug('support')).toBe(true)
    expect(isReservedSlug('status')).toBe(true)
  })

  test('rejects brand impersonation risks', () => {
    expect(isReservedSlug('repair-center')).toBe(true)
    expect(isReservedSlug('official')).toBe(true)
    expect(isReservedSlug('staff')).toBe(true)
    expect(isReservedSlug('security')).toBe(true)
  })

  test('allows normal shop slugs', () => {
    expect(isReservedSlug('joes-phone-repair')).toBe(false)
    expect(isReservedSlug('downtown-tech')).toBe(false)
    expect(isReservedSlug('repaircraft-lyon')).toBe(false)
    expect(isReservedSlug('best-repairs')).toBe(false)
  })

  test('is case-insensitive', () => {
    expect(isReservedSlug('ADMIN')).toBe(true)
    expect(isReservedSlug('Api')).toBe(true)
  })

  test('handles whitespace', () => {
    expect(isReservedSlug(' admin ')).toBe(true)
  })

  test('returns false for invalid input', () => {
    expect(isReservedSlug('')).toBe(false)
    expect(isReservedSlug(null)).toBe(false)
    expect(isReservedSlug(undefined)).toBe(false)
    expect(isReservedSlug(123)).toBe(false)
  })

  test('getReservedSlugs returns the list', () => {
    const list = getReservedSlugs()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(20)
    expect(list).toContain('admin')
  })
})
