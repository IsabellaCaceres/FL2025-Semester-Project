// screens/LibraryScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/LibrarysScreen.styles";
import { useLibrary } from "../lib/library-context";
import BookModal from "../components/BookModal";
import { fetchLists, createList } from "../lib/api";

export default function LibraryScreen() {
  const { library, allBooks, isLoading, getBookRecord } = useLibrary();
  const [lists, setLists] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isSavingList, setIsSavingList] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const booksByHash = useMemo(() => {
    const map = new Map();
    for (const book of allBooks ?? []) {
      if (book?.contentHash) {
        map.set(book.contentHash, book);
      }
    }
    return map;
  }, [allBooks]);

  const mapListPayload = useCallback(
    (payload) => {
      if (!payload) return null;
      const items = Array.isArray(payload.items) ? payload.items : [];
      const books = items
        .map((item) => {
          if (!item?.content_hash) return null;
          return booksByHash.get(item.content_hash) ?? null;
        })
        .filter(Boolean);
      return {
        id: payload.id,
        name: payload.name,
        description: payload.description ?? "",
        books,
      };
    },
    [booksByHash]
  );

  const loadLists = useCallback(async () => {
    setIsLoadingLists(true);
    try {
      const result = await fetchLists();
      if (!Array.isArray(result)) {
        setLists([]);
        return;
      }
      const formatted = result
        .map(mapListPayload)
        .filter(Boolean);
      setLists(formatted);
    } catch (error) {
      console.warn("Failed to load lists", error);
      setLists([]);
    } finally {
      setIsLoadingLists(false);
    }
  }, [mapListPayload]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const filteredBooks = useMemo(() => {
    const source = library ?? [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return source;
    return source.filter((book) => book.title.toLowerCase().includes(query));
  }, [library, searchQuery]);

  const curatedStacks = useMemo(() => {
    return [
      {
        key: "library",
        title: "On your shelf",
        subtitle: library.length
          ? `${library.length} title${library.length === 1 ? "" : "s"}`
          : "Nothing filed yet",
        books: library,
      },
    ];
  }, [library]);

  const handleBookPress = (book) => setSelectedBook(book);

  const toggleBookSelection = (book) => {
    if (selectedBooks.some((b) => b.id === book.id)) {
      setSelectedBooks((prev) => prev.filter((b) => b.id !== book.id));
    } else {
      setSelectedBooks((prev) => [...prev, book]);
    }
  };

  const handleCreateList = useCallback(async () => {
    if (isSavingList) return;
    const trimmedName = newListName.trim();
    if (!trimmedName) {
      Alert.alert("Missing info", "List name is required.");
      return;
    }
    if (!selectedBooks.length) {
      Alert.alert("Add books", "Please select at least one book.");
      return;
    }

    const bookIds = [];
    const missingRecords = [];
    for (const book of selectedBooks) {
      const record = book?.contentHash ? getBookRecord(book.contentHash) : null;
      if (!record?.id) {
        missingRecords.push(book?.title ?? "Untitled");
        continue;
      }
      bookIds.push(record.id);
    }

    if (missingRecords.length) {
      Alert.alert(
        "Still syncing",
        `Couldn't find ${missingRecords.length > 1 ? "these books" : "this book"} in your catalog yet. Please try again once syncing finishes.`
      );
      return;
    }

    setIsSavingList(true);
    try {
      const created = await createList({
        name: trimmedName,
        bookIds,
      });
      if (!created) {
        Alert.alert("Something went wrong", "We couldn't save your list. Please try again.");
        return;
      }
      const hydrated = mapListPayload(created);
      if (hydrated) {
        setLists((prev) => [hydrated, ...prev.filter((list) => list.id !== hydrated.id)]);
      }
      setNewListName("");
      setSelectedBooks([]);
      setSearchQuery("");
      setShowCreateListModal(false);
    } catch (error) {
      console.warn("Failed to create list", error);
      Alert.alert("Something went wrong", "We couldn't save your list. Please try again.");
    } finally {
      setIsSavingList(false);
      await loadLists();
    }
  }, [isSavingList, newListName, selectedBooks, getBookRecord, mapListPayload, loadLists]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroHeader}>
          <View style={styles.heroRow}>
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroLabel}>Collection</Text>
              <Text style={styles.heroTitle}>Library</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              style={styles.createButton}
              onPress={() => setShowCreateListModal(true)}
            >
              <Text style={styles.createButtonLabel}>+ Create list</Text>
            </Pressable>
          </View>
          <Text style={styles.heroSubtitle}>
            Arrange your shelves.
          </Text>
        </View>

        {curatedStacks.map((stack) => (
          <View key={stack.key} style={styles.shelfSection}>
            <View style={styles.shelfHeader}>
              <Text style={styles.shelfTitle}>{stack.title}</Text>
              <Text style={styles.shelfMeta}>{stack.subtitle}</Text>
            </View>
            {isLoading && stack.key === "library" ? (
              <Text style={styles.emptyState}>Syncing your library…</Text>
            ) : stack.books.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfRow}
              >
                {stack.books.map((book) => (
                  <Pressable key={book.id} onPress={() => handleBookPress(book)} style={styles.bookCard}>
                    <View style={styles.bookArt}>
                      <Image
                        source={book.coverSource ?? book.cover ?? undefined}
                        style={styles.bookCover}
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyState}>Nothing on this shelf yet.</Text>
            )}
          </View>
        ))}

        <View style={styles.listsSection}>
          <View style={styles.listsHeader}>
            <Text style={styles.listsTitle}>Your lists</Text>
            <Text style={styles.listsMeta}>
              {lists.length
                ? `${lists.length} curated collection${lists.length === 1 ? "" : "s"}`
                : "No lists yet"}
            </Text>
          </View>

          {isLoadingLists ? (
            <Text style={styles.emptyState}>Syncing your lists…</Text>
          ) : lists.length === 0 ? (
            <Text style={styles.emptyState}>Create a list to catalogue moods, moments, and future reads.</Text>
          ) : (
            <View style={styles.listsGrid}>
              {lists.map((list) => {
                const previewBooks = list.books.slice(0, 3);
                const remainingCount = Math.max(0, list.books.length - previewBooks.length);
                return (
                  <View key={list.id} style={styles.listCard}>
                    <View style={styles.listPreviewRow}>
                      {previewBooks.map((book, index) => (
                        <View
                          key={book.id}
                          style={[
                            styles.listPreviewCoverWrapper,
                            index > 0 && styles.listPreviewCoverOverlap,
                          ]}
                        >
                          {book.coverSource || book.cover ? (
                            <Image
                              source={book.coverSource ?? book.cover ?? undefined}
                              style={styles.listPreviewCover}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.listPreviewPlaceholder}>
                              <Text style={styles.listPreviewInitials}>
                                {(book.title ?? "").slice(0, 1).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                      {remainingCount > 0 ? (
                        <View
                          style={[
                            styles.listPreviewCoverWrapper,
                            previewBooks.length > 0 && styles.listPreviewCoverOverlap,
                            styles.listPreviewOverflow,
                          ]}
                        >
                          <Text style={styles.listPreviewOverflowLabel}>+{remainingCount}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.listCardTitle}>{list.name}</Text>
                    <Text style={styles.listCardMeta}>
                      {list.books.length} saved title{list.books.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showCreateListModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowCreateListModal(false);
          setSelectedBooks([]);
          setSearchQuery("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create a new list</Text>
            <TextInput
              style={styles.input}
              placeholder="Headline for your list"
              value={newListName}
              onChangeText={setNewListName}
            />
            <TextInput
              style={styles.input}
              placeholder="Search your catalog…"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalGrid}>
              {filteredBooks.length ? (
                filteredBooks.map((book) => {
                  const isSelected = selectedBooks.some((item) => item.id === book.id);
                  const initials = (book.title ?? "?").slice(0, 2).toUpperCase();
                  return (
                    <Pressable
                      key={book.id}
                      onPress={() => toggleBookSelection(book)}
                      style={[styles.modalGridItem, isSelected && styles.modalGridItemSelected]}
                    >
                      <View style={styles.modalGridCoverShell}>
                        {book.coverSource || book.cover ? (
                          <Image
                            source={book.coverSource ?? book.cover ?? undefined}
                            style={styles.modalGridCover}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.modalGridPlaceholder}>
                            <Text style={styles.modalGridInitials}>{initials}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.modalGridLabel} numberOfLines={2}>
                        {book.title}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text style={styles.modalEmptyState}>Add books to your library to create lists.</Text>
              )}
            </ScrollView>
            <Pressable
              style={[styles.modalPrimary, isSavingList && styles.modalPrimaryDisabled]}
              onPress={handleCreateList}
              disabled={isSavingList}
            >
              <Text
                style={[styles.modalPrimaryLabel, isSavingList && styles.modalPrimaryLabelDisabled]}
              >
                {isSavingList ? "Saving…" : "Save list"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalSecondary}
              onPress={() => {
                setShowCreateListModal(false);
                setSelectedBooks([]);
                setSearchQuery("");
                setNewListName("");
              }}
            >
              <Text style={styles.modalSecondaryLabel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BookModal visible={!!selectedBook} book={selectedBook} onClose={() => setSelectedBook(null)} />
    </SafeAreaView>
  );
}
