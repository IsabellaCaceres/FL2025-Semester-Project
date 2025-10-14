import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, View, Text, Pressable, ActivityIndicator, Platform } from "react-native";
import JSZip from "jszip";
let RenderHtml;
if (Platform.OS !== "web") {
  RenderHtml = require("react-native-render-html").default;
}
import { downloadBook } from "../lib/api";
import { useLibrary } from "../lib/library-context";
import styles from "../styling/global-styles";

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chapterTitleFromText(text, fallback) {
  if (!text) return fallback;
  const firstSentence = text.split(/[\.\n]/)[0]?.trim();
  return firstSentence || fallback;
}

function getMimeFromPath(path) {
  const ext = (path.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "css":
      return "text/css";
    default:
      return "application/octet-stream";
  }
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, "");
}

function resolveZipPath(baseDir, target) {
  if (!target) return null;
  const trimmed = target.trim();
  if (/^(?:https?:|data:)/i.test(trimmed)) return trimmed;
  const baseParts = baseDir ? baseDir.split("/").filter(Boolean) : [];
  const targetParts = trimmed.split("/").filter((part) => part.length > 0);
  if (trimmed.startsWith("/")) {
    baseParts.length = 0;
  }
  for (const part of targetParts) {
    if (part === ".") continue;
    if (part === "..") {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  return baseParts.join("/");
}

async function replaceAsync(str, regex, asyncReplacer) {
  const matches = [];
  str.replace(regex, (...args) => {
    matches.push(args);
    return args[0];
  });
  if (matches.length === 0) return str;

  const replacements = await Promise.all(matches.map((args) => asyncReplacer(...args)));
  let result = "";
  let lastIndex = 0;
  matches.forEach((args, index) => {
    const match = args[0];
    const matchIndex = args[args.length - 2];
    result += str.slice(lastIndex, matchIndex) + replacements[index];
    lastIndex = matchIndex + match.length;
  });
  result += str.slice(lastIndex);
  return result;
}

async function inlineCssUrls(cssContent, assetDir, zip) {
  const urlRegex = /url\(([^)]+)\)/gi;
  return replaceAsync(cssContent, urlRegex, async (match, rawUrl) => {
    const cleaned = stripQuotes(rawUrl.trim());
    if (/^(?:https?:|data:|#)/i.test(cleaned) || cleaned.length === 0) {
      return match;
    }
    const resolved = resolveZipPath(assetDir, cleaned);
    if (!resolved) return match;
    const entry = zip.file(resolved);
    if (!entry) return match;
    const mime = getMimeFromPath(resolved);
    const base64 = await entry.async("base64");
    return `url("data:${mime};base64,${base64}")`;
  });
}

async function inlineAssets(html, chapterDir, zip) {
  let transformed = html;

  const stylesheetRegex = /<link[^>]+rel=["']?stylesheet["']?[^>]*href=["']([^"']+)["'][^>]*>/gi;
  transformed = await replaceAsync(transformed, stylesheetRegex, async (match, href) => {
    const resolved = resolveZipPath(chapterDir, href);
    if (!resolved) return "";
    const entry = zip.file(resolved);
    if (!entry) return "";
    let css = await entry.async("string");
    const cssDir = resolved.includes("/") ? resolved.slice(0, resolved.lastIndexOf("/")) : "";
    css = await inlineCssUrls(css, cssDir, zip);
    return `<style>${css}</style>`;
  });

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  transformed = await replaceAsync(transformed, imgRegex, async (match, src) => {
    const cleaned = stripQuotes(src.trim());
    if (/^(?:https?:|data:)/i.test(cleaned) || cleaned.length === 0) return match;
    const resolved = resolveZipPath(chapterDir, cleaned);
    if (!resolved) return match;
    const entry = zip.file(resolved);
    if (!entry) return match;
    const mime = getMimeFromPath(resolved);
    const base64 = await entry.async("base64");
    return match.replace(src, `data:${mime};base64,${base64}`);
  });

  const svgImageRegex = /<image[^>]+xlink:href=["']([^"']+)["'][^>]*>/gi;
  transformed = await replaceAsync(transformed, svgImageRegex, async (match, href) => {
    const cleaned = stripQuotes(href.trim());
    if (/^(?:https?:|data:)/i.test(cleaned) || cleaned.length === 0) return match;
    const resolved = resolveZipPath(chapterDir, cleaned);
    if (!resolved) return match;
    const entry = zip.file(resolved);
    if (!entry) return match;
    const mime = getMimeFromPath(resolved);
    const base64 = await entry.async("base64");
    return match.replace(href, `data:${mime};base64,${base64}`);
  });

  return transformed;
}

function buildHtmlDocument(rawHtml) {
  const headMatch = rawHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const headContent = headMatch ? headMatch[1] : "";
  const bodyContent = bodyMatch ? bodyMatch[1] : rawHtml;
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 24px;
          margin: 0;
          line-height: 1.6;
          font-size: 16px;
          color: #222;
        }
        img, svg {
          max-width: 100%;
          height: auto;
        }
        p {
          margin: 0 0 1em 0;
        }
      </style>
      ${headContent}
    </head>
    <body>${bodyContent}</body>
  </html>`;
}

export default function BookReaderModal({ book, visible, onClose }) {
  const { getBookRecord, loadProgress, saveProgress } = useLibrary();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chapters, setChapters] = useState([]);
  const chaptersRef = useRef([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);

  const persistProgress = useCallback(
    async (nextChapterIndex, nextPageIndex, chapterListOverride) => {
      if (!book) return;
      const record = getBookRecord(book.contentHash);
      if (!record) return;
      const chapterList = chapterListOverride ?? chaptersRef.current;
      const totalChapters = chapterList.length || 1;
      const chapterPages = chapterList[nextChapterIndex]?.pages?.length || 1;
      const chapterFraction = Math.min(1, Math.max(0, (nextPageIndex + 1) / chapterPages));
      const percent = ((nextChapterIndex + chapterFraction) / totalChapters) * 100;
      await saveProgress(record.id, { spineIndex: nextChapterIndex, pageIndex: nextPageIndex }, percent);
    },
    [book, getBookRecord, saveProgress]
  );

  useEffect(() => {
    if (!visible || !book) return;
    let cancelled = false;

    const loadBook = async () => {
      setLoading(true);
      setError(null);
      setChapters([]);
      chaptersRef.current = [];
      setChapterIndex(0);
      setPageIndex(0);

      try {
        const record = getBookRecord(book.contentHash);
        if (!record) {
          throw new Error("Missing EPUB storage path. Run `bun run supabase:sync-epubs` to upload assets.");
        }

        const buffer = await downloadBook(record.id);
        const zip = await JSZip.loadAsync(buffer);

        const opfPath = book.paths?.opf;
        if (!opfPath) throw new Error("Book metadata missing OPF path.");
        const opfDir = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/")) : "";

        const manifestItems = book.manifest?.items ?? [];
        const manifestMap = new Map();
        manifestItems.forEach((item) => {
          const id = item.id ?? item["@_id"];
          if (id) manifestMap.set(id, item);
        });

        const spineRefs = book.spine?.itemrefs ?? [];
        const loadedChapters = [];

        for (const itemref of spineRefs) {
          const idref = itemref.idref ?? itemref["@_idref"];
          if (!idref) continue;
          const manifestItem = manifestMap.get(idref);
          if (!manifestItem) continue;
          const href = manifestItem.href ?? manifestItem["@_href"];
          if (!href) continue;

          const path = [opfDir, href].filter(Boolean).join("/");
          const entry = zip.file(path);
          if (!entry) continue;
          const chapterDir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
          const rawHtml = await entry.async("string");
          const inlinedHtml = await inlineAssets(rawHtml, chapterDir, zip);
          const finalHtml = buildHtmlDocument(inlinedHtml);
          const text = stripHtml(rawHtml);
          if (!text) continue;
          const title =
            manifestItem.title ??
            manifestItem["dc:title"] ??
            chapterTitleFromText(text, `Section ${loadedChapters.length + 1}`);
          loadedChapters.push({ id: idref, title, html: finalHtml });
        }

        if (cancelled) return;

        if (loadedChapters.length === 0) {
          throw new Error("Could not extract chapters from EPUB.");
        }

        const chapterWithPages = loadedChapters.map((entry) => ({
          id: entry.id,
          title: entry.title,
          pages: [entry.html],
        }));

        setChapters(chapterWithPages);
        chaptersRef.current = chapterWithPages;

        const progress = await loadProgress(record.id);
        let nextChapterIndex = 0;
        let nextPageIndex = 0;
        if (progress?.last_location) {
          nextChapterIndex = Math.min(
            progress.last_location.spineIndex ?? 0,
            Math.max(chapterWithPages.length - 1, 0)
          );
          const totalPages = chapterWithPages[nextChapterIndex]?.pages?.length || 1;
          nextPageIndex = Math.min(progress.last_location.pageIndex ?? 0, Math.max(totalPages - 1, 0));
        }
        setChapterIndex(nextChapterIndex);
        setPageIndex(nextPageIndex);
        await persistProgress(nextChapterIndex, nextPageIndex, chapterWithPages);
      } catch (err) {
        if (!cancelled) {
          console.warn("[reader] load error:", err);
          setError(err.message || "Unable to load book.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBook();

    return () => {
      cancelled = true;
    };
  }, [visible, book, getBookRecord, loadProgress, persistProgress]);

  const currentChapter = useMemo(
    () => (chapters.length ? chapters[chapterIndex] : null),
    [chapters, chapterIndex]
  );
  const currentPageHtml = currentChapter?.pages?.[pageIndex] ?? null;
  const totalPagesInChapter = currentChapter?.pages?.length ?? 0;

  const goToNext = useCallback(() => {
    if (!currentChapter) return;
    if (pageIndex < totalPagesInChapter - 1) {
      const nextPage = pageIndex + 1;
      setPageIndex(nextPage);
      persistProgress(chapterIndex, nextPage);
    } else if (chapterIndex < chapters.length - 1) {
      const nextChapter = chapterIndex + 1;
      setChapterIndex(nextChapter);
      setPageIndex(0);
      persistProgress(nextChapter, 0);
    }
  }, [chapterIndex, chapters.length, currentChapter, pageIndex, totalPagesInChapter, persistProgress]);

  const goToPrevious = useCallback(() => {
    if (!currentChapter) return;
    if (pageIndex > 0) {
      const previousPage = pageIndex - 1;
      setPageIndex(previousPage);
      persistProgress(chapterIndex, previousPage);
    } else if (chapterIndex > 0) {
      const previousChapter = chapterIndex - 1;
      const previousChapterPages = chaptersRef.current[previousChapter]?.pages?.length ?? 1;
      const previousPage = Math.max(previousChapterPages - 1, 0);
      setChapterIndex(previousChapter);
      setPageIndex(previousPage);
      persistProgress(previousChapter, previousPage);
    }
  }, [chapterIndex, currentChapter, pageIndex, persistProgress]);

  const closeReader = () => {
    setChapters([]);
    setChapterIndex(0);
    setPageIndex(0);
    chaptersRef.current = [];
    onClose();
  };

  const totalChapters = chapters.length;
  const pagesInChapter = totalPagesInChapter || 1;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeReader}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxWidth: 520, width: "100%" }]}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={{ marginTop: 12 }}>Opening book…</Text>
            </View>
          ) : error ? (
            <View>
              <Text style={styles.modalTitle}>Unable to open book</Text>
              <Text style={styles.modalBlurb}>{error}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.modalTitle}>{book?.title}</Text>
              <Text style={styles.modalAuthor}>
                Chapter {chapterIndex + 1} of {totalChapters} · Page {pageIndex + 1} of {pagesInChapter}
              </Text>
              <View style={{ height: 420, marginBottom: 16, borderRadius: 8, overflow: "hidden" }}>
                <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
                  <Text style={{ fontWeight: "600", marginBottom: 8, fontSize: 16, textAlign: "center" }}>
                    {currentChapter?.title}
                  </Text>
                </View>
                {currentPageHtml ? (
                  Platform.OS === "web" ? (
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "0 16px 16px",
                      }}
                      dangerouslySetInnerHTML={{ __html: currentPageHtml }}
                    />
                  ) : RenderHtml ? (
                    <RenderHtml
                      contentWidth={400}
                      source={{ html: currentPageHtml }}
                      tagsStyles={{
                        body: {
                          fontSize: 16,
                          lineHeight: 24,
                          color: "#222",
                        },
                      }}
                    />
                  ) : (
                    <View style={styles.center}>
                      <Text>HTML rendering not available.</Text>
                    </View>
                  )
                ) : (
                  <View style={styles.center}>
                    <Text>No content for this page.</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Pressable
                  style={[styles.button, { flex: 1, marginRight: 6 }]}
                  disabled={chapterIndex === 0 && pageIndex === 0}
                  onPress={goToPrevious}
                >
                  <Text style={styles.buttonLabel}>Previous</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, { flex: 1, marginLeft: 6 }]}
                  disabled={
                    chapterIndex === chapters.length - 1 && pageIndex >= pagesInChapter - 1
                  }
                  onPress={goToNext}
                >
                  <Text style={styles.buttonLabel}>
                    {chapterIndex === chapters.length - 1 && pageIndex >= pagesInChapter - 1
                      ? "Done"
                      : "Next"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
          <Pressable
            style={[styles.button, styles.buttonMuted, { marginTop: 12 }]}
            onPress={closeReader}
          >
            <Text style={styles.buttonLabel}>Back to Details</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
