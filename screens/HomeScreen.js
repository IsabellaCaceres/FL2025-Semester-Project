// screens/HomeScreen.js
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
// import styles from "../styling/global-styles";
import styles from "../styling/HomeScreen.styles";
import BookModal from "../components/BookModal";
import { useLibrary } from "../lib/library-context";

export default function HomeScreen() {
  const { library, recommended, isLoading } = useLibrary();
  const [selectedBook, setSelectedBook] = useState(null);
  const navigation = useNavigation();

  const handleBookPress = (book) => setSelectedBook(book);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

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
                    <View style={styles.bookCoverWrapper}>
                      <Image
                        source={book.coverSource ?? book.cover ?? undefined}
                        style={styles.bookCover}
                        resizeMode="cover"
                      />
                    </View>
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
          {recommended.length ? (
            <View style={styles.recommendationsGrid}>
              {recommended.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleBookPress(item)}
                  style={styles.recommendationCard}
                >
                  <View style={styles.recommendationCoverWrapper}>
                    <Image
                      source={item.coverSource ?? item.cover ?? undefined}
                      style={styles.recommendationCover}
                      resizeMode="cover"
                    />
                  </View>
                  <Text
                    style={styles.recommendationTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyRecommendationsContainer}>
              <Text style={styles.emptyRecommendationsText}>
                To view our recommendations, add books to your library
              </Text>
              {/* Go button unchanged */}
            </View>
          )}
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