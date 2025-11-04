#!/usr/bin/env node

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

function loadEnv() {
  const envPath = resolve(projectRoot, '.env')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key) {
      process.env[key] = value
    }
  }
}

loadEnv()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const port = Number(process.env.PORT || 4000)
const openaiApiKey = process.env.OPENAI_API_KEY || ''

const app = express()
app.use(
  cors({
    origin: true,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '10mb' }))
app.use(cookieParser())

function createAnonClient() {
  return createClient(supabaseUrl, anonKey)
}

const serviceClient = createClient(supabaseUrl, serviceRoleKey)
const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null
const SESSION_COOKIE = 'session_id'
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 30,
}

function logError(step, error) {
  if (!error) return
  const detail = error.message || error.toString?.() || String(error)
  console.error(`[api] ${step}: ${detail}`)
}

function shapeListRow(row) {
  if (!row) return null
  const items = Array.isArray(row.list_items) ? row.list_items : []
  const hydratedItems = items
    .map((item) => {
      if (!item) return null
      const contentHash = item.books?.content_hash ?? null
      if (!contentHash) return null
      return {
        book_id: item.book_id,
        content_hash: contentHash,
        position: item.position ?? null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const posA = typeof a.position === 'number' ? a.position : Number.MAX_SAFE_INTEGER
      const posB = typeof b.position === 'number' ? b.position : Number.MAX_SAFE_INTEGER
      if (posA !== posB) return posA - posB
      return a.content_hash.localeCompare(b.content_hash)
    })

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: hydratedItems,
  }
}

async function loadListForUser(listId, userId) {
  const { data, error } = await serviceClient
    .from('lists')
    .select(
      `id, user_id, name, description, created_at, updated_at,
       list_items ( book_id, position, books ( content_hash ) )`
    )
    .eq('id', listId)
    .maybeSingle()
  if (error) {
    logError('load-list', error)
    return { data: null, error }
  }
  if (!data || data.user_id !== userId) {
    return { data: null, error: null }
  }
  return { data: shapeListRow(data), error: null }
}

function normalizeUsername(rawUsername = '') {
  return rawUsername.trim().toLowerCase().replace(/\s+/g, '')
}

function buildEmail(username) {
  return `${username}@local.goodreads-demo`
}

function listify(values, { max = 3 } = {}) {
  if (!Array.isArray(values) || values.length === 0) return ''
  const slice = values.slice(0, max)
  if (slice.length === 1) return slice[0]
  const last = slice.pop()
  return `${slice.join(', ')} and ${last}`
}

function ensureOpenAI() {
  if (!openaiClient) {
    throw new Error('OpenAI client not configured')
  }
}

async function createEmbedding(text) {
  ensureOpenAI()
  const response = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data?.[0]?.embedding ?? null
}

function aggregateMatches(matches) {
  const bookMap = new Map()
  for (const match of matches || []) {
    const bookId = match?.book_id
    if (!bookId) continue
    const similarity = Number(match?.similarity ?? 0)
    const entry = bookMap.get(bookId) ?? {
      bookId,
      bestScore: -Infinity,
      totalScore: 0,
      snippets: [],
      matches: [],
    }
    entry.matches.push(match)
    entry.totalScore += Math.max(similarity, 0)
    if (similarity > entry.bestScore) entry.bestScore = similarity
    if (entry.snippets.length < 3 && typeof match?.content === 'string') {
      entry.snippets.push(match.content.slice(0, 500))
    }
    bookMap.set(bookId, entry)
  }
  return Array.from(bookMap.values()).sort((a, b) => {
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    return 0
  })
}

function buildReasoningPayload(query, aggregated, bookMap) {
  const candidates = []
  for (const entry of aggregated) {
    const row = bookMap.get(entry.bookId)
    if (!row) continue
    const traits = typeof row.ai_traits === 'object' && row.ai_traits !== null ? row.ai_traits : {}
    const summary =
      row.ai_summary ??
      row.description ??
      row.metadata?.summary ??
      row.metadata?.description ??
      ''
    candidates.push({
      bookId: row.content_hash,
      bookUuid: row.id,
      title: row.title,
      author: row.author,
      summary,
      traits,
      similarity: Number(entry.bestScore ?? 0),
      snippets: entry.snippets,
    })
  }
  return { query, candidates }
}

async function generateSemanticReasons(payload) {
  ensureOpenAI()
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise literary matchmaker. Return JSON with keys "reasoning" (string, 1-2 sentences) and "recommendations" (array of objects with bookId, reason, confidence). Reference only provided candidates.',
        },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    })
    const content = completion.choices?.[0]?.message?.content ?? ''
    if (!content) return null
    return JSON.parse(content)
  } catch (error) {
    logError('semantic-reasoning', error)
    return null
  }
}

function buildFallbackReason(query, candidate) {
  const pieces = []
  const themes = Array.isArray(candidate?.traits?.themes) ? candidate.traits.themes.filter(Boolean) : []
  const tones = Array.isArray(candidate?.traits?.tones) ? candidate.traits.tones.filter(Boolean) : []
  if (themes.length) pieces.push(`themes like ${listify(themes)}`)
  if (tones.length) pieces.push(`${tones[0]} tone`)
  return pieces.length
    ? `Matches "${query}" with ${pieces.join(' and ')}`
    : `Matches the vibe of "${query}" from our catalog`
}

async function logSemanticQuery({ userId, query, embedding, bookIds, reasoning }) {
  try {
    await serviceClient.from('user_query_logs').insert({
      user_id: userId,
      query,
      query_embedding: embedding,
      metadata: {
        book_ids: bookIds,
        reasoning,
      },
    })
  } catch (error) {
    logError('user-query-log', error)
  }
}

async function upsertRecommendations({ userId, results, source, query }) {
  if (!results || results.length === 0) return
  const generatedAt = new Date().toISOString()
  const rows = results.map((item) => ({
    user_id: userId,
    book_id: item.bookUuid,
    source,
    score: item.similarity ?? null,
    reason: item.reason ?? null,
    metadata: {
      confidence: item.confidence ?? null,
      query,
      traits: item.traits ?? null,
    },
    generated_at: generatedAt,
  }))
  const { error } = await serviceClient
    .from('personalized_recommendations')
    .upsert(rows, { onConflict: 'user_id,book_id,source' })
  if (error) {
    logError('recommendations-upsert', error)
  }
}

async function createSession(userId) {
  const id = randomUUID()
  const { error } = await serviceClient.from('web_sessions').insert({ id, user_id: userId })
  if (error) {
    throw new Error(error.message)
  }
  return id
}

async function getSession(sessionId) {
  const { data, error } = await serviceClient
    .from('web_sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .maybeSingle()
  if (error) {
    logError('getSession', error)
    return null
  }
  return data || null
}

async function deleteSession(sessionId) {
  const { error } = await serviceClient.from('web_sessions').delete().eq('id', sessionId)
  if (error) {
    logError('deleteSession', error)
  }
}

async function loadUser(userId) {
  const { data, error } = await serviceClient.auth.admin.getUserById(userId)
  if (error) {
    logError('loadUser', error)
    return null
  }
  return data?.user || null
}

function attachUserMetadata(user, username) {
  if (!user) return null
  const metadata = { ...(user.user_metadata || {}) }
  if (username) {
    metadata.username = username
  }
  return { ...user, user_metadata: metadata }
}

async function requireSession(req, res, next) {
  const sessionId = req.cookies?.[SESSION_COOKIE]
  if (!sessionId) {
    res.status(401).end()
    return
  }
  const session = await getSession(sessionId)
  if (!session) {
    res.status(401).end()
    return
  }
  req.session = session
  next()
}

app.post('/api/auth/sign-in', async (req, res) => {
  try {
    const { username = '', password = '' } = req.body || {}
    const normalized = normalizeUsername(username)
    const email = buildEmail(normalized)
    const authClient = createAnonClient()
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      res.status(401).json({ error: error.message })
      return
    }
    const user = attachUserMetadata(data?.user || null, normalized)
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const { error: metadataError } = await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: user.user_metadata,
    })
    if (metadataError) {
      logError('updateUserMetadata', metadataError)
    }
    const sessionId = await createSession(user.id)
    res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS)
    res.json({ user })
  } catch (error) {
    logError('sign-in', error)
    res.status(500).json({ error: 'Sign-in failed' })
  }
})

app.post('/api/auth/sign-up', async (req, res) => {
  try {
    const { username = '', password = '' } = req.body || {}
    const normalized = normalizeUsername(username)
    const email = buildEmail(normalized)
    const { error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: normalized },
    })
    if (createError) {
      const code = createError.code === '23505' ? 409 : 400
      res.status(code).json({ error: createError.message })
      return
    }
    const authClient = createAnonClient()
    const { data, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      res.status(401).json({ error: signInError.message })
      return
    }
    const user = attachUserMetadata(data?.user || null, normalized)
    if (!user) {
      res.status(401).json({ error: 'Unable to create user session' })
      return
    }
    const sessionId = await createSession(user.id)
    res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS)
    res.json({ user })
  } catch (error) {
    logError('sign-up', error)
    res.status(500).json({ error: 'Sign-up failed' })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { username = '', currentPassword = '', newPassword = '' } = req.body || {}
    const normalized = normalizeUsername(username)
    const email = buildEmail(normalized)
    const authClient = createAnonClient()
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password: currentPassword,
    })
    if (error) {
      res.status(401).json({ error: error.message })
      return
    }
    const user = data?.user
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })
    if (updateError) {
      res.status(400).json({ error: updateError.message })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    logError('reset-password', error)
    res.status(500).json({ error: 'Password reset failed' })
  }
})

app.post('/api/auth/sign-out', requireSession, async (req, res) => {
  try {
    await deleteSession(req.session.id)
    res.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS)
    res.json({ ok: true })
  } catch (error) {
    logError('sign-out', error)
    res.status(500).json({ error: 'Sign-out failed' })
  }
})

app.get('/api/auth/me', requireSession, async (req, res) => {
  try {
    const user = await loadUser(req.session.user_id)
    if (!user) {
      res.status(401).json({ error: 'Session not found' })
      return
    }
    res.json({ user })
  } catch (error) {
    logError('auth-me', error)
    res.status(500).json({ error: 'Failed to load user' })
  }
})

app.post('/api/search/semantic', requireSession, async (req, res) => {
  try {
    if (!openaiClient) {
      res.status(503).json({ error: 'AI search is not configured' })
      return
    }
    const { query = '', limit = 5 } = req.body || {}
    const trimmed = typeof query === 'string' ? query.trim() : ''
    if (!trimmed) {
      res.status(400).json({ error: 'Enter a search prompt first' })
      return
    }
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 8)

    const embedding = await createEmbedding(trimmed)
    if (!embedding) {
      res.status(500).json({ error: 'Failed to embed search prompt' })
      return
    }

    const matchCount = Math.min(24, safeLimit * 4)
    const { data: matches, error: matchError } = await serviceClient.rpc(
      'match_book_chunks',
      {
        query_embedding: embedding,
        match_count: matchCount,
      }
    )
    if (matchError) {
      logError('semantic-match', matchError)
      res.status(500).json({ error: matchError.message })
      return
    }

    const aggregated = aggregateMatches(matches).slice(0, safeLimit)
    if (aggregated.length === 0) {
      await logSemanticQuery({
        userId: req.session.user_id,
        query: trimmed,
        embedding,
        bookIds: [],
        reasoning: null,
      })
      res.json({
        query: trimmed,
        reasoning: `I couldn't find anything in the catalog that matches "${trimmed}" yet.`,
        results: [],
      })
      return
    }

    const bookIds = aggregated.map((entry) => entry.bookId)
    const { data: bookRows, error: booksError } = await serviceClient
      .from('books')
      .select('id, content_hash, title, author, cover_image, ai_summary, ai_traits, description, metadata')
      .in('id', bookIds)
    if (booksError) {
      logError('semantic-books', booksError)
      res.status(500).json({ error: booksError.message })
      return
    }

    const bookMap = new Map()
    for (const row of bookRows || []) {
      bookMap.set(row.id, row)
    }

    const payload = buildReasoningPayload(trimmed, aggregated, bookMap)
    const reasonData = await generateSemanticReasons(payload)
    const reasonMap = new Map()
    let reasoningText = ''
    if (reasonData) {
      reasoningText = typeof reasonData.reasoning === 'string' ? reasonData.reasoning : ''
      if (Array.isArray(reasonData.recommendations)) {
        for (const item of reasonData.recommendations) {
          if (item?.bookId) {
            reasonMap.set(item.bookId, item)
          }
        }
      }
    }

    const results = []
    for (const candidate of payload.candidates) {
      const bookRow = bookMap.get(candidate.bookUuid)
      if (!bookRow) continue
      const reasonRecord = reasonMap.get(candidate.bookId)
      const reason = typeof reasonRecord?.reason === 'string'
        ? reasonRecord.reason
        : buildFallbackReason(trimmed, candidate)
      const confidence = typeof reasonRecord?.confidence === 'number' ? reasonRecord.confidence : null
      results.push({
        bookId: candidate.bookId,
        bookUuid: candidate.bookUuid,
        title: bookRow.title,
        author: bookRow.author,
        coverImage: bookRow.cover_image,
        summary: candidate.summary,
        snippets: candidate.snippets,
        traits: candidate.traits,
        reason,
        confidence,
        similarity: candidate.similarity,
      })
    }

    if (!reasoningText) {
      reasoningText = `Here’s what I found for "${trimmed}".`
    }

    await logSemanticQuery({
      userId: req.session.user_id,
      query: trimmed,
      embedding,
      bookIds: results.map((item) => item.bookUuid),
      reasoning: reasoningText,
    })

    await upsertRecommendations({
      userId: req.session.user_id,
      results,
      source: 'semantic',
      query: trimmed,
    })

    res.json({
      query: trimmed,
      reasoning: reasoningText,
      results,
    })
  } catch (error) {
    logError('semantic-search', error)
    res.status(500).json({ error: 'Semantic search failed' })
  }
})

app.get('/api/search/recommendations', requireSession, async (req, res) => {
  try {
    const limitParam = Number(req.query?.limit)
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 8, 1), 12)

    const { data: cachedRows, error: cachedError } = await serviceClient
      .from('personalized_recommendations')
      .select('book_id, source, score, reason, metadata, books (id, content_hash, title, author, cover_image, ai_summary, ai_traits, metadata)')
      .eq('user_id', req.session.user_id)
      .order('generated_at', { ascending: false })
      .limit(limit * 3)
    if (cachedError) {
      logError('recommendations-cached', cachedError)
    }

    const results = []
    const seenBooks = new Set()

    if (cachedRows) {
      for (const row of cachedRows) {
        const book = row?.books
        if (!book || seenBooks.has(book.id)) continue
        seenBooks.add(book.id)
        results.push({
          bookId: book.content_hash,
          bookUuid: book.id,
          title: book.title,
          author: book.author,
          coverImage: book.cover_image,
          summary: book.ai_summary ?? book.metadata?.summary ?? '',
          reason: row.reason ?? null,
          confidence: row.metadata?.confidence ?? null,
          similarity: row.score ?? null,
          traits: book.ai_traits ?? null,
          source: row.source,
        })
        if (results.length >= limit) break
      }
    }

    const profileResults = []
    const catalogFallback = []

    if (results.length < limit) {
      const { data: libraryRows, error: libraryError } = await serviceClient
        .from('user_books')
        .select('book_id, books (id, content_hash, ai_traits)')
        .eq('user_id', req.session.user_id)
      if (libraryError) {
        logError('recommendations-library', libraryError)
      }

      const profile = {
        themes: new Map(),
        tones: new Map(),
        keywords: new Map(),
      }
      const libraryIds = new Set()
      for (const row of libraryRows || []) {
        const book = row?.books
        if (!book) continue
        libraryIds.add(book.id)
        const traits = book.ai_traits ?? {}
        for (const theme of traits.themes ?? []) {
          const count = profile.themes.get(theme) ?? 0
          profile.themes.set(theme, count + 1)
        }
        for (const tone of traits.tones ?? []) {
          const count = profile.tones.get(tone) ?? 0
          profile.tones.set(tone, count + 1)
        }
        for (const keyword of traits.keywords ?? []) {
          const count = profile.keywords.get(keyword) ?? 0
          profile.keywords.set(keyword, count + 1)
        }
      }

      const { data: allBooks, error: allBooksError } = await serviceClient
        .from('books')
        .select('id, content_hash, title, author, cover_image, ai_summary, ai_traits, metadata')
      if (allBooksError) {
        logError('recommendations-books', allBooksError)
      } else if (allBooks) {
        const profileCandidates = []
        for (const book of allBooks) {
          if (libraryIds.has(book.id) || seenBooks.has(book.id)) continue
          const traits = book.ai_traits ?? {}
          const overlaps = {
            themes: (traits.themes ?? []).filter((value) => profile.themes.has(value)),
            tones: (traits.tones ?? []).filter((value) => profile.tones.has(value)),
            keywords: (traits.keywords ?? []).filter((value) => profile.keywords.has(value)),
          }
          let score = 0
          for (const theme of overlaps.themes) {
            score += 3 + (profile.themes.get(theme) ?? 0)
          }
          for (const tone of overlaps.tones) {
            score += 2 + (profile.tones.get(tone) ?? 0)
          }
          for (const keyword of overlaps.keywords) {
            score += 1 + Math.min(1, profile.keywords.get(keyword) ?? 0)
          }
          if (score <= 0) continue
          profileCandidates.push({ book, score, overlaps })
        }

        profileCandidates.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return a.book.title.localeCompare(b.book.title)
        })

        for (const candidate of profileCandidates) {
          if (results.length + profileResults.length >= limit) break
          const { book, overlaps } = candidate
          const reasonParts = []
          if (overlaps.themes.length) {
            reasonParts.push(`shares themes like ${listify(overlaps.themes)}`)
          }
          if (overlaps.tones.length) {
            reasonParts.push(`carries a ${overlaps.tones[0].toLowerCase()} tone`)
          }
          if (overlaps.keywords.length && reasonParts.length < 2) {
            reasonParts.push(`touches on ${listify(overlaps.keywords)}`)
          }
          const reason = reasonParts.length
            ? `Because it ${reasonParts.join(' and ')}.`
            : 'Resonates with the interests from your library.'
          const item = {
            bookId: book.content_hash,
            bookUuid: book.id,
            title: book.title,
            author: book.author,
            coverImage: book.cover_image,
            summary: book.ai_summary ?? book.metadata?.summary ?? '',
            reason,
            confidence: null,
            similarity: candidate.score,
            traits: book.ai_traits ?? null,
            source: 'profile',
          }
          profileResults.push(item)
          seenBooks.add(book.id)
        }

        if (results.length + profileResults.length < limit) {
          for (const book of allBooks) {
            if (results.length + profileResults.length + catalogFallback.length >= limit) break
            if (libraryIds.has(book.id) || seenBooks.has(book.id)) continue
            const item = {
              bookId: book.content_hash,
              bookUuid: book.id,
              title: book.title,
              author: book.author,
              coverImage: book.cover_image,
              summary: book.ai_summary ?? book.metadata?.summary ?? '',
              reason: 'A standout pick from the catalog to explore next.',
              confidence: null,
              similarity: null,
              traits: book.ai_traits ?? null,
              source: 'catalog',
            }
            catalogFallback.push(item)
            seenBooks.add(book.id)
          }
        }
      }
    }

    const profileSlice = profileResults.slice(0, Math.max(0, limit - results.length))
    results.push(...profileSlice)
    let catalogSlice = []
    if (results.length < limit) {
      catalogSlice = catalogFallback.slice(0, Math.max(0, limit - results.length))
      results.push(...catalogSlice)
    }

    await upsertRecommendations({
      userId: req.session.user_id,
      results: profileSlice,
      source: 'profile',
      query: 'profile',
    })

    await upsertRecommendations({
      userId: req.session.user_id,
      results: catalogSlice,
      source: 'catalog',
      query: 'catalog',
    })

    res.json({ results: results.slice(0, limit) })
  } catch (error) {
    logError('recommendations', error)
    res.status(500).json({ error: 'Failed to load recommendations' })
  }
})

app.get('/api/library/records', requireSession, async (req, res) => {
  try {
    const { data: books, error: booksError } = await serviceClient
      .from('books')
      .select('id, content_hash, storage_path')
    if (booksError) {
      logError('library-records books', booksError)
      res.status(500).json({ error: booksError.message })
      return
    }
    const { data: userRows, error: libraryError } = await serviceClient
      .from('user_books')
      .select('book_id, books (content_hash)')
      .eq('user_id', req.session.user_id)
    if (libraryError) {
      logError('library-records user_books', libraryError)
      res.status(500).json({ error: libraryError.message })
      return
    }
    const library = []
    for (const row of userRows || []) {
      const contentHash = row?.books?.content_hash
      if (contentHash) {
        library.push({
          book_id: row.book_id,
          content_hash: contentHash,
        })
      }
    }
    res.json({
      records: books || [],
      library,
    })
  } catch (error) {
    logError('library-records', error)
    res.status(500).json({ error: 'Failed to load library records' })
  }
})

app.get('/api/lists', requireSession, async (req, res) => {
  try {
    const { data, error } = await serviceClient
      .from('lists')
      .select(
        `id, name, description, created_at, updated_at,
         list_items ( book_id, position, books ( content_hash ) )`
      )
      .eq('user_id', req.session.user_id)
      .order('updated_at', { ascending: false })
    if (error) {
      logError('lists-fetch', error)
      res.status(500).json({ error: error.message })
      return
    }
    const lists = (data || []).map(shapeListRow).filter(Boolean)
    res.json({ lists })
  } catch (error) {
    logError('lists-fetch', error)
    res.status(500).json({ error: 'Failed to load lists' })
  }
})

app.post('/api/lists', requireSession, async (req, res) => {
  try {
    const { name = '', description = null, bookIds: rawBookIds = [] } = req.body || {}
    const normalizedName = typeof name === 'string' ? name.trim() : ''
    if (!normalizedName) {
      res.status(400).json({ error: 'List name is required' })
      return
    }

    const bookIds = Array.isArray(rawBookIds)
      ? Array.from(
          new Set(
            rawBookIds
              .map((id) => (typeof id === 'string' || typeof id === 'number' ? String(id).trim() : null))
              .filter((id) => id && id.length > 0)
          )
        )
      : []

    if (bookIds.length === 0) {
      res.status(400).json({ error: 'At least one book is required' })
      return
    }

    const payload = {
      user_id: req.session.user_id,
      name: normalizedName,
      description: typeof description === 'string' && description.trim().length > 0 ? description.trim() : null,
    }

    const { data: createdList, error: insertError } = await serviceClient
      .from('lists')
      .insert(payload)
      .select('id')
      .maybeSingle()

    if (insertError) {
      logError('lists-create', insertError)
      const status = insertError.code === '23505' ? 409 : 400
      res.status(status).json({ error: insertError.message })
      return
    }

    if (!createdList) {
      res.status(500).json({ error: 'Failed to create list' })
      return
    }

    const itemsPayload = bookIds.map((bookId, index) => ({
      list_id: createdList.id,
      book_id: bookId,
      position: index,
      added_by: req.session.user_id,
    }))

    const { error: itemsError } = await serviceClient.from('list_items').upsert(itemsPayload, {
      onConflict: 'list_id,book_id',
    })

    if (itemsError) {
      logError('list-items-upsert', itemsError)
      await serviceClient.from('lists').delete().eq('id', createdList.id)
      res.status(400).json({ error: itemsError.message })
      return
    }

    const { data: list, error: loadError } = await loadListForUser(createdList.id, req.session.user_id)
    if (loadError) {
      res.status(500).json({ error: 'Failed to load created list' })
      return
    }
    if (!list) {
      res.status(404).json({ error: 'List not found after creation' })
      return
    }

    res.status(201).json({ list })
  } catch (error) {
    logError('lists-create', error)
    res.status(500).json({ error: 'Failed to create list' })
  }
})

app.post('/api/library/books', requireSession, async (req, res) => {
  try {
    const payloads = Array.isArray(req.body) ? req.body : []
    if (payloads.length === 0) {
      res.json({ ok: true })
      return
    }
    const { error } = await serviceClient.from('books').upsert(payloads, {
      onConflict: 'content_hash',
    })
    if (error) {
      logError('books-upsert', error)
      res.status(400).json({ error: error.message })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    logError('books-upsert', error)
    res.status(500).json({ error: 'Failed to upsert books' })
  }
})

app.post('/api/library/user-books', requireSession, async (req, res) => {
  try {
    const { bookId } = req.body || {}
    if (!bookId) {
      res.status(400).json({ error: 'Missing bookId' })
      return
    }
    const { error } = await serviceClient
      .from('user_books')
      .upsert(
        {
          user_id: req.session.user_id,
          book_id: bookId,
          available_on_device: true,
        },
        { onConflict: 'user_id,book_id' }
      )
    if (error) {
      logError('user-books-upsert', error)
      res.status(400).json({ error: error.message })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    logError('user-books-upsert', error)
    res.status(500).json({ error: 'Failed to save user book' })
  }
})

app.delete('/api/library/user-books/:bookId', requireSession, async (req, res) => {
  try {
    const { bookId } = req.params
    const { error } = await serviceClient
      .from('user_books')
      .delete()
      .eq('user_id', req.session.user_id)
      .eq('book_id', bookId)
    if (error) {
      logError('user-books-delete', error)
      res.status(400).json({ error: error.message })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    logError('user-books-delete', error)
    res.status(500).json({ error: 'Failed to remove user book' })
  }
})

app.get('/api/library/progress/:bookId', requireSession, async (req, res) => {
  try {
    const { data, error } = await serviceClient
      .from('reading_progress')
      .select('percent_complete, last_location')
      .eq('user_id', req.session.user_id)
      .eq('book_id', req.params.bookId)
      .maybeSingle()
    if (error) {
      logError('progress-get', error)
      res.status(400).json({ error: error.message })
      return
    }
    res.json({ progress: data || null })
  } catch (error) {
    logError('progress-get', error)
    res.status(500).json({ error: 'Failed to load progress' })
  }
})

app.put('/api/library/progress/:bookId', requireSession, async (req, res) => {
  try {
    const { percent_complete, last_location } = req.body || {}
    const { error } = await serviceClient.from('reading_progress').upsert(
      {
        user_id: req.session.user_id,
        book_id: req.params.bookId,
        percent_complete,
        last_location,
      },
      { onConflict: 'user_id,book_id' }
    )
    if (error) {
      logError('progress-save', error)
      res.status(400).json({ error: error.message })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    logError('progress-save', error)
    res.status(500).json({ error: 'Failed to save progress' })
  }
})

app.get('/api/books/:bookId/download', requireSession, async (req, res) => {
  try {
    const { data: book, error: bookError } = await serviceClient
      .from('books')
      .select('storage_path')
      .eq('id', req.params.bookId)
      .maybeSingle()
    if (bookError) {
      logError('book-download-lookup', bookError)
      res.status(400).json({ error: bookError.message })
      return
    }
    const storagePath = book?.storage_path
    if (!storagePath) {
      res.status(404).json({ error: 'Book not found' })
      return
    }
    const { data, error: downloadError } = await serviceClient.storage.from('epubs').download(storagePath)
    if (downloadError) {
      logError('book-download', downloadError)
      res.status(400).json({ error: downloadError.message })
      return
    }

    let buffer
    if (!data) {
      res.status(404).json({ error: 'File not found' })
      return
    } else if (typeof data.arrayBuffer === 'function') {
      const arrayBuffer = await data.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
      buffer = Buffer.from(data)
    } else if (typeof data.getReader === 'function') {
      const reader = data.getReader()
      const chunks = []
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(typeof value === 'string' ? Buffer.from(value) : Buffer.from(value))
      }
      buffer = Buffer.concat(chunks)
    } else if (Symbol.asyncIterator in Object(data)) {
      const chunks = []
      for await (const chunk of data) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      buffer = Buffer.concat(chunks)
    } else {
      logError('book-download', new Error('Unsupported download response type'))
      res.status(500).json({ error: 'Unsupported download type' })
      return
    }

    res.setHeader('Content-Type', 'application/epub+zip')
    res.send(buffer)
  } catch (error) {
    logError('book-download', error)
    res.status(500).json({ error: 'Failed to download book' })
  }
})

app.listen(port, () => {
  console.log(`API server listening on http://127.0.0.1:${port}`)
})
