// screens/SearchScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/global-styles";
import BookModal from "../components/BookModal";
import { useLibrary } from "../lib/library-context";

export default function SearchScreen() {
  const {
    genres,
    search,
    filterByGenre,
    addToLibrary,
    removeFromLibrary,
    isInLibrary,
    isLoading,
    library,
  } = useLibrary();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeGenre, setActiveGenre] = useState(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  const clearFilters = () => {
    setActiveGenre(null);
    setResults([]);
    setQuery("");
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed) {
      setResults(search(trimmed));
      return;
    }
    if (activeGenre) {
      setResults(filterByGenre(activeGenre));
      return;
    }
    setResults([]);
  }, [query, activeGenre, filterByGenre, search]);

  const handleGenrePress = (genre) => {
    setActiveGenre((prev) => (prev === genre ? null : genre));
    setQuery("");
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed) setResults(search(trimmed));
  };

  const handleAddToLibrary = (bookId) => {
    const wasEmpty = library.length === 0;
    addToLibrary(bookId);
    if (wasEmpty) {
      setShowCongratsModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.searchScroll}>
        {/* Search header */}
        <View style={[styles.searchHeaderContainer, styles.searchHeaderTall]}>
          <Text style={styles.searchHeaderText}>What are you looking for?</Text>

          {/* Search bar with button */}
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, styles.searchInputFlex]}
              placeholder="Book clubs, authors, profiles, etc."
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                if (text.trim()) setActiveGenre(null);
              }}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results or genres */}
        {query.trim() || activeGenre ? (
          <View style={styles.searchResults}>
            {activeGenre ? (
              <View style={styles.searchActiveFilter}>
                <Text style={styles.searchActiveLabel}>
                  Showing "{activeGenre}"
                </Text>
                <TouchableOpacity
                  style={styles.searchClearButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.searchClearText}>Clear filter</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {isLoading ? (
              <Text style={styles.searchEmpty}>Syncing your library…</Text>
            ) : results.length > 0 ? (
              results.map((book) => {
                const inLibrary = isInLibrary(book.id);
                return (
                  <View key={book.id} style={styles.searchResultCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedBook(book)}
                    >
                      <Text style={styles.searchResultTitle}>{book.title}</Text>
                      {book.authors.length ? (
                        <Text style={styles.searchResultAuthor}>
                          {book.authors.join(", ")}
                        </Text>
                      ) : null}
                      {book.summary ? (
                        <Text style={styles.searchResultSummary}>
                          {book.summary}
                        </Text>
                      ) : null}
                      {book.genres.length ? (
                        <Text style={styles.searchResultMeta}>
                          {book.genres.join(" • ")}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.searchResultButton]}
                      onPress={() =>
                        inLibrary
                          ? removeFromLibrary(book.id)
                          : handleAddToLibrary(book.id)
                      }
                      disabled={isLoading}
                    >
                      <Text style={styles.buttonLabel}>
                        {inLibrary ? "Remove from Library" : "Add to Library"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <Text style={styles.searchEmpty}>No books found.</Text>
            )}
          </View>
        ) : (
          <View style={styles.genreGrid}>
            {genres.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.genreCard,
                  activeGenre === item ? styles.genreCardActive : null,
                ]}
                onPress={() => handleGenrePress(item)}
              >
                <Text style={styles.genreLabel}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <BookModal
        visible={!!selectedBook}
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />

      {/* Congratulations Modal */}
      <Modal
        visible={showCongratsModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCongratsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.congratsModal}>
            <Text style={styles.congratsTitle}>🎉 Congratulations!</Text>
            <Text style={styles.congratsText}>
              You've added your first book! Check back home for your personalized recommendations.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowCongratsModal(false)}
            >
              <Text style={styles.buttonLabel}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}