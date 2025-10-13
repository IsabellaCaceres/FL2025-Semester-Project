// screens/HomeScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/global-styles";
import { libraryBooks, recommendations } from "../data/data";

export default function HomeScreen() {
  const [selectedBook, setSelectedBook] = useState(null);

  const handleBookPress = (book) => setSelectedBook(book);

  const handleAddToLibrary = (book) => {
    Alert.alert("Added!", `"${book.title}" has been added to your library.`);
    setSelectedBook(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Goodreads2</Text>
          <Pressable
            style={styles.browseButton}
            onPress={() => console.log("Browse pressed")}
          >
            <Text style={styles.browseText}>Browse</Text>
          </Pressable>
        </View>

        {/* Library Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Library</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {libraryBooks.map((book, index) => (
              <Pressable key={index} onPress={() => handleBookPress(book)}>
                <View style={styles.bookCard}>
                  <Image
                    source={book.cover}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <View style={styles.recommendationsGrid}>
            {recommendations.map((item, index) => (
              <Pressable key={index} onPress={() => handleBookPress(item)}>
                <View style={styles.bookCard}>
                  <Image
                    source={item.cover}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Book Modal */}
      <Modal
        visible={!!selectedBook}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBook(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedBook && (
              <>
                <Image
                  source={selectedBook.cover}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                <Text style={styles.modalAuthor}>
                  {selectedBook.author || "Unknown Author"}
                </Text>
                <Text style={styles.modalBlurb}>
                  {selectedBook.blurb || "This is a sample blurb for the book."}
                </Text>

                {libraryBooks.some((b) => b.title === selectedBook.title) ? (
                  <View style={styles.modalButtonRow}>
                    <View style={[styles.button, styles.buttonDisabled]}>
                      <Text style={styles.buttonLabel}>Already in Library</Text>
                    </View>
                    <Pressable
                      style={[styles.button, styles.buttonAlt]}
                      onPress={() =>
                        console.log(
                          "Continue Reading pressed for",
                          selectedBook.title
                        )
                      }
                    >
                      <Text style={styles.buttonLabel}>Continue Reading</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.button}
                    onPress={() => handleAddToLibrary(selectedBook)}
                  >
                    <Text style={styles.buttonLabel}>Add to Library</Text>
                  </Pressable>
                )}

                <View style={styles.searchHeaderContainer}>
                  <Text style={styles.searchHeaderText}>
                    Want more like this? Tell us what you're looking for.
                  </Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search books, authors, clubs..."
                    onChangeText={(text) => console.log("Search:", text)}
                  />
                </View>

                <Pressable
                  style={[styles.button, styles.buttonMuted]}
                  onPress={() => setSelectedBook(null)}
                >
                  <Text style={styles.buttonLabel}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
