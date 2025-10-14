import { libraryBooks as manifestEntries } from './epub-manifest.js'

function toArray(value) {
  if (Array.isArray(value)) return value
  if (value === undefined || value === null) return []
  return [value]
}

function getText(node) {
  if (typeof node === 'string') return node.trim() || null
  if (node && typeof node === 'object') {
    const candidates = [
      node['#text'],
      node.text,
      node.value,
      node.label,
      node.name,
      node.content,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim()
        if (trimmed) return trimmed
      }
    }
  }
  return null
}

function uniqueStrings(strings) {
  const seen = new Set()
  const result = []
  for (const value of strings) {
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result
}

function cleanLabel(value) {
  if (!value) return null
  return value.replace(/\s+/g, ' ').replace(/[.;]+$/, '').trim() || null
}

function normalizeSubjects(rawSubjects) {
  const subjects = toArray(rawSubjects)
    .map((subject) => cleanLabel(getText(subject)))
    .filter(Boolean)
  return uniqueStrings(subjects)
}

function normalizeGenres(subjects) {
  const genres = subjects
    .map((subject) => {
      const primary = subject.split('--')[0] || subject
      return cleanLabel(primary)
    })
    .filter(Boolean)
  return uniqueStrings(genres)
}

function extractMetaValue(metaEntries, keys) {
  if (!metaEntries || metaEntries.length === 0) return null
  for (const entry of metaEntries) {
    const property = entry?.property ?? entry?.name ?? entry?.rel ?? ''
    const normalized = typeof property === 'string' ? property.toLowerCase() : ''
    if (keys.some((key) => normalized === key)) {
      return getText(entry)
    }
  }
  return null
}

function extractIdentifiers(rawIdentifiers) {
  const identifiers = toArray(rawIdentifiers)
    .map((identifier) => {
      if (typeof identifier === 'string') return identifier.trim() || null
      if (identifier && typeof identifier === 'object') {
        const text = getText(identifier)
        if (text) return text
      }
      return null
    })
    .filter(Boolean)
  return uniqueStrings(identifiers)
}

function buildSearchText(book) {
  const fields = [
    book.title,
    book.summary,
    book.publisher,
    book.published,
    book.language,
    book.rights,
    ...book.authors,
    ...book.subjects,
    ...book.genres,
    ...book.identifiers,
    ...(book.metadata?.keywords ?? []),
    book.file?.name,
  ]
  return fields
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function normalizeBook(entry) {
  const metadata = entry.metadata ?? {}
  const metaEntries = toArray(metadata.meta)

  const title = cleanLabel(entry.title) || 'Untitled'
  const authors = uniqueStrings(
    [
      ...toArray(metadata.creator ?? metadata['dc:creator']).map(getText),
      ...toArray(metadata.author ?? metadata['dc:author']).map(getText),
    ].filter(Boolean)
  )

  const summary =
    getText(metadata.description ?? metadata['dc:description']) ||
    extractMetaValue(metaEntries, [
      'description',
      'dc:description',
      'dcterms:description',
      'schema:description',
      'summary',
      'abstract',
      'schema:abstract',
    ])

  const subjects = normalizeSubjects(metadata.subject ?? metadata['dc:subject'])
  const genres = normalizeGenres(subjects)
  const identifiers = extractIdentifiers(metadata.identifier ?? metadata['dc:identifier'])
  const contributorNames = uniqueStrings(
    toArray(metadata.contributor ?? metadata['dc:contributor'])
      .map(getText)
      .filter(Boolean)
  )

  const language =
    getText(metadata.language ?? metadata['dc:language']) ||
    extractMetaValue(metaEntries, ['language', 'dc:language']) ||
    null

  const publisher =
    getText(metadata.publisher ?? metadata['dc:publisher']) ||
    extractMetaValue(metaEntries, ['publisher']) ||
    null

  const published =
    getText(metadata.date ?? metadata['dc:date']) ||
    extractMetaValue(metaEntries, ['published', 'publicationdate']) ||
    null

  const rights =
    getText(metadata.rights ?? metadata['dc:rights']) ||
    extractMetaValue(metaEntries, ['rights']) ||
    null

  const keywords = uniqueStrings(
    [
      ...subjects,
      ...genres,
      ...identifiers,
      ...authors,
      ...contributorNames,
    ].filter(Boolean)
  )

  const book = {
    id: entry.id ?? entry.contentHash ?? entry.paths?.epub ?? title,
    contentHash: entry.contentHash ?? entry.id ?? entry.paths?.epub ?? title,
    title,
    author: authors[0] ?? null,
    authors,
    contributors: contributorNames,
    summary: summary || null,
    subjects,
    genres,
    identifiers,
    language,
    publisher,
    published,
    rights,
    cover: entry.cover ?? null,
    coverSource: entry.cover?.uri ? { uri: entry.cover.uri } : null,
    metadata: {
      ...metadata,
      keywords,
    },
    manifest: entry.manifest ?? null,
    spine: entry.spine ?? null,
    guide: entry.guide ?? null,
    collection: entry.collection ?? null,
    bindings: entry.bindings ?? null,
    package: entry.package ?? null,
    paths: entry.paths ?? {},
    file: entry.file ?? null,
  }

  book.searchText = buildSearchText(book)

  return book
}

function sortByTitle(a, b) {
  return a.title.localeCompare(b.title)
}

function buildGenreList(books) {
  const counts = new Map()
  for (const book of books) {
    for (const genre of book.genres) {
      const key = genre.toLowerCase()
      const stats = counts.get(key) ?? { name: genre, count: 0 }
      stats.count += 1
      counts.set(key, stats)
    }
  }
  return Array.from(counts.values())
    .filter((item) => item.count >= 2)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name)
    })
    .slice(0, 24)
    .map((item) => item.name)
}

const catalog = manifestEntries.map(normalizeBook).sort(sortByTitle)

const catalogIndex = new Map(catalog.map((book) => [book.id, book]))

const genres = buildGenreList(catalog)

export { catalog, catalogIndex, genres }

export function getBookById(bookId) {
  return catalogIndex.get(bookId) ?? null
}

export function searchCatalog(query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)

  if (terms.length === 0) return []

  return catalog.filter((book) =>
    terms.every((term) => book.searchText.includes(term))
  )
}

export function filterByGenre(genreLabel) {
  const normalized = genreLabel.toLowerCase()
  return catalog.filter((book) =>
    book.genres.some((genre) => genre.toLowerCase() === normalized)
  )
}
