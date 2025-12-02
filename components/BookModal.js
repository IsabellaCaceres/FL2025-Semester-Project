import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLibrary } from "../lib/library-context";
import { theme } from "../styling/theme";
import BookReaderModal from "./BookReaderModal";

function cleanSummary(raw) {
  if (!raw) return null;
  let summary = raw;
  return summary.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&mdash;/gi, "—").replace(/&ndash;/gi, "–").replace(/&rsquo;/gi, "'").replace(/&#160;/gi, " ").replace(/&#8729;/gi, "∙").replace(/&#8212;/gi, "—").replace(/&#39;/gi, "'").replace(/&rdquo;/gi, "”").replace(/&ldquo;/gi, "“").replace(/&quot;/gi, "\"").replace(/&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&").replace(/&hellip;/gi, "…").replace(/&copy;/gi, "©").replace(/&reg;/gi, "®").replace(/&trade;/gi, "™").replace(/\s+/g, " ").replace(/\s([,.;!?])/g, "$1").trim();
}

export default function BookModal({ visible, book, onClose }) {
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  const [readerOpen, setReaderOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width > 768;

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

  if (!book) return null;

  const containerStyle = isDesktop 
    ? [modalStyles.webContainer, { maxHeight: height * 0.85 }] 
    : modalStyles.fullscreenContainer;

  return (
    <>
      <Modal
        visible={!!(visible && book)}
        animationType={isDesktop ? "fade" : "slide"}
        transparent={true}
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={[
          modalStyles.modalOverlay, 
          isDesktop && modalStyles.webOverlay
        ]}>
           {/* Backdrop click to close on web */}
           {isDesktop && (
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          )}

          <View style={containerStyle}>
            {/* Banner */}
            <ImageBackground
              source={book.coverSource ?? book.cover ?? undefined}
              style={modalStyles.bannerImage}
              resizeMode="cover"
            >
              <View style={modalStyles.overlayLayer} />
              <View style={modalStyles.headerContent}>
                <Text style={modalStyles.title} numberOfLines={2}>{book.title}</Text>
                {authors ? <Text style={modalStyles.author}>by {authors}</Text> : null}
                {publisher ? (
                  <Text style={modalStyles.metaLine}>Published by {publisher}</Text>
                ) : null}
                {genres?.length ? (
                  <Text style={modalStyles.genrePill}>{genres[0]}</Text>
                ) : null}
              </View>

              {/* Close button */}
              <Pressable
                onPress={onClose}
                style={modalStyles.closeButton}
                accessibilityRole="button"
              >
                <Feather name="x" size={22} color={theme.colors.offwhite} />
              </Pressable>
            </ImageBackground>

            {/* Scrollable content */}
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
        </View>
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // Darken background for web focus
  },
  webOverlay: {
    padding: theme.spacing.xl,
  },
  fullscreenContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: theme.colors.offwhite,
  },
  webContainer: {
    width: 600,
    maxWidth: "90%",
    backgroundColor: theme.colors.offwhite,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  bannerImage: {
    width: "100%",
    height: 240,
    justifyContent: "flex-end",
  },
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.8))", // Web gradient hint
  },
  headerContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  author: {
    fontSize: theme.fontSizes.md,
    color: "rgba(255,255,255,0.9)",
    fontFamily: theme.fonts.text,
    marginBottom: theme.spacing.xs,
  },
  metaLine: {
    fontSize: theme.fontSizes.sm,
    color: "rgba(255,255,255,0.7)",
    fontFamily: theme.fonts.text,
  },
  genrePill: {
    alignSelf: "flex-start",
    textTransform: "uppercase",
    fontSize: 11,
    fontFamily: theme.fonts.text,
    backgroundColor: "rgba(255,255,255,0.2)",
    color: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  scrollContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  summary: {
    fontSize: theme.fontSizes.md,
    lineHeight: 26,
    color: theme.colors.charcoal,
    fontFamily: theme.fonts.text,
  },
  controlsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  controlButton: {
    flex: 1,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  readButton: {
    backgroundColor: theme.colors.black,
  },
  removeButton: {
    backgroundColor: theme.colors.lightGrey,
    borderWidth: 1,
    borderColor: theme.colors.grey,
  },
  addButton: {
    backgroundColor: theme.colors.black,
    marginTop: theme.spacing.sm,
  },
  controlLabel: {
    color: theme.colors.white,
    fontFamily: theme.fonts.text,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 0.5,
    fontSize: theme.fontSizes.md,
  },
  secondaryLabel: {
    color: theme.colors.charcoal,
    fontFamily: theme.fonts.text,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSizes.md,
  },
});
