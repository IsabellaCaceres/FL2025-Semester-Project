// screens/SearchScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/global-styles";
import { allBooks } from "../data/data";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const genres = [
    "Crime/Detective",
    "Romance",
    "Fantasy/SciFi",
    "Action/Adventure",
    "Mystery/Horror",
    "Comedy",
    "Literary prose",
    "Poetry",
    "Drama",
    "Historical",
    "Children/YA",
    "Philosophical/Religious",
    "Graphic novel",
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const filtered = allBooks.filter((book) =>
      book.title.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query]);

  const handleSearch = () => {
    console.log("Searching for:", query);
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
              onChangeText={setQuery}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results or genres */}
        {query.trim() ? (
          <View style={styles.searchResults}>
            {results.length > 0 ? (
              results.map((book, index) => (
                <View key={index} style={styles.searchResultCard}>
                  <Text style={styles.searchResultTitle}>{book.title}</Text>
                  {book.author && (
                    <Text style={styles.searchResultAuthor}>{book.author}</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.searchEmpty}>No books found.</Text>
            )}
          </View>
        ) : (
          <View style={styles.genreGrid}>
            {genres.map((item, index) => (
              <TouchableOpacity key={index} style={styles.genreCard}>
                <Text style={styles.genreLabel}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
