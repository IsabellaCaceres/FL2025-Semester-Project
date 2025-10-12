// screens/LibraryScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/global-styles";
import { libraryBooks, allBooks } from "../data/data";


export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState("Library");
  const [lists, setLists] = useState([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState([]);

  const filteredBooks = allBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBookSelection = (book) => {
    if (selectedBooks.some((b) => b.title === book.title)) {
      setSelectedBooks(selectedBooks.filter((b) => b.title !== book.title));
    } else {
      setSelectedBooks([...selectedBooks, book]);
    }
  };

  const handleCreateList = () => {
    if (!newListName.trim()) {
      Alert.alert("Missing info", "List name is required.");
      return;
    }
    if (!selectedBooks.length) {
      Alert.alert("Add books", "Please select at least one book.");
      return;
    }
    setLists([
      ...lists,
      { id: Date.now(), name: newListName.trim(), books: selectedBooks },
    ]);
    setNewListName("");
    setSelectedBooks([]);
    setSearchQuery("");
    setShowCreateListModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        {["Library", "My Lists"].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: activeTab === tab ? "#000" : "#ddd",
              borderRadius: 8,
              marginRight: 4,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: activeTab === tab ? "#fff" : "#000",
                fontWeight: "600",
              }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "Library" ? (
        <ScrollView contentContainerStyle={styles.libraryGrid}>
          {libraryBooks.map((book, index) => (
            <View key={index} style={styles.bookCard}>
              <Image source={book.cover} style={styles.bookCover} />
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView>
          <Pressable
            style={[styles.button, { marginBottom: 12 }]}
            onPress={() => setShowCreateListModal(true)}
          >
            <Text style={styles.buttonLabel}>Create New List</Text>
          </Pressable>
          {lists.map((list) => (
            <View key={list.id} style={styles.groupCard}>
              <Text style={styles.groupName}>{list.name}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {list.books.map((book, index) => (
                  <View key={index} style={styles.bookCard}>
                    <Image source={book.cover} style={styles.bookCover} />
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal for creating lists */}
      <Modal
        visible={showCreateListModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.headerTitle}>Create a New List</Text>
            <TextInput
              style={styles.input}
              placeholder="List Name"
              value={newListName}
              onChangeText={setNewListName}
            />
            <TextInput
              style={styles.input}
              placeholder="Add books..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView style={{ maxHeight: 300, marginBottom: 12 }}>
              {filteredBooks.map((book, index) => (
                <Pressable
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                    backgroundColor: selectedBooks.some(
                      (b) => b.title === book.title
                    )
                      ? "#cce5ff"
                      : "transparent",
                    padding: 4,
                    borderRadius: 6,
                  }}
                  onPress={() => toggleBookSelection(book)}
                >
                  <Image
                    source={book.cover}
                    style={{ width: 40, height: 60, marginRight: 8 }}
                  />
                  <Text>{book.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.button} onPress={handleCreateList}>
              <Text style={styles.buttonLabel}>Create List</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: "#888", marginTop: 6 }]}
              onPress={() => {
                setShowCreateListModal(false);
                setSelectedBooks([]);
                setSearchQuery("");
                setNewListName("");
              }}
            >
              <Text style={styles.buttonLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
