import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import JSZip from "jszip";
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

export default function BookReaderModal({ book, visible, onClose }) {
  const { getBookRecord, loadProgress, saveProgress } = useLibrary();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const updateProgress = useCallback(
    async (nextIndex, totalChapters) => {
      if (!book || totalChapters === 0) return;
      const record = getBookRecord(book.contentHash);
      if (!record) return;
      const percent = ((nextIndex + 1) / totalChapters) * 100;
      await saveProgress(record.id, { spineIndex: nextIndex }, percent);
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
      setCurrentIndex(0);

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
          const html = await entry.async("string");
          const text = stripHtml(html);
          if (!text) continue;
          const title =
            manifestItem.title ??
            manifestItem["dc:title"] ??
            chapterTitleFromText(text, `Section ${loadedChapters.length + 1}`);
          loadedChapters.push({ id: idref, title, text });
        }

        if (cancelled) return;

        if (loadedChapters.length === 0) {
          throw new Error("Could not extract chapters from EPUB.");
        }
        setChapters(loadedChapters);

        const progress = await loadProgress(record.id);
        if (!cancelled && progress?.last_location?.spineIndex >= 0) {
          const idx = Math.min(
            progress.last_location.spineIndex,
            loadedChapters.length - 1
          );
          setCurrentIndex(idx);
          updateProgress(idx, loadedChapters.length);
        } else if (!cancelled) {
          updateProgress(0, loadedChapters.length);
        }
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
  }, [visible, book, getBookRecord, loadProgress, updateProgress]);

  const currentChapter = useMemo(
    () => (chapters.length ? chapters[currentIndex] : null),
    [chapters, currentIndex]
  );

  const goToChapter = async (direction) => {
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= chapters.length) return;
    setCurrentIndex(nextIndex);
    updateProgress(nextIndex, chapters.length);
  };

  const closeReader = () => {
    setChapters([]);
    setCurrentIndex(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeReader}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { maxHeight: "90%" }]}>
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
                Chapter {currentIndex + 1} of {chapters.length}
              </Text>
              <ScrollView style={{ maxHeight: 400, marginBottom: 16 }}>
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>
                  {currentChapter?.title}
                </Text>
                <Text style={{ lineHeight: 22 }}>{currentChapter?.text}</Text>
              </ScrollView>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Pressable
                  style={[styles.button, { flex: 1, marginRight: 6 }]}
                  disabled={currentIndex === 0}
                  onPress={() => goToChapter(-1)}
                >
                  <Text style={styles.buttonLabel}>Previous</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, { flex: 1, marginLeft: 6 }]}
                  disabled={currentIndex >= chapters.length - 1}
                  onPress={() => goToChapter(1)}
                >
                  <Text style={styles.buttonLabel}>Next</Text>
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
