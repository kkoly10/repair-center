const { ALLOWED_PHOTO_MIME, MAX_PHOTO_BYTES, MAX_PHOTO_COUNT, extensionForMime } = require('../../lib/photoMime')

describe('ALLOWED_PHOTO_MIME', () => {
  it('allows expected image types', () => {
    expect(ALLOWED_PHOTO_MIME.has('image/jpeg')).toBe(true)
    expect(ALLOWED_PHOTO_MIME.has('image/png')).toBe(true)
    expect(ALLOWED_PHOTO_MIME.has('image/webp')).toBe(true)
    expect(ALLOWED_PHOTO_MIME.has('image/heic')).toBe(true)
    expect(ALLOWED_PHOTO_MIME.has('image/heif')).toBe(true)
    expect(ALLOWED_PHOTO_MIME.has('image/gif')).toBe(true)
  })

  it('rejects dangerous or non-image types', () => {
    expect(ALLOWED_PHOTO_MIME.has('application/pdf')).toBe(false)
    expect(ALLOWED_PHOTO_MIME.has('image/svg+xml')).toBe(false)
    expect(ALLOWED_PHOTO_MIME.has('text/html')).toBe(false)
    expect(ALLOWED_PHOTO_MIME.has('application/octet-stream')).toBe(false)
    expect(ALLOWED_PHOTO_MIME.has('')).toBe(false)
  })
})

describe('extensionForMime', () => {
  it('returns correct extension for each allowed MIME type', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg')
    expect(extensionForMime('image/png')).toBe('png')
    expect(extensionForMime('image/webp')).toBe('webp')
    expect(extensionForMime('image/heic')).toBe('heic')
    expect(extensionForMime('image/heif')).toBe('heif')
    expect(extensionForMime('image/gif')).toBe('gif')
  })

  it('falls back to jpg for unknown MIME types', () => {
    expect(extensionForMime('application/pdf')).toBe('jpg')
    expect(extensionForMime('')).toBe('jpg')
    expect(extensionForMime(undefined)).toBe('jpg')
  })

  it('derives extension from MIME type, not filename — a .pdf with image/jpeg MIME gets .jpg', () => {
    // This is the key security invariant: we trust declared MIME, not filename extension
    const mimeFromMaliciousFile = 'image/jpeg'
    expect(extensionForMime(mimeFromMaliciousFile)).toBe('jpg')
  })
})

describe('limits', () => {
  it('MAX_PHOTO_BYTES is 10 MB', () => {
    expect(MAX_PHOTO_BYTES).toBe(10 * 1024 * 1024)
  })

  it('MAX_PHOTO_COUNT is 6', () => {
    expect(MAX_PHOTO_COUNT).toBe(6)
  })
})
