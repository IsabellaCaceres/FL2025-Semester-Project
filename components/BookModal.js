import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLibrary } from "../lib/library-context";
import { theme } from "../styling/theme";
import BookReaderModal from "./BookReaderModal";

function cleanSummary(raw) {
  if (!raw) return null;
  let summary = raw;
  // ... keep your cleanSummary logic unchanged ...
  return summary.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&mdash;/gi, "—").replace(/&ndash;/gi, "–").replace(/&rsquo;/gi, "'").replace(/&#160;/gi, " ").replace(/&#8729;/gi, "∙").replace(/&#8212;/gi, "—").replace(/&#39;/gi, "'").replace(/&rdquo;/gi, "”").replace(/&ldquo;/gi, "“").replace(/&quot;/gi, "\"").replace(/&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&").replace(/&hellip;/gi, "…").replace(/&copy;/gi, "©").replace(/&reg;/gi, "®").replace(/&trade;/gi, "™").replace(/\s+/g, " ").replace(/\s([,.;!?])/g, "$1").trim();
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
        animationType="slide"
        transparent={false}   // 👈 full screen
        statusBarTranslucent
        onRequestClose={onClose}
      >
        {book ? (
          <View style={modalStyles.fullscreenContainer}>
            {/* Banner */}
            <ImageBackground
              source={book.coverSource ?? book.cover ?? undefined}
              style={modalStyles.bannerImage}
              resizeMode="cover"
            >
              <View style={modalStyles.overlayLayer} />
              <View style={modalStyles.headerContent}>
                <Text style={modalStyles.title}>{book.title}</Text>
                {authors ? <Text style={modalStyles.author}>by {authors}</Text> : null}
                {publisher ? (
                  <Text style={modalStyles.metaLine}>Published by {publisher}</Text>
                ) : null}
                {genres?.length ? (
                  <Text style={modalStyles.genrePill}>{genres[0]}</Text>
                ) : null}
              </View>

              {/* Close button floating over banner */}
              <Pressable
                onPress={onClose}
                style={modalStyles.closeButton}
                accessibilityRole="button"
              >
                <Feather name="x" size={22} color={theme.colors.offwhite} />
              </Pressable>
            </ImageBackground>

            {/* Scrollable content below banner */}
            <ScrollView
              contentContainerStyle={modalStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {summary ? <Text style={modalStyles.summary}>{summary}</Text> : null}

              {inLibrary && (
                <View style={modalStyles.controlsRow}>
                  <Pressable
                    style={[modalStyles.controlButton, modalStyles.readButton]}
                    onPress={() => setReaderOpen(true)}
                  >
                    <Text style={modalStyles.controlLabel}>Read</Text>
                  </Pressable>
                  <Pressable
                    style={[modalStyles.controlButton, modalStyles.removeButton]}
                    onPress={() => removeFromLibrary(book.id)}
                  >
                    <Text style={modalStyles.secondaryLabel}>Remove</Text>
                  </Pressable>
                </View>
              )}

              {!inLibrary && (
                <Pressable
                  style={[modalStyles.controlButton, modalStyles.addButton]}
                  onPress={() => addToLibrary(book.id)}
                >
                  <Text style={modalStyles.controlLabel}>Add to Library</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        ) : null}
      </Modal>

      <BookReaderModal
        visible={readerOpen}
        book={book}
        onClose={() => setReaderOpen(false)}
      />
    </>
  );
}

const modalStyles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  bannerImage: {
    width: "100%",
    height: 220,
    justifyContent: "flex-end",
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  headerContent: {
    padding: theme.spacing.md,
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  title: {
    fontSize: 26,
    fontFamily: theme.fonts.heading,
    color: theme.colors.offwhite,
  },
  author: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.offwhite,
    fontFamily: theme.fonts.text,
  },
  metaLine: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.offwhite,
    fontFamily: theme.fonts.text,
  },
  genrePill: {
    alignSelf: "flex-start",
    textTransform: "uppercase",
    fontSize: 12,
    backgroundColor: theme.colors.black,
    color: theme.colors.offwhite,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  summary: {
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
    color: "rgba(32,29,25,0.85)",
    fontFamily: theme.fonts.text,
  },
  controlsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm, // RN 0.71+ supports gap, else use marginRight
    marginTop: theme.spacing.md,
  },
  controlButton: {
    flex: 1, // each button takes equal width
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  readButton: {
    backgroundColor: theme.colors.black,
  },
  removeButton: {
    backgroundColor: theme.colors.beige, 
  },
  addButton: {
    backgroundColor: theme.colors.black,
    marginTop: theme.spacing.md,
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
