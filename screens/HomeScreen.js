// screens/HomeScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/HomeScreen.styles";
import BookModal from "../components/BookModal";
import { useLibrary } from "../lib/library-context";

export default function HomeScreen() {
  const { allBooks, recommended } = useLibrary();
  const [selectedBook, setSelectedBook] = useState(null);
  const [trendingIds, setTrendingIds] = useState([]);
  const handleBookPress = (book) => setSelectedBook(book);

  useEffect(() => {
    if (!allBooks?.length) {
      setTrendingIds([]);
      return;
    }

    const idToBook = new Map(allBooks.map((book) => [book.id, book]));

    setTrendingIds((previous) => {
      const next = [];
      const seen = new Set();

      const pushId = (id) => {
        if (!id || seen.has(id) || !idToBook.has(id) || next.length >= 8) return;
        seen.add(id);
        next.push(id);
      };

      for (const id of previous) {
        if (next.length >= 8) break;
        pushId(id);
      }

      for (const book of recommended ?? []) {
        if (next.length >= 8) break;
        pushId(book.id);
      }

      if (next.length < 8) {
        for (const book of allBooks) {
          if (next.length >= 8) break;
          pushId(book.id);
        }
      }

      if (next.length === previous.length && next.every((id, index) => id === previous[index])) {
        return previous;
      }

      return next;
    });
  }, [recommended, allBooks]);

  const trendingItems = useMemo(() => {
    if (!trendingIds.length || !allBooks?.length) return [];

    const idToBook = new Map(allBooks.map((book) => [book.id, book]));

    const truncateSummary = (text) => {
      if (!text) return null;
      if (text.length <= 180) return text;
      const slice = text.slice(0, 180);
      const lastSpace = slice.lastIndexOf(" ");
      const trimmed = lastSpace > 120 ? slice.slice(0, lastSpace) : slice;
      return `${trimmed.trim()}...`;
    };

    const sanitizeSummary = (book) => {
      const candidate = [
        book.summary,
        book.description,
        book.metadata?.description,
      ].find((value) => typeof value === "string" && value.trim().length);

      if (!candidate) return null;

      const cleaned = candidate
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&mdash;/gi, "—")
        .replace(/&ndash;/gi, "–")
        .replace(/&rsquo;/gi, "'")
        .replace(/&#160;/gi, " ")
        .replace(/&#8729;/gi, "∙")
        .replace(/&#8212;/gi, "—")
        .replace(/&#39;/gi, "'")
        .replace(/&rdquo;/gi, "”")
        .replace(/&ldquo;/gi, "“")
        .replace(/&quot;/gi, "\"")
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&amp;/gi, "&")
        .replace(/&hellip;/gi, "…")
        .replace(/&copy;/gi, "©")
        .replace(/&reg;/gi, "®")
        .replace(/&trade;/gi, "™")
        .replace(/\s+/g, " ")
        .replace(/\s([,.;!?])/g, "$1")
        .trim();

      return truncateSummary(cleaned);
    };

    return trendingIds
      .map((id) => {
        const book = idToBook.get(id);
        if (!book) return null;
        return {
          book,
          summary: sanitizeSummary(book),
        };
      })
      .filter(Boolean);
  }, [trendingIds, allBooks]);

  const genreRows = useMemo(() => {
    if (!allBooks?.length) return [];
    const sectionMap = new Map();
    const assigned = new Set();

    for (const book of allBooks) {
      if (assigned.has(book.id)) continue;
      const primaryGenre = (book.genres && book.genres[0]) || "General";
      if (!sectionMap.has(primaryGenre)) {
        sectionMap.set(primaryGenre, []);
      }
      sectionMap.get(primaryGenre).push(book);
      assigned.add(book.id);
    }

    return Array.from(sectionMap.entries())
      .map(([genre, books]) => ({
        genre,
        books: books.slice(0, 8),
      }))
      .filter((row) => row.books.length > 0)
      .slice(0, 8);
  }, [allBooks]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {trendingItems.length ? (
          <View style={styles.trendingSection}>
            <View style={styles.trendingHeader}>
              <Text style={styles.trendingHeading}>Currently Trending</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingRow}
            >
              {trendingItems.map(({ book, summary }, index) => (
                <Pressable
                  key={book.id ?? `${book.title}-${index}`}
                  style={[styles.featureCard, styles.trendingCard]}
                  onPress={() => handleBookPress(book)}
                >
                  <View style={styles.featureImageWrapper}>
                    <Image
                      source={book.coverSource ?? book.cover ?? undefined}
                      style={styles.featureImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{book.title}</Text>
                    {book.author ? (
                      <Text style={styles.featureAuthor}>by {book.author}</Text>
                    ) : null}
                    {summary ? (
                      <Text style={styles.featureSummary} numberOfLines={3}>
                        {summary}
                      </Text>
                    ) : null}
                    {book.genres?.length ? (
                      <Text style={styles.featureGenre}>{book.genres[0]}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by Genre</Text>
        </View>

        {genreRows.length ? (
          <View style={styles.genreGrid}>
            {genreRows.map((row) => (
              <View key={row.genre} style={styles.genreSection}>
                <View style={styles.genreHeader}>
                  <Text style={styles.genreTitle}>{row.genre}</Text>
                  <Text style={styles.genreCount}>{row.books.length} titles</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
                  {row.books.map((book) => (
                    <Pressable key={book.id} onPress={() => handleBookPress(book)} style={styles.genreCard}>
                      <View style={styles.genreCoverWrapper}>
                        <Image
                          source={book.coverSource ?? book.cover ?? undefined}
                          style={styles.genreCover}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.genreBookTitle} numberOfLines={2}>
                        {book.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        ) : null}
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
