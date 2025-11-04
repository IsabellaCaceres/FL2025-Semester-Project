import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLibrary } from "../lib/library-context";
import { theme } from "../styling/theme";
import BookReaderModal from "./BookReaderModal";

function cleanSummary(raw) {
  if (!raw) return null;
  let summary = raw;

  if (typeof summary === "object") {
    if (summary?.value) summary = summary.value;
    else if (Array.isArray(summary)) summary = summary.join(" ");
    else summary = JSON.stringify(summary);
  }

  if (typeof summary !== "string") summary = String(summary);

  const trimmed = summary.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "string") summary = parsed;
      else if (parsed?.summary) summary = parsed.summary;
      else if (parsed?.value) summary = parsed.value;
      else summary = JSON.stringify(parsed);
    } catch {
      summary = trimmed;
    }
  }

  return summary
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export default function BookModal({ visible, book, onClose }) {
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    if (!visible) setReaderOpen(false);
  }, [visible, book?.id]);

  const inLibrary = book ? isInLibrary(book.id) : false;

  const authors = useMemo(() => {
    if (!book) return "";
    return book.authors?.length ? book.authors.join(", ") : book.author ?? "Unknown";
  }, [book]);

  const summary = useMemo(
    () =>
      cleanSummary(
        book?.summary ?? book?.description ?? book?.metadata?.description ?? ""
      ),
    [book]
  );

  const publisher = book?.publisher ?? book?.metadata?.publisher ?? "";
  const genres = book?.genres ?? [];

  const handlePrimaryAction = () => {
    if (!book) return;
    if (inLibrary) removeFromLibrary(book.id);
    else addToLibrary(book.id);
  };

  return (
    <>
      <Modal
        visible={!!(visible && book)}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={modalStyles.overlay}>
          {book ? (
            <View style={modalStyles.card}>
              <View style={modalStyles.closeRow}>
                <Pressable onPress={onClose} style={modalStyles.closeButton} accessibilityRole="button">
                  <Feather name="x" size={20} color={theme.colors.black} />
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={modalStyles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={modalStyles.headerBlock}>
                  <View style={modalStyles.coverShadow}>
                    <Image
                      source={book.coverSource ?? book.cover ?? undefined}
                      style={modalStyles.cover}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={modalStyles.headerText}>
                    <Text style={modalStyles.title}>{book.title}</Text>
                    {authors ? <Text style={modalStyles.author}>by {authors}</Text> : null}
                    {publisher ? (
                      <Text style={modalStyles.metaLine}>Published by {publisher}</Text>
                    ) : null}
                    {genres?.length ? (
                      <Text style={modalStyles.genrePill}>{genres[0]}</Text>
                    ) : null}
                  </View>
                </View>

                {summary ? <Text style={modalStyles.summary}>{summary}</Text> : null}

                <View style={modalStyles.controls}>
                  <Pressable
                    style={[modalStyles.controlButton, inLibrary ? modalStyles.readButton : modalStyles.addButton]}
                    onPress={handlePrimaryAction}
                  >
                    <Text style={modalStyles.controlLabel}>
                      {inLibrary ? "Remove from Library" : "Add to Library"}
                    </Text>
                  </Pressable>
                  {inLibrary ? (
                    <Pressable
                      style={[modalStyles.controlButton, modalStyles.secondaryButton]}
                      onPress={() => setReaderOpen(true)}
                    >
                      <Text style={modalStyles.secondaryLabel}>Read Book</Text>
                    </Pressable>
                  ) : null}
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
      <BookReaderModal visible={readerOpen} book={book} onClose={() => setReaderOpen(false)} />
    </>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    maxHeight: 640,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.offwhite,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    shadowColor: "rgba(0,0,0,0.25)",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  closeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerBlock: {
    flexDirection: "row",
    gap: theme.spacing.lg,
  },
  coverShadow: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    backgroundColor: "rgba(32,29,25,0.05)",
  },
  cover: {
    width: 140,
    height: 210,
  },
  headerText: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.fonts.heading,
    color: theme.colors.black,
    letterSpacing: 0.4,
  },
  author: {
    fontSize: theme.fontSizes.md,
    color: "rgba(32,29,25,0.75)",
    fontFamily: theme.fonts.text,
  },
  metaLine: {
    fontSize: theme.fontSizes.sm,
    color: "rgba(32,29,25,0.6)",
    fontFamily: theme.fonts.text,
  },
  genrePill: {
    alignSelf: "flex-start",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    backgroundColor: theme.colors.black,
    color: theme.colors.offwhite,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  summary: {
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
    color: "rgba(32,29,25,0.85)",
    fontFamily: theme.fonts.text,
  },
  controls: {
    gap: theme.spacing.sm,
  },
  controlButton: {
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: theme.colors.black,
  },
  readButton: {
    backgroundColor: theme.colors.black,
  },
  controlLabel: {
    color: theme.colors.offwhite,
    fontFamily: theme.fonts.text,
    fontWeight: theme.fontWeight.semiBold,
    letterSpacing: 0.4,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(32,29,25,0.2)",
  },
  secondaryLabel: {
    color: theme.colors.black,
    fontFamily: theme.fonts.text,
    fontWeight: theme.fontWeight.medium,
  },
});
