import React, { useEffect, useState } from "react";
import { Modal, View, Text, Image, Pressable, ScrollView } from "react-native";
import styles from "../styling/global-styles";
import { useLibrary } from "../lib/library-context";
import BookReaderModal from "./BookReaderModal";

export default function BookModal({ visible, book, onClose }) {
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    if (!visible) setReaderOpen(false);
  }, [visible, book?.id]);

  if (!visible || !book) return null;

  const authors = book.authors.length
    ? book.authors.join(", ")
    : book.author || "Unknown author";
  const inLibrary = isInLibrary(book.id);

  const handlePrimaryAction = () => {
    if (inLibrary) {
      removeFromLibrary(book.id);
    } else {
      addToLibrary(book.id);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Image
              source={book.coverSource ?? book.cover ?? undefined}
              style={styles.modalImage}
              resizeMode="cover"
            />
            <Text style={styles.modalTitle}>{book.title}</Text>
            <Text style={styles.modalAuthor}>{authors}</Text>

            {book.summary ? (
              <Text style={styles.modalBlurb}>{book.summary}</Text>
            ) : null}

            {book.genres.length ? (
              <Text style={styles.modalBlurb}>
                {book.genres.join(" • ")}
              </Text>
            ) : null}

            {inLibrary ? (
              <Pressable
                style={[styles.button, styles.buttonAlt]}
                onPress={() => setReaderOpen(true)}
              >
                <Text style={styles.buttonLabel}>Read Book</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.button} onPress={handlePrimaryAction}>
              <Text style={styles.buttonLabel}>
                {inLibrary ? "Remove from Library" : "Add to Library"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.buttonMuted]}
              onPress={onClose}
            >
              <Text style={styles.buttonLabel}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
      <BookReaderModal
        visible={readerOpen}
        book={book}
        onClose={() => setReaderOpen(false)}
      />
    </Modal>
  );
}
