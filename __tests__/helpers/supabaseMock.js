/**
 * Proxy-based Supabase mock factory.
 *
 * Any method call on the chain returns `this` (via Proxy), making it immune
 * to new `.limit()`, `.or()`, `.gte()`, etc. calls added to routes.
 *
 * Usage:
 *   const supabase = createSupabaseMock({
 *     repair_orders: { data: [{ id: '1' }], error: null },
 *     quote_requests: { data: null, error: { message: 'fail' } },
 *   })
 *   getSupabaseAdmin.mockReturnValue(supabase)
 *
 * Terminal methods (maybySingle, single, then) resolve with the configured
 * response for the active table. Unrecognised tables resolve with
 * { data: null, error: null }.
 *
 * For tables that need multiple sequential responses, pass an array:
 *   organizations: [
 *     { data: { id: 'org-1' }, error: null },  // first call
 *     { data: null, error: null },               // second call
 *   ]
 */
function createSupabaseMock(responses = {}) {
  const callCounts = {}

  function getResponse(table) {
    const entry = responses[table]
    if (!entry) return { data: null, error: null }
    if (Array.isArray(entry)) {
      const idx = callCounts[table] || 0
      callCounts[table] = idx + 1
      return entry[Math.min(idx, entry.length - 1)]
    }
    return entry
  }

  function makeChain(table) {
    const chain = {
      _table: table,
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => Promise.resolve(getResponse(table))),
      maybeSingle: jest.fn().mockImplementation(() => Promise.resolve(getResponse(table))),
      then: jest.fn().mockImplementation((resolve) => resolve(getResponse(table))),
    }
    // Proxy catches any other method we missed and returns `this`
    return new Proxy(chain, {
      get(target, prop) {
        if (prop in target) return target[prop]
        return jest.fn().mockReturnThis()
      },
    })
  }

  const fromMock = jest.fn().mockImplementation((table) => makeChain(table))

  return {
    from: fromMock,
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        download: jest.fn().mockResolvedValue({ data: Buffer.from(''), error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/photo.jpg' }, error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}

/**
 * After calling a route handler, retrieve the nth chain created for `table`.
 * n=0 is the first from(table) call, n=1 the second, etc.
 */
function getChain(supabaseMock, table, n = 0) {
  const matchingIndices = []
  supabaseMock.from.mock.calls.forEach(([t], i) => {
    if (t === table) matchingIndices.push(i)
  })
  const idx = matchingIndices[n]
  return idx !== undefined ? supabaseMock.from.mock.results[idx].value : null
}

module.exports = { createSupabaseMock, getChain }
