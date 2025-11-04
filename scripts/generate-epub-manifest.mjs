#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const defaultRootDir = resolve(__dirname, '..')

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  trimValues: true,
})

const preferredEpubInputDirName = '@epubs'
const legacyEpubInputDirName = 'epubs'
const preferredCoverOutputDirName = '@covers'
const legacyCoverOutputDirName = 'covers'

function normalizePathSeparators(pathname) {
  return pathname.replace(/\\/g, '/')
}

function selectEpubInputDir(rootDir) {
  const preferred = resolve(rootDir, 'assets', preferredEpubInputDirName)
  if (existsSync(preferred)) return preferred
  return resolve(rootDir, 'assets', legacyEpubInputDirName)
}

function resolveCoverOutputDir(rootDir) {
  return resolve(rootDir, 'assets', preferredCoverOutputDirName)
}

function resolveLegacyCoverDir(rootDir) {
  return resolve(rootDir, 'assets', legacyCoverOutputDirName)
}

async function ensureEmptyDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
  const entries = await fs.readdir(dirPath)
  await Promise.all(
    entries.map((entry) =>
      fs.rm(resolve(dirPath, entry), { recursive: true, force: true })
    )
  )
}

const GENRE_KEYWORDS = [
  { label: 'Romance', keywords: ['romance', 'romantic', 'love story', 'relationship', 'rom-com', 'heartfelt', 'passion'] },
  { label: 'Fantasy', keywords: ['dragon', 'magic', 'sorcer', 'wizard', 'fantasy', 'kingdom', 'mythical', 'spell', 'saga'] },
  { label: 'Science Fiction', keywords: ['sci-fi', 'science fiction', 'space', 'alien', 'future', 'futuristic', 'time travel', 'technology', 'cyber'] },
  { label: 'Thriller', keywords: ['thriller', 'suspense', 'tension', 'high-stakes', 'conspiracy', 'chilling', 'manhunt'] },
  { label: 'Mystery', keywords: ['mystery', 'detective', 'whodunit', 'investigation', 'murder', 'case', 'sleuth'] },
  { label: 'Action & Adventure', keywords: ['action', 'adventure', 'battle', 'rebels', 'quest', 'explosive', 'race against time'] },
  { label: 'Historical Fiction', keywords: ['historical', 'period', 'victorian', 'era', 'century', 'wwi', 'wwii'] },
  { label: 'Non-Fiction', keywords: ['non-fiction', 'memoir', 'biography', 'self-help', 'guide', 'science of', 'true story'] },
  { label: 'Comedy', keywords: ['comedy', 'humor', 'hilarious', 'witty', 'funny', 'satire'] },
  { label: 'Horror', keywords: ['horror', 'terrifying', 'haunted', 'nightmare', 'bloodcurdling', 'vampire', 'werewolf', 'monster'] },
  { label: 'Young Adult', keywords: ['young adult', 'ya', 'teen', 'coming-of-age', 'high school'] },
  { label: 'Drama', keywords: ['drama', 'family', 'emotional', 'intimate', 'character-driven'] }
]

function stripHtml(value) {
  if (typeof value !== 'string') return value
  return value.replace(/<[^>]+>/g, ' ')
}

function extractGenres({ metadata, title }) {
  const candidates = []
  if (metadata) {
    const descriptionText = stripHtml(metadata.description)
    if (descriptionText) candidates.push(descriptionText)
    const publisher = getText(metadata.publisher)
    if (publisher) candidates.push(publisher)
  }
  if (title) candidates.push(title)

  const haystack = candidates
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase()

  const matched = new Set()
  if (haystack) {
    for (const { label, keywords } of GENRE_KEYWORDS) {
      if (keywords.some((keyword) => haystack.includes(keyword))) {
        matched.add(label)
      }
    }
  }

  if (matched.size === 0) {
    matched.add('General')
  }

  return Array.from(matched)
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (value === undefined || value === null) return []
  return [value]
}

function cloneJSON(value) {
  if (value === undefined) return undefined
  const json = JSON.stringify(value)
  if (json === undefined) return undefined
  return JSON.parse(json)
}

function hasContent(value) {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function getText(node) {
  if (typeof node === 'string') return node.trim() || null
  if (node && typeof node === 'object') {
    if (typeof node['#text'] === 'string') return node['#text'].trim() || null
    if (typeof node.text === 'string') return node.text.trim() || null
  }
  return null
}

function zipDirname(path) {
  const idx = path.lastIndexOf('/')
  return idx === -1 ? '' : path.slice(0, idx)
}

function joinZipPath(...segments) {
  const parts = []
  for (const segment of segments) {
    if (!segment) continue
    for (const part of segment.split('/')) {
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

function inferMimeType(href) {
  const ext = href.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    case 'bmp':
      return 'image/bmp'
    default:
      return null
  }
}

function getExtensionFromMimeType(mimeType) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/gif':
      return 'gif'
    case 'image/webp':
      return 'webp'
    case 'image/svg+xml':
      return 'svg'
    case 'image/bmp':
      return 'bmp'
    default:
      return 'jpg' // default fallback
  }
}

async function writeManifest(filePath, entries) {
  const header = '// This file is auto-generated by scripts/generate-epub-manifest.mjs. Do not edit manually.\n'
  const content =
    header +
    `export const libraryBooks = ${JSON.stringify(entries)};\n\n` +
    'export default libraryBooks;\n'

  await fs.mkdir(dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
}

async function writeCoverAssetModule(filePath, entries) {
  const header = '// This file is auto-generated by scripts/generate-epub-manifest.mjs. Do not edit manually.\n'
  const coverEntries = entries
    .filter((entry) => entry?.cover?.uri && entry?.id)
    .map((entry) => ({
      id: entry.id,
      uri: entry.cover.uri,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const baseLines = [
    header,
    'export const coverAssets = {',
  ]
  for (const cover of coverEntries) {
    const normalized = normalizePathSeparators(cover.uri)
    const requirePath = normalized.startsWith('assets/')
      ? `../${normalized}`
      : normalized.startsWith('./')
        ? `../${normalized.slice(2)}`
        : normalized
    baseLines.push(
      `  "${cover.id}": { uri: "${normalized}", source: typeof require === "function" ? require("${requirePath}") : null },`
    )
  }
  baseLines.push('};')
  baseLines.push('')
  baseLines.push('export const coverList = Object.values(coverAssets);')
  baseLines.push('')
  baseLines.push('export default coverAssets;')
  baseLines.push('')

  await fs.mkdir(dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, baseLines.join('\n'), 'utf8')
}

async function extractEntry(filePath, rootDir = defaultRootDir, options = {}) {
  const { coverOutputDir, legacyCoverDir } = options
  const buffer = await fs.readFile(filePath)
  const contentHash = createHash('sha256').update(buffer).digest('hex')
  const zip = await JSZip.loadAsync(buffer)

  const containerEntry = zip.file('META-INF/container.xml')
  if (!containerEntry) throw new Error('Missing META-INF/container.xml')

  const containerXml = await containerEntry.async('string')
  const container = xmlParser.parse(containerXml)
  const rootfiles =
    container?.container?.rootfiles?.rootfile ?? container?.rootfiles?.rootfile
  const rootfile = toArray(rootfiles)[0]
  const opfPath = rootfile?.['full-path'] ?? rootfile?.fullPath
  if (!opfPath) throw new Error('Missing OPF full-path in container.xml')

  const opfEntry = zip.file(opfPath)
  if (!opfEntry) throw new Error(`OPF file not found at ${opfPath}`)

  const opfXml = await opfEntry.async('string')
  const opf = xmlParser.parse(opfXml)
  const metadata = opf?.package?.metadata
  if (!metadata) throw new Error('Missing <metadata> section in OPF')

  const titles = toArray(metadata.title ?? metadata['dc:title'])
  const title = getText(titles[0])
  if (!title) throw new Error('Missing <dc:title> value')

  const creators = toArray(metadata.creator ?? metadata['dc:creator'])
  const author = getText(creators[0])

  const metaEntries = toArray(metadata.meta)
  const coverMeta = metaEntries.find((meta) => {
    const name = meta?.name ?? meta?.['@_name']
    return name === 'cover'
  })
  const coverId = coverMeta?.content ?? coverMeta?.['@_content']
  if (!coverId) throw new Error('Missing <meta name="cover" ...> declaration')

  const items = toArray(opf?.package?.manifest?.item)
  const coverItem = items.find((item) => {
    const id = item?.id ?? item?.['@_id']
    return id === coverId
  })
  if (!coverItem) throw new Error(`Cover item "${coverId}" not found in manifest`)

  const coverHref = coverItem.href ?? coverItem?.['@_href']
  if (!coverHref) throw new Error('Cover item missing href attribute')

  const mediaType =
    coverItem['media-type'] ??
    coverItem?.['@_media-type'] ??
    inferMimeType(coverHref)
  if (!mediaType) {
    throw new Error(`Unable to determine cover media type for ${coverHref}`)
  }
  if (!mediaType.startsWith('image/')) {
    throw new Error(`Cover media type is not an image (${mediaType})`)
  }

  const opfDir = zipDirname(opfPath)
  const coverZipPath = joinZipPath(opfDir, coverHref)
  const coverEntry = zip.file(coverZipPath)
  if (!coverEntry) {
    throw new Error(`Cover asset "${coverZipPath}" not found in archive`)
  }

  const coverBuffer = await coverEntry.async('nodebuffer')
  const extension = getExtensionFromMimeType(mediaType)
  const coversDir = coverOutputDir ?? resolveCoverOutputDir(rootDir)
  await fs.mkdir(coversDir, { recursive: true })

  const coverFileName = `${contentHash}.${extension}`
  const coverFilePath = resolve(coversDir, coverFileName)
  await fs.writeFile(coverFilePath, coverBuffer)

  if (legacyCoverDir && normalizePathSeparators(legacyCoverDir) !== normalizePathSeparators(coversDir)) {
    await fs.mkdir(legacyCoverDir, { recursive: true })
    const legacyCoverPath = resolve(legacyCoverDir, coverFileName)
    await fs.writeFile(legacyCoverPath, coverBuffer)
  }

  const coverRelativePath = relative(rootDir, coverFilePath)
  const coverUri = normalizePathSeparators(coverRelativePath) // Normalize path separators

  const subjects = toArray(metadata.subject ?? metadata['dc:subject'])
    .map(getText)
    .filter(Boolean)

  const entry = {
    id: contentHash,
    contentHash,
    title: title.trim(),
  }
  if (author) entry.author = author.trim()
  let derivedGenres = []
  if (subjects.length > 0) {
    derivedGenres = subjects
      .map((value) => value?.trim())
      .filter(Boolean)
      .map((value) => value.replace(/\s+/g, ' '))
  }
  if (derivedGenres.length === 0) {
    derivedGenres = extractGenres({ metadata, title })
  }
  entry.genres = Array.from(new Set(derivedGenres))
  entry.cover = { uri: coverUri }

  const opfPackage = opf?.package ?? {}
  const {
    metadata: rawMetadata,
    manifest: rawManifest,
    spine: rawSpine,
    guide: rawGuide,
    collection: rawCollection,
    bindings: rawBindings,
    ...packageAttributes
  } = opfPackage

  const metadataDetails = cloneJSON(rawMetadata)
  if (hasContent(metadataDetails)) entry.metadata = metadataDetails

  const manifestItems = toArray(rawManifest?.item)
    .map((item) => cloneJSON(item))
    .filter(hasContent)
  if (rawManifest || manifestItems.length > 0) {
    let manifestData = cloneJSON(rawManifest) ?? {}
    if (manifestData && Object.prototype.hasOwnProperty.call(manifestData, 'item')) {
      delete manifestData.item
    }
    if (manifestItems.length > 0) manifestData.items = manifestItems
    if (hasContent(manifestData)) entry.manifest = manifestData
  }

  const spineItemrefs = toArray(rawSpine?.itemref)
    .map((itemref) => cloneJSON(itemref))
    .filter(hasContent)
  if (rawSpine || spineItemrefs.length > 0) {
    let spineData = cloneJSON(rawSpine) ?? {}
    if (spineData && Object.prototype.hasOwnProperty.call(spineData, 'itemref')) {
      delete spineData.itemref
    }
    if (spineItemrefs.length > 0) spineData.itemrefs = spineItemrefs
    if (hasContent(spineData)) entry.spine = spineData
  }

  const guideReferences = toArray(rawGuide?.reference)
    .map((reference) => cloneJSON(reference))
    .filter(hasContent)
  if (rawGuide || guideReferences.length > 0) {
    let guideData = cloneJSON(rawGuide) ?? {}
    if (guideData && Object.prototype.hasOwnProperty.call(guideData, 'reference')) {
      delete guideData.reference
    }
    if (guideReferences.length > 0) guideData.references = guideReferences
    if (hasContent(guideData)) entry.guide = guideData
  }

  const collectionData = cloneJSON(rawCollection)
  if (hasContent(collectionData)) entry.collection = collectionData

  const bindingsData = cloneJSON(rawBindings)
  if (hasContent(bindingsData)) entry.bindings = bindingsData

  const packageInfo = cloneJSON(packageAttributes)
  if (hasContent(packageInfo)) entry.package = packageInfo

  entry.paths = { opf: opfPath }
  entry.file = {
    name: basename(filePath),
    size: buffer.length,
  }

  return entry
}

export async function generateEpubManifest({ rootDir = defaultRootDir } = {}) {
  const epubDir = selectEpubInputDir(rootDir)
  const outputPath = resolve(rootDir, 'lib', 'epub-manifest.js')
  const coverAssetsPath = resolve(rootDir, 'lib', 'cover-assets.js')
  const coverOutputDir = resolveCoverOutputDir(rootDir)
  const legacyCoverDirCandidate = resolveLegacyCoverDir(rootDir)
  const legacyCoverDir =
    normalizePathSeparators(legacyCoverDirCandidate) === normalizePathSeparators(coverOutputDir)
      ? null
      : legacyCoverDirCandidate
  const entries = []

  await ensureEmptyDir(coverOutputDir)
  if (legacyCoverDir) {
    await ensureEmptyDir(legacyCoverDir)
  }

  if (!existsSync(epubDir)) {
    await writeManifest(outputPath, entries)
    await writeCoverAssetModule(coverAssetsPath, entries)
    return entries
  }

  const fileNames = await fs.readdir(epubDir)
  fileNames.sort((a, b) => a.localeCompare(b))

  for (const fileName of fileNames) {
    if (!fileName.toLowerCase().endsWith('.epub')) continue
    const fullPath = resolve(epubDir, fileName)
    const stat = await fs.stat(fullPath)
    if (!stat.isFile()) continue

    const relPath = normalizePathSeparators(relative(rootDir, fullPath))

    try {
      const entry = await extractEntry(fullPath, rootDir, {
        coverOutputDir,
        legacyCoverDir,
      })
      if (!entry.paths) entry.paths = {}
      entry.paths.epub = relPath
      entries.push(entry)
    } catch (error) {
      console.warn(
        `[generate-epub-manifest] Skipped ${relPath}: ${error.message}`
      )
    }
  }

  await writeManifest(outputPath, entries)
  await writeCoverAssetModule(coverAssetsPath, entries)
  const obsoleteAssetVariants = [
    resolve(rootDir, 'lib', 'cover-assets.native.js'),
    resolve(rootDir, 'lib', 'cover-assets.web.js'),
  ]
  for (const filePath of obsoleteAssetVariants) {
    if (existsSync(filePath)) {
      await fs.rm(filePath, { force: true })
    }
  }
  return entries
}

async function main() {
  const entries = await generateEpubManifest()
  const count = entries.length
  const noun = count === 1 ? 'entry' : 'entries'
  console.log(
    `[generate-epub-manifest] Wrote ${count} ${noun} to lib/epub-manifest.js and lib/cover-assets.js`
  )
}

const isMainModule =
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url

if (isMainModule) {
  main().catch((error) => {
    console.error(`[generate-epub-manifest] ${error.message}`)
    process.exit(1)
  })
}
