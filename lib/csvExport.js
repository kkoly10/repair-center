/**
 * Shared CSV utilities for admin export routes.
 */

export function csvRow(values) {
  return values
    .map((v) => {
      if (v === null || v === undefined) return ''
      const str = String(v)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    .join(',')
}

export function csvResponse(rows, filename) {
  const body = rows.join('\r\n')
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export function fmtAmount(cents) {
  const n = Number(cents || 0)
  return `$${n.toFixed(2)}`
}

export function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}
