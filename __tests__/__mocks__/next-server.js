// Minimal mock for next/server used in API route tests
const NextResponse = {
  json: (body, init) => ({
    _body: body,
    status: init?.status ?? 200,
    json: async () => body,
    headers: new Map([['content-type', 'application/json']]),
  }),
  redirect: (url, init) => {
    const headers = new Map([['location', String(url)]])
    return {
      status: init?.status ?? 307,
      headers: {
        get: (k) => headers.get(String(k).toLowerCase()) || null,
      },
    }
  },
}

module.exports = { NextResponse }
