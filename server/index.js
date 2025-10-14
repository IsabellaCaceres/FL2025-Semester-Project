#!/usr/bin/env node

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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

function normalizeUsername(rawUsername = '') {
  return rawUsername.trim().toLowerCase().replace(/\s+/g, '')
}

function buildEmail(username) {
  return `${username}@local.goodreads-demo`
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
