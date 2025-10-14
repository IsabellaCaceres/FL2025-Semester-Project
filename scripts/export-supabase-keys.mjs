import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const keysPath = resolve(root, 'supabase/.temp/keys.json')
const envPath = resolve(root, '.env')

let url
let anon
let service

function runSupabase(args) {
  return spawnSync(process.execPath, ['./scripts/supabase-cli.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
  })
}

// 1) Try keys.json (created by some CLI versions)
try {
  const raw = await readFile(keysPath, 'utf8')
  const json = JSON.parse(raw)
  url = json.api_url
  anon = json.anon
  service = json.service_role
} catch {}

// 2) Fallback: parse `supabase status` output
if (!url || !anon) {
  try {
    const { stdout } = runSupabase(['status', '-o', 'env'])
    if (stdout) {
      const urlMatch = stdout.match(/^API_URL="?([^"\n]+)"?/m)
      const anonMatch = stdout.match(/^ANON_KEY="?([^"\n]+)"?/m)
      const serviceMatch = stdout.match(/^SERVICE_ROLE_KEY="?([^"\n]+)"?/m)
      url = urlMatch?.[1] || url
      anon = anonMatch?.[1] || anon
      service = serviceMatch?.[1] || service
    }
  } catch {}
}

if (!url || !anon) {
  try {
    const { stdout } = runSupabase(['status'])
    if (stdout) {
      const urlMatch = stdout.match(/API URL:\s*(\S+)/)
      const anonMatch = stdout.match(/anon key:\s*([^\n]+)/i)
      const serviceMatch = stdout.match(/Secret key:\s*([^\s\n]+)/i)
      url = urlMatch?.[1] || url
      anon = anonMatch?.[1] || anon
      service = serviceMatch?.[1] || service
    }
  } catch {}
}

// 3) Final fallback URL if still missing
if (!url) url = 'http://127.0.0.1:54321'

if (!anon) {
  console.error('Could not find anon key. Is Supabase running? Try `bun run supabase:start`.')
  process.exit(1)
}

let existingContent = ''
try {
  existingContent = await readFile(envPath, 'utf8')
} catch {}

const existingLines = existingContent ? existingContent.split(/\r?\n/) : []
const envFromFile = new Map()

for (const line of existingLines) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/)
  if (match) {
    envFromFile.set(match[1], match[2])
  }
}

if (!service && envFromFile.has('SUPABASE_SERVICE_ROLE_KEY')) {
  service = envFromFile.get('SUPABASE_SERVICE_ROLE_KEY')
}

const updates = new Map([
  ['EXPO_PUBLIC_SUPABASE_URL', url],
  ['EXPO_PUBLIC_SUPABASE_ANON_KEY', anon],
])

if (service) {
  updates.set('SUPABASE_SERVICE_ROLE_KEY', service)
} else {
  console.warn('Warning: Could not find service_role key. Some scripts (e.g. supabase:sync-epubs) need it.')
}

const mergedLines = []

for (const line of existingLines) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/)
  if (match) {
    const key = match[1]
    if (updates.has(key)) {
      mergedLines.push(`${key}=${updates.get(key)}`)
      updates.delete(key)
      continue
    }
  }
  mergedLines.push(line)
}

for (const [key, value] of updates) {
  mergedLines.push(`${key}=${value}`)
}

const content = `${mergedLines.join('\n').replace(/\n*$/, '')}\n`
await writeFile(envPath, content, 'utf8')
console.log('Wrote .env with Supabase URL, anon key, and service role key (if available)')
