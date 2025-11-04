#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'
import OpenAI from 'openai'
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

function zipDirname(path) {
  const normalized = path?.replace(/\\/g, '/') ?? ''
  const idx = normalized.lastIndexOf('/')
  return idx === -1 ? '' : normalized.slice(0, idx)
}

function joinZipPath(...segments) {
  const parts = []
  for (const segment of segments) {
    if (!segment) continue
    const normalized = segment.replace(/\\/g, '/').split('/')
    for (const part of normalized) {
      if (!part || part === '.') continue
      if (part === '..') {
        if (parts.length > 0) parts.pop()
        continue
      }
      parts.push(part)
    }
  }
  return parts.join('/')
}

function decodeHtmlEntities(text) {
  if (!text) return text
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&#34;/gi, '"')
}

function htmlToPlainText(html) {
  if (!html) return ''
  return decodeHtmlEntities(
    html
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function splitIntoChunks(words, { maxWords = 480, overlap = 80 } = {}) {
  const result = []
  if (!Array.isArray(words) || words.length === 0) return result
  const step = Math.max(1, maxWords - overlap)
  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + maxWords)
    if (slice.length < 24 && result.length > 0) {
      // append remainder to previous chunk to avoid tiny fragments
      result[result.length - 1] = {
        words: result[result.length - 1].words.concat(slice),
        start: result[result.length - 1].start,
      }
      break
    }
    result.push({ words: slice, start })
    if (slice.length < maxWords) break
  }
  return result
}

function approximateTokenCount(text) {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

async function buildBookChunks(book, { projectRoot }) {
  const localPath = resolve(projectRoot, book.paths?.epub ?? '')
  const buffer = await fs.readFile(localPath)
  const zip = await JSZip.loadAsync(buffer)

  const opfDir = zipDirname(book.paths?.opf ?? '')
  const manifestItems = Array.isArray(book.manifest?.items)
    ? book.manifest.items
    : []
  const manifestMap = new Map()
  for (const item of manifestItems) {
    const id = item?.id ?? item?.ID ?? item?.Id
    if (id) manifestMap.set(id, item)
  }

  const spineRefs = Array.isArray(book.spine?.itemrefs) ? book.spine.itemrefs : []
  const order = spineRefs.length > 0 ? spineRefs : manifestItems

  const sections = []
  let sectionIndex = 0

  for (const ref of order) {
    const idref = typeof ref === 'string' ? ref : ref?.idref ?? ref?.id ?? ref?.href
    if (!idref) continue
    const manifestItem = manifestMap.get(idref) || manifestMap.get(ref?.id ?? '')
    const candidate = manifestItem ?? (typeof ref === 'object' ? ref : null)
    if (!candidate) continue
    const mediaType = candidate['media-type'] ?? candidate.mediaType ?? candidate.type
    if (!mediaType || !/xhtml|html/i.test(mediaType)) continue
    const href = candidate.href ?? candidate.Href ?? candidate.path
    if (!href) continue
    const zipPath = joinZipPath(opfDir, href)
    const file = zip.file(zipPath)
    if (!file) continue
    const html = await file.async('string')
    const text = htmlToPlainText(html)
    if (!text) continue
    sections.push({
      text,
      zipPath,
      sectionIndex: sectionIndex++,
    })
  }

  const chunks = []
  let chunkIndex = 0
  for (const section of sections) {
    const words = section.text.split(/\s+/).filter(Boolean)
    if (words.length === 0) continue
    const slices = splitIntoChunks(words)
    for (const slice of slices) {
      const chunkText = slice.words.join(' ')
      const tokens = approximateTokenCount(chunkText)
      chunks.push({
        chunkIndex: chunkIndex++,
        text: chunkText,
        metadata: {
          section_index: section.sectionIndex,
          source: section.zipPath,
          start_word: slice.start,
          end_word: slice.start + slice.words.length,
          token_estimate: tokens,
        },
      })
    }
  }

  return chunks
}

function averageEmbedding(vectors) {
  if (!vectors || vectors.length === 0) return null
  const dimension = vectors[0].length
  const accumulator = new Array(dimension).fill(0)
  for (const vector of vectors) {
    for (let i = 0; i < dimension; i += 1) {
      accumulator[i] += vector[i]
    }
  }
  return accumulator.map((value) => value / vectors.length)
}

const openaiApiKey = process.env.OPENAI_API_KEY

if (!openaiApiKey) {
  console.error('Missing OPENAI_API_KEY in environment. Set it in .env before syncing EPUBs.')
  process.exit(1)
}

const openai = new OpenAI({ apiKey: openaiApiKey })

async function generateBookInsights({ book, sampleText }) {
  const summarySource =
    book.summary ||
    book.description ||
    book.metadata?.description ||
    book.metadata?.summary ||
    ''

  const promptLines = [
    `Title: ${book.title}`,
    `Authors: ${(book.authors ?? []).join(', ') || book.author || 'Unknown'}`,
    `Genres: ${(book.genres ?? []).join(', ') || 'Unknown'}`,
  ]
  if (summarySource) {
    promptLines.push(`Catalog Description: ${summarySource}`)
  }
  if (sampleText) {
    promptLines.push(`Sample Text: ${sampleText}`)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You create structured metadata for book recommendations. Respond with JSON including summary, themes, tones, pacing, audience, contentWarnings, hook, keywords, and similarAuthors.',
        },
        {
          role: 'user',
          content: promptLines.join('\n'),
        },
      ],
    })

    const jsonText = completion.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(jsonText)
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : summarySource,
      traits: {
        themes: Array.isArray(parsed.themes) ? parsed.themes : [],
        tones: Array.isArray(parsed.tones) ? parsed.tones : [],
        pacing: typeof parsed.pacing === 'string' ? parsed.pacing : null,
        audience: typeof parsed.audience === 'string' ? parsed.audience : null,
        contentWarnings: Array.isArray(parsed.contentWarnings) ? parsed.contentWarnings : [],
        hook: typeof parsed.hook === 'string' ? parsed.hook : null,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        similarAuthors: Array.isArray(parsed.similarAuthors) ? parsed.similarAuthors : [],
      },
    }
  } catch (error) {
    console.warn(`[embed] Failed to generate insights for ${book.title}: ${error.message}`)
    return {
      summary: summarySource,
      traits: {
        themes: book.genres ?? [],
        tones: [],
        pacing: null,
        audience: null,
        contentWarnings: [],
        hook: null,
        keywords: book.metadata?.keywords ?? [],
        similarAuthors: [],
      },
    }
  }
}

async function upsertEmbeddings({ supabase, bookRecord, book, projectRoot }) {
  const chunks = await buildBookChunks(book, { projectRoot })
  if (chunks.length === 0) {
    console.warn(`[embed] Skipped ${book.title}: no readable text sections found`)
    return
  }

  const embeddings = []
  const batchSize = 16
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch.map((chunk) => chunk.text),
    })
    for (let j = 0; j < response.data.length; j += 1) {
      const vector = response.data[j].embedding
      const chunk = batch[j]
      chunk.embedding = vector
      embeddings.push(vector)
    }
  }

  const mean = averageEmbedding(embeddings)

  await supabase.from('book_embeddings').delete().eq('book_id', bookRecord.id)

  const records = chunks.map((chunk) => ({
    book_id: bookRecord.id,
    chunk_index: chunk.chunkIndex,
    content: chunk.text,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
  }))

  const insertBatchSize = 100
  for (let i = 0; i < records.length; i += insertBatchSize) {
    const slice = records.slice(i, i + insertBatchSize)
    const { error } = await supabase.from('book_embeddings').insert(slice)
    if (error) {
      throw new Error(`Unable to insert embeddings for ${book.title}: ${error.message}`)
    }
  }

  const sampleText = records
    .slice(0, 3)
    .map((record) => record.content)
    .join(' ')
    .slice(0, 4000)

  const insights = await generateBookInsights({ book, sampleText })

  const updatePayload = {}
  if (mean) updatePayload.semantic_embedding = mean
  if (insights.summary) updatePayload.ai_summary = insights.summary
  if (insights.traits) updatePayload.ai_traits = insights.traits

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from('books')
      .update(updatePayload)
      .eq('id', bookRecord.id)
    if (error) {
      throw new Error(`Unable to update book insights for ${book.title}: ${error.message}`)
    }
  }

  console.log(`  [embed] Stored ${records.length} chunks for ${book.title}`)
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

  const { data: bookRow, error: fetchError } = await supabase
    .from('books')
    .select('id, content_hash')
    .eq('content_hash', book.contentHash)
    .maybeSingle()

  if (fetchError || !bookRow) {
    throw new Error(`Unable to load book record for ${book.title}: ${fetchError?.message ?? 'not found'}`)
  }

  return bookRow
}

async function main() {
  console.log(`[upload-epubs] Uploading ${catalog.length} books`)
  for (const book of catalog) {
    try {
      const bookRecord = await uploadBookAsset(book)
      await upsertEmbeddings({ supabase, bookRecord, book, projectRoot })
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
