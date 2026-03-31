import { getSupabaseAdmin } from './supabase/admin'

const memoryStore = new Map()

export async function checkRateLimit(ip, { maxRequests = 5, windowMs = 60 * 60 * 1000 } = {}) {
  try {
    return await checkRateLimitSupabase(ip, maxRequests, windowMs)
  } catch {
    return checkRateLimitMemory(ip, maxRequests, windowMs)
  }
}

async function checkRateLimitSupabase(ip, maxRequests, windowMs) {
  const supabase = getSupabaseAdmin()
  const windowStart = new Date(Date.now() - windowMs).toISOString()

  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', windowStart)

  if (error) throw error

  if ((count || 0) >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  await supabase.from('rate_limits').insert({ ip_address: ip })

  return { allowed: true, remaining: maxRequests - (count || 0) - 1 }
}

function checkRateLimitMemory(ip, maxRequests, windowMs) {
  const now = Date.now()
  const timestamps = (memoryStore.get(ip) || []).filter((t) => t > now - windowMs)
  if (timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  timestamps.push(now)
  memoryStore.set(ip, timestamps)
  return { allowed: true, remaining: maxRequests - timestamps.length }
}
