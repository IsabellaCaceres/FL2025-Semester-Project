import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const keysPath = resolve(root, 'supabase/.temp/keys.json')
const envPath = resolve(root, '.env')

let url
let anon

// 1) Try keys.json (created by some CLI versions)
try {
  const raw = await readFile(keysPath, 'utf8')
  const json = JSON.parse(raw)
  url = json.api_url
  anon = json.anon
} catch {}

// 2) Fallback: parse `supabase status` output
if (!url || !anon) {
  try {
    const out = execSync('supabase status', { encoding: 'utf8' })
    const urlMatch = out.match(/API URL:\s*(\S+)/)
    const anonMatch = out.match(/anon key:\s*([^\n]+)/)
    url = urlMatch?.[1] || url
    anon = anonMatch?.[1] || anon
  } catch {}
}

// 3) Final fallback URL if still missing
if (!url) url = 'http://127.0.0.1:54321'

if (!anon) {
  console.error('Could not find anon key. Is Supabase running? Try `bun run supabase:start`.')
  process.exit(1)
}

const content = `EXPO_PUBLIC_SUPABASE_URL=${url}\nEXPO_PUBLIC_SUPABASE_ANON_KEY=${anon}\n`
await writeFile(envPath, content, 'utf8')
console.log('Wrote .env with Supabase URL and anon key')


