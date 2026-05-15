#!/usr/bin/env node
/**
 * Scans the codebase for t('namespace.key') references and verifies that every
 * referenced key exists in messages/en.json. Also reports keys missing from
 * fr/es/pt (warnings only — they fall back to English).
 *
 * Run with: node scripts/check-i18n-keys.js
 * Exit code: 0 if all referenced keys exist in en.json; non-zero otherwise.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SCAN_DIRS = ['app', 'components', 'lib']
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__'])

function flatKeys(obj, prefix = '') {
  const out = new Set()
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    const full = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const x of flatKeys(v, full)) out.add(x)
    } else {
      out.add(full)
    }
  }
  return out
}

function* walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(f.name)) continue
    const p = path.join(dir, f.name)
    if (f.isDirectory()) yield* walk(p)
    else if (/\.(js|jsx|ts|tsx)$/.test(f.name)) yield p
  }
}

const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/en.json'), 'utf8'))
const fr = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/fr.json'), 'utf8'))
const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/es.json'), 'utf8'))
const pt = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/pt.json'), 'utf8'))

const enK = flatKeys(en)
const frK = flatKeys(fr)
const esK = flatKeys(es)
const ptK = flatKeys(pt)

// Match t('namespace.key') or t("namespace.key") with at least one dot in the key
const pattern = /\bt\(\s*['"`]([a-zA-Z][\w.]*\.[\w.]+)['"`]/g

const referenced = new Set()
const refLocations = new Map()
for (const dir of SCAN_DIRS) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) continue
  for (const file of walk(full)) {
    const src = fs.readFileSync(file, 'utf8')
    let m
    while ((m = pattern.exec(src)) !== null) {
      referenced.add(m[1])
      if (!refLocations.has(m[1])) refLocations.set(m[1], file.replace(ROOT + '/', ''))
    }
  }
}

const missingInEn = [...referenced].filter((k) => !enK.has(k))
const missingInFr = [...enK].filter((k) => !frK.has(k))
const missingInEs = [...enK].filter((k) => !esK.has(k))
const missingInPt = [...enK].filter((k) => !ptK.has(k))

console.log(`Scanned ${referenced.size} t() references`)
console.log(`en.json has ${enK.size} keys`)
console.log(`fr.json has ${frK.size} keys (missing ${missingInFr.length})`)
console.log(`es.json has ${esK.size} keys (missing ${missingInEs.length})`)
console.log(`pt.json has ${ptK.size} keys (missing ${missingInPt.length})`)

let exitCode = 0

if (missingInEn.length > 0) {
  console.error(`\n❌ ${missingInEn.length} key(s) referenced in code but missing from messages/en.json:`)
  for (const k of missingInEn) {
    console.error(`   - ${k}  (in ${refLocations.get(k)})`)
  }
  exitCode = 1
}

if (missingInFr.length > 0 || missingInEs.length > 0 || missingInPt.length > 0) {
  console.warn(`\n⚠️  Keys missing from non-English locales (will fall back to English):`)
  if (missingInFr.length > 0) console.warn(`   fr: ${missingInFr.length} missing — ${missingInFr.slice(0, 5).join(', ')}${missingInFr.length > 5 ? ', …' : ''}`)
  if (missingInEs.length > 0) console.warn(`   es: ${missingInEs.length} missing — ${missingInEs.slice(0, 5).join(', ')}${missingInEs.length > 5 ? ', …' : ''}`)
  if (missingInPt.length > 0) console.warn(`   pt: ${missingInPt.length} missing — ${missingInPt.slice(0, 5).join(', ')}${missingInPt.length > 5 ? ', …' : ''}`)
}

if (exitCode === 0) {
  console.log('\n✅ All referenced keys exist in messages/en.json')
}

process.exit(exitCode)
