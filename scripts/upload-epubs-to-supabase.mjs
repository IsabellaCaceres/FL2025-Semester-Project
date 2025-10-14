#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalog } from '../lib/catalog.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const projectRoot = resolve(__dirname, '..')

async function loadEnv() {
  const envPath = resolve(projectRoot, '.env')
  try {
    const content = await fs.readFile(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!key || value === undefined) continue
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch {
    // ignore missing env file
  }
}

await loadEnv()

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'http://127.0.0.1:54321'
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)
const storageBucket = 'epubs'

function compactObject(value) {
  if (!value || typeof value !== 'object') return value
  const result = {}
  for (const [key, maybe] of Object.entries(value)) {
    if (maybe === undefined) continue
    result[key] = maybe
  }
  return result
}

async function uploadBookAsset(book) {
  const localPath = resolve(projectRoot, book.paths?.epub ?? '')
  const storagePath = `books/${book.contentHash}.epub`
  const data = await fs.readFile(localPath)

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, data, {
      contentType: 'application/epub+zip',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Storage upload failed for ${book.title}: ${uploadError.message}`)
  }

  const metadata = compactObject({
    authors: book.authors,
    contributors: book.contributors,
    subjects: book.subjects,
    genres: book.genres,
    identifiers: book.identifiers,
    summary: book.summary,
    language: book.language,
    publisher: book.publisher,
    published: book.published,
    rights: book.rights,
    cover: book.cover,
    paths: book.paths,
    file: book.file,
  })

  const payload = {
    content_hash: book.contentHash,
    title: book.title,
    author: book.author,
    filename: book.file?.name ?? null,
    filesize: book.file?.size ?? null,
    metadata,
    subjects: book.genres,
    description: book.summary ?? null,
    language: book.language ?? null,
    storage_path: storagePath,
    cover_image: book.cover?.uri ?? null,
  }

  const { error: upsertError } = await supabase
    .from('books')
    .upsert(payload, { onConflict: 'content_hash' })

  if (upsertError) {
    throw new Error(`Books upsert failed for ${book.title}: ${upsertError.message}`)
  }
}

async function main() {
  console.log(`[upload-epubs] Uploading ${catalog.length} books`)
  for (const book of catalog) {
    try {
      await uploadBookAsset(book)
      console.log(`[upload-epubs] Synced ${book.title}`)
    } catch (error) {
      console.error(`[upload-epubs] Failed ${book.title}: ${error.message}`)
    }
  }
  console.log('[upload-epubs] Done')
}

main().catch((error) => {
  console.error('[upload-epubs] Unexpected error', error)
  process.exit(1)
})
