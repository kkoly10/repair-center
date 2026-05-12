export const ALLOWED_PHOTO_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
])

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
}

export function extensionForMime(mimeType) {
  return MIME_TO_EXT[mimeType] || 'jpg'
}

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
export const MAX_PHOTO_COUNT = 6
