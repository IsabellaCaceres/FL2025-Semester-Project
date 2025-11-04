import React, { useEffect, useState } from "react";
import { Modal, View, Text, Image, Pressable, ScrollView } from "react-native";
import styles from "../styling/BookModal.styles"
import { useLibrary } from "../lib/library-context";
import BookReaderModal from "./BookReaderModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "react-native";

export default function BookModal({ visible, book, onClose }) {
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibrary();
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    if (!visible) setReaderOpen(false);
  }, [visible, book?.id]);

  // Don't render anything if not visible or no book
  if (!visible || !book) {
    return null;
  }

  const authors = book.authors?.length
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
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <ImageBackground
          source={book.coverSource ?? book.cover ?? undefined}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
        <View style={styles.buttonNav}>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={onClose}
          >
            <Text style={styles.buttonLabel}>Close</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonToggle]} onPress={handlePrimaryAction}>
            <Text style={styles.buttonLabel}>
              {inLibrary ? "Remove from Library" : "Add to Library"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.modalTitle}>{book.title}</Text>
        <Text style={styles.modalAuthor}>{authors}</Text>

        {book.summary ? (
          <Text style={styles.modalBlurb}>{book.summary}</Text>
        ) : null}

        {book.genres?.length ? (
          <Text style={styles.modalBlurb}>
            {book.genres.join(" • ")}
          </Text>
        ) : null}
        
        <View style={styles.readButtonContainer}>
          {inLibrary ? (
            <Pressable
              style={[styles.button, styles.buttonAlt]}
              onPress={() => setReaderOpen(true)}
            >
              <Text style={styles.buttonLabel}>Read Book</Text>
            </Pressable>
          ) : null}
        </View>

      </SafeAreaView>
      <BookReaderModal
        visible={readerOpen}
        book={book}
        onClose={() => setReaderOpen(false)}
      />
    </Modal>
  );
}