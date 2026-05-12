// Minimal mock for next/server used in API route tests
const NextResponse = {
  json: (body, init) => ({
    _body: body,
    status: init?.status ?? 200,
    json: async () => body,
  }),
}

module.exports = { NextResponse }
