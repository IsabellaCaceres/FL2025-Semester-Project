// screens/HomeScreen.js
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/global-styles";
import BookModal from "../components/BookModal";
import { useLibrary } from "../lib/library-context";

export default function HomeScreen() {
  const { library, recommended, isLoading } = useLibrary();
  const [selectedBook, setSelectedBook] = useState(null);

  const handleBookPress = (book) => setSelectedBook(book);

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
          {isLoading ? (
            <Text style={styles.searchEmpty}>Syncing your library…</Text>
          ) : library.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {library.map((book) => (
                <Pressable key={book.id} onPress={() => handleBookPress(book)}>
                  <View style={styles.bookCard}>
                    <Image
                      source={book.coverSource ?? book.cover ?? undefined}
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
          ) : (
            <Text style={styles.searchEmpty}>
              Your library is currently empty. Find a book you like in Search!
            </Text>
          )}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <View style={styles.recommendationsGrid}>
            {recommended.length ? (
              recommended.map((item) => (
                <Pressable key={item.id} onPress={() => handleBookPress(item)}>
                  <View style={styles.bookCard}>
                    <Image
                      source={item.coverSource ?? item.cover ?? undefined}
                      style={styles.bookCover}
                      resizeMode="cover"
                    />
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.searchEmpty}>
                Add a few books to your library to see personalized picks here.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Book Modal */}
      <BookModal
        visible={!!selectedBook}
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </SafeAreaView>
  );
}
