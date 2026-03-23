// In-memory rate limiter. Adequate for a single-instance deployment.
// Replace with Upstash Redis if you scale to multiple instances.

const store = new Map() // ip -> number[]

export function checkRateLimit(ip, { maxRequests = 5, windowMs = 60 * 60 * 1000 } = {}) {
  const now = Date.now()
  const windowStart = now - windowMs

  const timestamps = (store.get(ip) || []).filter((t) => t > windowStart)

  if (timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  store.set(ip, timestamps)

  return { allowed: true, remaining: maxRequests - timestamps.length }
}
