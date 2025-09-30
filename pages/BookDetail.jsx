import React from "react";
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import books from "../data/books.json";

const BookDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;

  const book = books[id];

  if (!book) {
    return (
      <View style={styles.container}>
        <Text>Book not found.</Text>
      </View>
    );
  }

  // --- Simple recommendation algorithm ---
  const recommendations = books
    .map((b, idx) => {
      if (idx === id) return null; // skip the current book
      const overlap = b.genres.filter((g) => book.genres.includes(g)).length;
      return { ...b, _id: idx, overlap };
    })
    .filter(Boolean)
    .filter((b) => b.overlap > 0) // only keep books with at least 1 shared genre
    .sort((a, b) => b.overlap - a.overlap) // sort by most overlap
    .slice(0, 4); // take top 4

  return (
    <ScrollView style={styles.container}>
      <Button title="Back" onPress={() => navigation.goBack()} />

      <View style={styles.bookInfo}>
        <Image
          source={require("../assets/cover.png")}
          style={styles.cover}
          resizeMode="cover"
        />
        <View style={styles.infoWrapper}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>By {book.author}</Text>
          <Text style={styles.summary}>{book.summary}</Text>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>{book.rating} / 5</Text>
          </View>
        </View>
      </View>

      {/* --- Recommendations Section --- */}
      <View style={styles.reccs}>
        <Text style={styles.reccsTitle}>You may also like</Text>
        <View style={styles.bookRow}>
          {recommendations.map((rec) => (
            <TouchableOpacity
              key={rec._id}
              style={styles.book}
              onPress={() => navigation.push("BookDetail", { id: rec._id })}
            >
              <Image
                source={require("../assets/cover.png")}
                style={styles.cover}
                resizeMode="cover"
              />
              <Text style={styles.bookTitle}>{rec.title}</Text>
              <Text style={styles.bookAuthor}>By {rec.author}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  bookInfo: { flexDirection: "row", marginTop: 16 },
  cover: { width: 120, height: 180, marginRight: 16 },
  infoWrapper: { flex: 1 },
  title: { fontSize: 20, fontWeight: "bold" },
  author: { fontSize: 16, fontStyle: "italic", marginVertical: 4 },
  summary: { marginVertical: 8 },
  rating: { marginTop: 8 },
  ratingText: { fontWeight: "600" },

  reccs: { marginTop: 24 },
  reccsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  bookRow: { flexDirection: "row", flexWrap: "wrap" },
  book: { width: "45%", margin: "2.5%", alignItems: "center" },
  bookTitle: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  bookAuthor: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 2,
  },
});

export default BookDetail;
