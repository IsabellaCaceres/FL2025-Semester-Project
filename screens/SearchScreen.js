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
import styles from "../styling/global-styles"
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
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Search header */}
        <View style={[styles.searchHeaderContainer, { minHeight: 140 }]}>
          <Text style={styles.searchHeaderText}>What are you looking for?</Text>

          {/* Search bar with button */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <TextInput
              style={[styles.searchInput, { flex: 1, marginRight: 10 }]}
              placeholder="Book clubs, authors, profiles, etc."
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity
              onPress={handleSearch}
              style={{
                backgroundColor: "#007AFF",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results or genres */}
        {query.trim() ? (
          <View style={{ marginTop: 20 }}>
            {results.length > 0 ? (
              results.map((book, index) => (
                <View
                  key={index}
                  style={{
                    padding: 12,
                    marginBottom: 10,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#ddd",
                  }}
                >
                  <Text style={{ fontWeight: "600", fontSize: 16 }}>
                    {book.title}
                  </Text>
                  {book.author && (
                    <Text style={{ color: "#555", marginTop: 4 }}>
                      {book.author}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", marginTop: 20, color: "#777" }}>
                No books found.
              </Text>
            )}
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            {genres.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flexBasis: "32%",
                  marginBottom: 10,
                  height: 70,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    textAlign: "center",
                    fontSize: 14,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
