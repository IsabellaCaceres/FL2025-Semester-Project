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
import { useLibrary } from "../lib/library-context";

export default function LibraryScreen() {
  const { library, allBooks, isLoading } = useLibrary();
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
    if (selectedBooks.some((b) => b.id === book.id)) {
      setSelectedBooks(selectedBooks.filter((b) => b.id !== book.id));
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
      <View style={styles.tabRow}>
        {["Library", "My Lists"].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab ? styles.tabButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.tabButtonLabel,
                activeTab === tab ? styles.tabButtonLabelActive : null,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
        </View>

        {activeTab === "Library" ? (
          <ScrollView contentContainerStyle={styles.libraryGrid}>
            {isLoading ? (
              <Text style={styles.searchEmpty}>Syncing your library…</Text>
            ) : library.length ? (
              library.map((book) => (
                <View key={book.id} style={styles.bookCard}>
                  <Image
                    source={book.coverSource ?? book.cover ?? undefined}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.searchEmpty}>
                Your library is currently empty. Find a book you like in Search!
              </Text>
            )}
          </ScrollView>
        ) : (
        <ScrollView>
          <Pressable
            style={[styles.button, styles.createListButton]}
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
                    <Image
                      source={book.cover}
                      style={styles.bookCover}
                      resizeMode="cover"
                    />
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
            <ScrollView style={styles.modalScroll}>
              {filteredBooks.map((book) => (
                <Pressable
                  key={book.id}
                  style={[
                    styles.listItem,
                    selectedBooks.some((b) => b.id === book.id)
                      ? styles.listItemSelected
                      : null,
                  ]}
                  onPress={() => toggleBookSelection(book)}
                >
                  <Image
                    source={book.coverSource ?? book.cover ?? undefined}
                    style={styles.listItemImage}
                    resizeMode="cover"
                  />
                  <Text>{book.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.button} onPress={handleCreateList}>
              <Text style={styles.buttonLabel}>Create List</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonMuted]}
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
