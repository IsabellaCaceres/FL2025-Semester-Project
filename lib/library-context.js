import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Alert } from 'react-native'
import { supabase } from './supabase'
import {
  catalog,
  catalogIndex,
  genres as catalogGenres,
  searchCatalog,
  filterByGenre as filterCatalogByGenre,
} from './catalog'

const LibraryContext = createContext(null)

function cleanValue(value) {
  if (value === undefined || value === null) return undefined
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        return cleanValue(item)
      })
      .filter((item) => {
        if (item === undefined || item === null) return false
        if (typeof item === 'string') return item.length > 0
        if (Array.isArray(item)) return item.length > 0
        if (typeof item === 'object') return Object.keys(item).length > 0
        return true
      })
    return cleaned.length ? cleaned : undefined
  }
  if (typeof value === 'object') {
    const result = {}
    for (const [key, nested] of Object.entries(value)) {
      const cleaned = cleanValue(nested)
      if (cleaned !== undefined) {
        result[key] = cleaned
      }
    }
    return Object.keys(result).length ? result : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  return value
}

function incrementCount(map, key, weight = 1) {
  if (!key) return
  const current = map.get(key) ?? 0
  map.set(key, current + weight)
}

function buildBookPayload(book) {
  return {
    content_hash: book.contentHash,
    title: book.title,
    author: book.author,
    filename: book.file?.name ?? null,
    filesize: book.file?.size ?? null,
    metadata:
      cleanValue({
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
      }) ?? {},
    subjects: book.genres,
    description: book.summary ?? null,
    language: book.language ?? null,
    cover_image: book.cover?.uri ?? null,
  }
}

export function LibraryProvider({ user, children }) {
  const userId = user?.id ?? null
  const [libraryIds, setLibraryIds] = useState(() => new Set())
  const [isSyncing, setIsSyncing] = useState(false)
  const [remoteAvailable, setRemoteAvailable] = useState(true)
  const bookRecordsRef = useRef(new Map())
  const progressCacheRef = useRef(new Map())
  const syncInFlightRef = useRef(null)
  const warnedRef = useRef(false)

  const notifySupabaseIssue = useCallback((message, options = {}) => {
    const force = options.force ?? false
    if (!force && warnedRef.current) return
    warnedRef.current = true
    Alert.alert("Supabase unavailable", message)
  }, [])

  const syncCatalog = useCallback(async () => {
    if (!userId) return
    if (syncInFlightRef.current) return syncInFlightRef.current

    const task = (async () => {
      setIsSyncing(true)
      try {
        warnedRef.current = false
        const { data: existingRows, error: fetchError } = await supabase
          .from('books')
          .select('id, content_hash, storage_path')
        if (fetchError) throw fetchError
        setRemoteAvailable(true)

        const recordMap = new Map()
        for (const row of existingRows ?? []) {
          if (row?.content_hash) recordMap.set(row.content_hash, row)
        }

        const missingBooks = catalog.filter(
          (book) => !recordMap.has(book.contentHash)
        )
        if (missingBooks.length) {
          const payloads = missingBooks.map(buildBookPayload)
          const { error: insertError } = await supabase.from('books').insert(payloads)
          if (insertError) throw insertError

          const { data: refreshedRows, error: refreshedError } = await supabase
            .from('books')
            .select('id, content_hash, storage_path')
          if (refreshedError) throw refreshedError

          for (const row of refreshedRows ?? []) {
            if (row?.content_hash) recordMap.set(row.content_hash, row)
          }
        }

        bookRecordsRef.current = recordMap

        const { data: userRows, error: userBooksError } = await supabase
          .from('user_books')
          .select('book_id, books (content_hash)')
          .eq('user_id', userId)

        if (userBooksError) throw userBooksError

        const nextIds = new Set()
        for (const row of userRows ?? []) {
          const hash = row?.books?.content_hash
          if (hash) nextIds.add(hash)
        }
        setLibraryIds(nextIds)
      } catch (error) {
        console.warn('[library] sync failed:', error.message)
        setRemoteAvailable(false)
        bookRecordsRef.current = new Map()
        const lowerMessage = (error.message || '').toLowerCase()
        if (lowerMessage.includes('could not find the table')) {
          notifySupabaseIssue(
            'Books table not found. Make sure Supabase is running locally and run `bun run supabase:reset` to apply migrations.'
          )
        } else if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('connect')) {
          notifySupabaseIssue('Unable to reach Supabase. Is the local stack running?')
        } else {
          notifySupabaseIssue('Supabase request failed. Check the CLI logs for details.')
        }
      } finally {
        setIsSyncing(false)
        syncInFlightRef.current = null
      }
    })()

    syncInFlightRef.current = task
    return task
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setLibraryIds(new Set())
      bookRecordsRef.current = new Map()
      progressCacheRef.current = new Map()
      setIsSyncing(false)
      return
    }
    syncCatalog()
  }, [userId, syncCatalog])

  const addToLibrary = useCallback(
    async (bookId) => {
      if (!userId) return
      const book = catalogIndex.get(bookId)
      if (!book) return

      if (!remoteAvailable) {
        notifySupabaseIssue(
          'Supabase is unavailable, so this change will stay local for now.',
          { force: true }
        )
        setLibraryIds((prev) => {
          if (prev.has(bookId)) return prev
          const next = new Set(prev)
          next.add(bookId)
          return next
        })
        return
      }

      if (!bookRecordsRef.current.has(book.contentHash)) {
        await syncCatalog()
      }
      const record = bookRecordsRef.current.get(book.contentHash)
      if (!record) {
        console.warn('[library] missing book record for', book.title)
        notifySupabaseIssue(
          'Could not locate this book in Supabase. Try running `npm run supabase:sync-epubs` and refresh.',
          { force: true }
        )
        return
      }

      setLibraryIds((prev) => {
        if (prev.has(bookId)) return prev
        const next = new Set(prev)
        next.add(bookId)
        return next
      })

      const { error } = await supabase
        .from('user_books')
        .upsert(
          {
            user_id: userId,
            book_id: record.id,
            available_on_device: true,
          },
          { onConflict: 'user_id,book_id' }
        )

      if (error) {
        console.warn('[library] add failed:', error.message)
        if (error.code === '23503') {
          notifySupabaseIssue(
            'Your session looks stale. Please sign out and back in before adding books again.',
            { force: true }
          )
        } else if (error.code === '42501' || error.code === 'PGRST302') {
          notifySupabaseIssue('You are not authorized to modify this library. Sign in again and retry.', {
            force: true,
          })
        } else {
          notifySupabaseIssue('We could not save this book to Supabase. Try again in a moment.', { force: true })
        }
        setLibraryIds((prev) => {
          const next = new Set(prev)
          next.delete(bookId)
          return next
        })
      }
    },
    [syncCatalog, userId]
  )

  const removeFromLibrary = useCallback(
    async (bookId) => {
      if (!userId) return
      const book = catalogIndex.get(bookId)
      if (!book) return

      if (!remoteAvailable) {
        notifySupabaseIssue(
          'Supabase is unavailable, so this change will stay local for now.',
          { force: true }
        )
        setLibraryIds((prev) => {
          if (!prev.has(bookId)) return prev
          const next = new Set(prev)
          next.delete(bookId)
          return next
        })
        return
      }

      if (!bookRecordsRef.current.has(book.contentHash)) {
        await syncCatalog()
      }
      const record = bookRecordsRef.current.get(book.contentHash)
      if (!record) {
        console.warn('[library] missing book record for', book.title)
        notifySupabaseIssue(
          'Could not locate this book in Supabase. Try running `npm run supabase:sync-epubs` and refresh.',
          { force: true }
        )
        return
      }

      setLibraryIds((prev) => {
        if (!prev.has(bookId)) return prev
        const next = new Set(prev)
        next.delete(bookId)
        return next
      })

      const { error } = await supabase
        .from('user_books')
        .delete()
        .match({ user_id: userId, book_id: record.id })

      if (error) {
        console.warn('[library] remove failed:', error.message)
        if (error.code === '23503') {
          notifySupabaseIssue(
            'Your session looks stale. Please sign out and back in before changing your library.',
            { force: true }
          )
        } else if (error.code === '42501' || error.code === 'PGRST302') {
          notifySupabaseIssue('You are not authorized to modify this library. Sign in again and retry.', {
            force: true,
          })
        } else {
          notifySupabaseIssue('We could not remove this book from Supabase. Try again in a moment.', { force: true })
        }
        setLibraryIds((prev) => {
          const next = new Set(prev)
          next.add(bookId)
          return next
        })
      }
    },
    [syncCatalog, userId]
  )

  const getBookRecord = useCallback(
    (book) => {
      if (!book) return null
      const hash = typeof book === 'string' ? book : book.contentHash
      return bookRecordsRef.current.get(hash) ?? null
    },
    []
  )

  const loadProgress = useCallback(
    async (bookRecordId) => {
      if (!userId || !bookRecordId) return null
      if (progressCacheRef.current.has(bookRecordId)) {
        return progressCacheRef.current.get(bookRecordId)
      }
      try {
        const { data, error } = await supabase
          .from('reading_progress')
          .select('percent_complete, last_location')
          .eq('user_id', userId)
          .eq('book_id', bookRecordId)
          .maybeSingle()
        if (error) {
          if (error.code === 'PGRST116' || error.code === '406') return null
          throw error
        }
        if (data) {
          progressCacheRef.current.set(bookRecordId, data)
        }
        return data ?? null
      } catch (error) {
        console.warn('[library] loadProgress failed:', error.message)
        return null
      }
    },
    [userId]
  )

  const saveProgress = useCallback(
    async (bookRecordId, location = {}, percent = null) => {
      if (!userId || !bookRecordId) return
      const payload = {
        user_id: userId,
        book_id: bookRecordId,
        last_location: location,
      }
      if (percent !== null && percent !== undefined) {
        payload.percent_complete = Math.min(Math.max(Number(percent), 0), 100)
      }
      try {
        const { data, error } = await supabase
          .from('reading_progress')
          .upsert(payload, { onConflict: 'user_id,book_id' })
          .select('percent_complete, last_location')
          .single()
        if (error) throw error
        if (data) {
          progressCacheRef.current.set(bookRecordId, data)
        }
      } catch (error) {
        console.warn('[library] saveProgress failed:', error.message)
      }
    },
    [userId]
  )

  const isInLibrary = useCallback(
    (bookId) => libraryIds.has(bookId),
    [libraryIds]
  )

  const library = useMemo(
    () => catalog.filter((book) => libraryIds.has(book.id)),
    [libraryIds]
  )

  const recommended = useMemo(() => {
    if (library.length === 0) {
      return []
    }

    const genreCounts = new Map()
    const subjectCounts = new Map()
    const keywordCounts = new Map()
    const authorSet = new Set()
    const languageSet = new Set()
    const publisherSet = new Set()

    for (const book of library) {
      for (const genre of book.genres) incrementCount(genreCounts, genre)
      for (const subject of book.subjects) incrementCount(subjectCounts, subject)
      for (const keyword of book.metadata?.keywords ?? []) {
        incrementCount(keywordCounts, keyword)
      }
      for (const author of book.authors) authorSet.add(author)
      if (book.language) languageSet.add(book.language)
      if (book.publisher) publisherSet.add(book.publisher)
    }

    const scored = []
    const remainder = []

    for (const book of catalog) {
      if (libraryIds.has(book.id)) continue
      let score = 0

      for (const genre of book.genres) {
        const weight = genreCounts.get(genre)
        if (weight) score += 3 + weight
      }

      for (const subject of book.subjects) {
        const weight = subjectCounts.get(subject)
        if (weight) score += 2 + weight * 0.5
      }

      for (const author of book.authors) {
        if (authorSet.has(author)) score += 5
      }

      if (book.language && languageSet.has(book.language)) score += 1
      if (book.publisher && publisherSet.has(book.publisher)) score += 1

      for (const keyword of book.metadata?.keywords ?? []) {
        const weight = keywordCounts.get(keyword)
        if (weight) score += Math.min(2, weight)
      }

      if (score > 0) {
        scored.push({ book, score })
      } else {
        remainder.push(book)
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.book.title.localeCompare(b.book.title)
    })

    const recommendations = scored.map((entry) => entry.book).slice(0, 12)

    if (recommendations.length < 12) {
      const sortedRemainder = remainder.sort((a, b) =>
        a.title.localeCompare(b.title)
      )
      for (const book of sortedRemainder) {
        if (recommendations.length >= 12) break
        recommendations.push(book)
      }
    }

    return recommendations
  }, [library, libraryIds])

  const value = useMemo(
    () => ({
      allBooks: catalog,
      getBook: (bookId) => catalogIndex.get(bookId) ?? null,
      genres: catalogGenres,
      isLoading: isSyncing,
      library,
      recommended,
      addToLibrary,
      removeFromLibrary,
      isInLibrary,
      search: searchCatalog,
      filterByGenre: filterCatalogByGenre,
      refresh: syncCatalog,
      getBookRecord,
      loadProgress,
      saveProgress,
    }),
    [
      addToLibrary,
      isInLibrary,
      isSyncing,
      library,
      recommended,
      removeFromLibrary,
      syncCatalog,
      getBookRecord,
      loadProgress,
      saveProgress,
    ]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider')
  }
  return context
}
