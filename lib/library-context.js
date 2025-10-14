import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchLibraryRecords,
  upsertBooks,
  addUserBook,
  removeUserBook,
  fetchProgress,
  saveProgress as saveProgressRequest,
} from "./api";
import {
  catalog,
  catalogIndex,
  genres as catalogGenres,
  searchCatalog,
  filterByGenre as filterCatalogByGenre,
} from "./catalog";

const LibraryContext = createContext(null);
const hashToBookId = new Map(catalog.map((book) => [book.contentHash, book.id]));

function cleanValue(value) {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        return cleanValue(item);
      })
      .filter((item) => {
        if (item === undefined || item === null) return false;
        if (typeof item === "string") return item.length > 0;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item).length > 0;
        return true;
      });
    return cleaned.length ? cleaned : undefined;
  }
  if (typeof value === "object") {
    const result = {};
    for (const [key, nested] of Object.entries(value)) {
      const cleaned = cleanValue(nested);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return Object.keys(result).length ? result : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  return value;
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
  };
}

function incrementCount(map, key, weight = 1) {
  if (!key) return;
  const current = map.get(key) ?? 0;
  map.set(key, current + weight);
}

export function LibraryProvider({ user, children }) {
  const userId = user?.id ?? null;
  const [libraryIds, setLibraryIds] = useState(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const bookRecordsRef = useRef(new Map());
  const progressCacheRef = useRef(new Map());

  const refreshState = useCallback(async () => {
    if (!userId) return;
    setIsSyncing(true);
    try {
      const state = await fetchLibraryRecords();
      if (!state) {
        bookRecordsRef.current = new Map();
        setLibraryIds(new Set());
        return;
      }
      const recordMap = new Map();
      for (const record of state.records || []) {
        recordMap.set(record.content_hash, record);
      }
      bookRecordsRef.current = recordMap;

      const nextIds = new Set();
      for (const entry of state.library || []) {
        const bookId = hashToBookId.get(entry.content_hash);
        if (bookId) nextIds.add(bookId);
      }
      setLibraryIds(nextIds);

      const missingBooks = catalog.filter(
        (book) => !recordMap.has(book.contentHash)
      );
      if (missingBooks.length > 0) {
        await upsertBooks(missingBooks.map(buildBookPayload));
        const refreshed = await fetchLibraryRecords();
        if (!refreshed) {
          return;
        }
        const refreshedMap = new Map();
        for (const record of refreshed.records || []) {
          refreshedMap.set(record.content_hash, record);
        }
        bookRecordsRef.current = refreshedMap;

        const refreshedIds = new Set();
        for (const entry of refreshed.library || []) {
          const bookId = hashToBookId.get(entry.content_hash);
          if (bookId) refreshedIds.add(bookId);
        }
        setLibraryIds(refreshedIds);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLibraryIds(new Set());
      bookRecordsRef.current = new Map();
      progressCacheRef.current = new Map();
      setIsSyncing(false);
      return;
    }
    refreshState();
  }, [userId, refreshState]);

  const addToLibrary = useCallback(
    async (bookId) => {
      if (!userId) return;
      const book = catalogIndex.get(bookId);
      if (!book) return;
      let record = bookRecordsRef.current.get(book.contentHash);
      if (!record) {
        await upsertBooks([buildBookPayload(book)]);
        await refreshState();
        record = bookRecordsRef.current.get(book.contentHash);
        if (!record) return;
      }
      await addUserBook(record.id);
      setLibraryIds((prev) => {
        if (prev.has(bookId)) return prev;
        const next = new Set(prev);
        next.add(bookId);
        return next;
      });
    },
    [userId, refreshState]
  );

  const removeFromLibrary = useCallback(
    async (bookId) => {
      if (!userId) return;
      const book = catalogIndex.get(bookId);
      if (!book) return;
      const record = bookRecordsRef.current.get(book.contentHash);
      if (!record) return;
      await removeUserBook(record.id);
      setLibraryIds((prev) => {
        if (!prev.has(bookId)) return prev;
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
    },
    [userId]
  );

  const isInLibrary = useCallback(
    (bookId) => libraryIds.has(bookId),
    [libraryIds]
  );

  const getBookRecord = useCallback(
    (contentHash) => bookRecordsRef.current.get(contentHash) ?? null,
    []
  );

  const loadProgress = useCallback(
    async (bookId) => {
      if (!userId) return null;
      if (progressCacheRef.current.has(bookId)) {
        return progressCacheRef.current.get(bookId);
      }
      const progress = await fetchProgress(bookId);
      if (progress) {
        progressCacheRef.current.set(bookId, progress);
      }
      return progress;
    },
    [userId]
  );

  const saveProgress = useCallback(
    async (bookId, lastLocation, percentComplete) => {
      if (!userId) return;
      const payload = {
        percent_complete: percentComplete,
        last_location: lastLocation,
      };
      progressCacheRef.current.set(bookId, payload);
      await saveProgressRequest(bookId, payload);
    },
    [userId]
  );

  const library = useMemo(
    () => catalog.filter((book) => libraryIds.has(book.id)),
    [libraryIds]
  );

  const recommended = useMemo(() => {
    if (library.length === 0) {
      return [];
    }

    const genreCounts = new Map();
    const subjectCounts = new Map();
    const keywordCounts = new Map();
    const authorSet = new Set();
    const languageSet = new Set();
    const publisherSet = new Set();

    for (const book of library) {
      for (const genre of book.genres) incrementCount(genreCounts, genre);
      for (const subject of book.subjects) incrementCount(subjectCounts, subject);
      for (const keyword of book.metadata?.keywords ?? []) {
        incrementCount(keywordCounts, keyword);
      }
      for (const author of book.authors) authorSet.add(author);
      if (book.language) languageSet.add(book.language);
      if (book.publisher) publisherSet.add(book.publisher);
    }

    const scored = [];
    const remainder = [];

    for (const book of catalog) {
      if (libraryIds.has(book.id)) continue;
      let score = 0;

      for (const genre of book.genres) {
        const weight = genreCounts.get(genre);
        if (weight) score += 3 + weight;
      }

      for (const subject of book.subjects) {
        const weight = subjectCounts.get(subject);
        if (weight) score += 2 + weight * 0.5;
      }

      for (const author of book.authors) {
        if (authorSet.has(author)) score += 5;
      }

      if (book.language && languageSet.has(book.language)) score += 1;
      if (book.publisher && publisherSet.has(book.publisher)) score += 1;

      for (const keyword of book.metadata?.keywords ?? []) {
        const weight = keywordCounts.get(keyword);
        if (weight) score += Math.min(2, weight);
      }

      if (score > 0) {
        scored.push({ book, score });
      } else {
        remainder.push(book);
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.book.title.localeCompare(b.book.title);
    });

    const recommendations = scored.map((entry) => entry.book).slice(0, 12);

    if (recommendations.length < 12) {
      const sortedRemainder = remainder.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      for (const book of sortedRemainder) {
        if (recommendations.length >= 12) break;
        recommendations.push(book);
      }
    }

    return recommendations;
  }, [library, libraryIds]);

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
      refresh: refreshState,
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
      refreshState,
      getBookRecord,
      loadProgress,
      saveProgress,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
