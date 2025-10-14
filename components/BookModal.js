import React from "react";
import { Modal, View, Text, Image, Pressable, ScrollView } from "react-native";
import styles from "../styling/global-styles";
import { useLibrary } from "../lib/library-context";

export default function BookModal({ visible, book, onClose }) {
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();

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
    </Modal>
  );
}
