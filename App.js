import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "./lib/supabase";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

// sample data with cover placeholders
const libraryBooks = [
  {
    title: "Moby Dick",
    author: "Herman Melville",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Moby+Dick" },
  },
  {
    title: "Frankenstein",
    author: "Mary Shelley",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Frankenstein" },
  },
  {
    title: "Romeo and Juliet",
    author: "William Shakespeare",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Romeo+and+Juliet",
    },
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Pride+and+Prejudice",
    },
  },
  {
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Alice" },
  },
];

const recommendations = [
  {
    title: "Little Women",
    author: "Louisa May Alcott",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Little+Women" },
  },
  {
    title: "Dracula",
    author: "Bram Stoker",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Dracula" },
  },
  {
    title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
    author: "Robert Louis Stevenson",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Jekyll+%26+Hyde",
    },
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Gatsby" },
  },
  {
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Tale+of+Two+Cities",
    },
  },
  {
    title: "Adventures of Huckleberry Finn",
    author: "Mark Twain",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Huck+Finn" },
  },
  {
    title: "Wuthering Heights",
    author: "Emily Brontë",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Wuthering+Heights",
    },
  },
  {
    title: "War and Peace",
    author: "Leo Tolstoy",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=War+and+Peace",
    },
  },
  {
    title: "Grimms' Fairy Tales",
    author: "Jacob and Wilhelm Grimm",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Grimms+Tales" },
  },
  {
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Sherlock+Holmes",
    },
  },
  {
    title: "The Works of Edgar Allan Poe — Volume 2",
    author: "Edgar Allan Poe",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Edgar+Allan+Poe+V2",
    },
  },
  {
    title: "The Iliad",
    author: "Homer",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=The+Iliad" },
  },
  {
    title: "The Importance of Being Earnest",
    author: "Oscar Wilde",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Earnest" },
  },
  {
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Monte+Cristo" },
  },
  {
    title: "Anne of Green Gables",
    author: "L. M. Montgomery",
    cover: {
      uri: "https://via.placeholder.com/120x180.png?text=Anne+of+Green+Gables",
    },
  },
  {
    title: "The Adventures of Tom Sawyer",
    author: "Mark Twain",
    cover: { uri: "https://via.placeholder.com/120x180.png?text=Tom+Sawyer" },
  },
];

const allBooks = [...libraryBooks, ...recommendations];


// example groups
const allGroups = [
  { id: 1, name: "Moby Dick Readers", relatedBook: "Moby Dick" },
  { id: 2, name: "Romantics United", relatedBook: "Frankenstein" },
  { id: 3, name: "Shakespeare Circle", relatedBook: "Romeo and Juliet" },
  { id: 4, name: "Jane Austen Society", relatedBook: "Pride and Prejudice" },
  {
    id: 5,
    name: "Wonderland Enthusiasts",
    relatedBook: "Alice's Adventures in Wonderland",
  },
];

//homescreen
function HomeScreen({ navigation }) {
  const [selectedBook, setSelectedBook] = useState(null);

  const handleBookPress = (book) => {
    setSelectedBook(book);
  };

  const handleAddToLibrary = (book) => {
    Alert.alert("Added!", `"${book.title}" has been added to your library.`);
    setSelectedBook(null);
  };

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Library</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {libraryBooks.map((book, index) => (
              <Pressable key={index} onPress={() => handleBookPress(book)}>
                <View style={styles.bookCard}>
                  <Image
                    source={book.cover}
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <View style={styles.recommendationsGrid}>
            {recommendations.map((item, index) => (
              <Pressable key={index} onPress={() => handleBookPress(item)}>
                <View style={styles.bookCard}>
                  <Image
                    source={item.cover}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/*book modal */}
      <Modal
        visible={!!selectedBook}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBook(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedBook && (
              <>
                <Image
                  source={selectedBook.cover}
                  style={{
                    width: 160,
                    height: 220,
                    borderRadius: 8,
                    alignSelf: "center",
                    marginBottom: 12,
                  }}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {selectedBook.title}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#666",
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {selectedBook.author || "Unknown Author"}
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    color: "#444",
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {selectedBook.blurb || "This is a sample blurb for the book."}
                </Text>

                {libraryBooks.some((b) => b.title === selectedBook.title) ? (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={[
                        styles.button,
                        {
                          flex: 1,
                          backgroundColor: "#ccc",
                          opacity: 0.7,
                          marginRight: 6,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.buttonLabel,
                          { color: "#666", fontSize: 16 },
                        ]}
                      >
                        Already in Library
                      </Text>
                    </View>
                    <Pressable
                      style={[
                        styles.button,
                        { flex: 1, marginLeft: 6, backgroundColor: "#4B9CD3" },
                      ]}
                      onPress={() =>
                        console.log(
                          "Continue Reading pressed for",
                          selectedBook.title
                        )
                      }
                    >
                      <Text style={[styles.buttonLabel, { fontSize: 16 }]}>
                        Continue Reading
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.button, { marginBottom: 12 }]}
                    onPress={() => handleAddToLibrary(selectedBook)}
                  >
                    <Text style={styles.buttonLabel}>Add to Library</Text>
                  </Pressable>
                )}

                {/* search container */}
                <View style={[styles.searchHeaderContainer, { height: 140 }]}>
                  <Text style={styles.searchHeaderText}>
                    Want more like this? Tell us what you're looking for.
                  </Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search books, authors, clubs..."
                    onChangeText={(text) => console.log("Search:", text)}
                  />
                </View>

                <Pressable
                  style={[
                    styles.button,
                    { backgroundColor: "#888", marginTop: 12 },
                  ]}
                  onPress={() => setSelectedBook(null)}
                >
                  <Text style={styles.buttonLabel}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// LibraryScreen
function LibraryScreen() {
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
      {/* tabs */}
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

      {/* modal list */}
      <Modal
        visible={showCreateListModal}
        animationType="slide"
        transparent={true}
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

// my groups tab
function GroupsScreen() {
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [vibeTags, setVibeTags] = useState("");
  const [maxMembers, setMaxMembers] = useState("10");
  const [isPublic, setIsPublic] = useState(true);
  const [invitees, setInvitees] = useState("");

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert("Missing info", "Group name is required.");
      return;
    }
    if (parseInt(maxMembers) > 256 || parseInt(maxMembers) < 2) {
      Alert.alert("Invalid number", "Max members must be between 2 and 256.");
      return;
    }

    const newGroup = {
      id: Date.now(),
      name: groupName.trim(),
      vibeTags: vibeTags.split(",").map((tag) => tag.trim()),
      maxMembers: parseInt(maxMembers),
      isPublic,
      invitees: invitees.split(",").map((i) => i.trim()),
    };
    setMyGroups([...myGroups, newGroup]);
    setShowCreateModal(false);

    setGroupName("");
    setVibeTags("");
    setMaxMembers("10");
    setIsPublic(true);
    setInvitees("");
  };

  const handleJoinGroup = (group) => {
    if (myGroups.some((g) => g.id === group.id)) {
      Alert.alert("Already joined", `You're already in "${group.name}"`);
      return;
    }
    setMyGroups([...myGroups, group]);
    Alert.alert("Joined", `You joined "${group.name}"`);
  };

  const suggestedGroups = allGroups.filter(
    (group) =>
      libraryBooks.some((book) => book.title === group.relatedBook) &&
      !myGroups.some((g) => g.id === group.id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text style={styles.headerTitle}>
          {myGroups.length ? "My Groups" : "Suggested Groups"}
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.buttonLabel}>Create Group</Text>
        </Pressable>
      </View>

      <ScrollView>
        {myGroups.length > 0 ? (
          <>
            {myGroups.map((group) => (
  <View key={group.id} style={styles.groupCard}>
    <Text style={styles.groupName}>{group.name}</Text>
    <Text style={styles.groupBook}>
      {group.isPublic ? "Public" : "Private"} | Max {group.maxMembers} members
    </Text>
    {group.vibeTags?.length ? (
      <Text style={styles.groupBook}>Tags: {group.vibeTags.join(", ")}</Text>
    ) : null}
    
    <Pressable
      style={[styles.button, { marginTop: 8 }]}
      onPress={() =>
        Alert.alert("Open Group", `Opening group: "${group.name}"`)
      }
    >
      <Text style={styles.buttonLabel}>Open Group</Text>
    </Pressable>
  </View>
))}
            <Pressable
              style={[
                styles.button,
                {
                  alignSelf: "center",
                  marginVertical: 12,
                  paddingHorizontal: 20,
                },
              ]}
              onPress={() =>
                Alert.alert("Browse Groups", "Navigate to Browse Groups screen")
              }
            >
              <Text style={styles.buttonLabel}>Browse Groups</Text>
            </Pressable>
          </>
        ) : (
          suggestedGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupBook}>
                Related to {group.relatedBook}
              </Text>
              <Pressable
                style={styles.button}
                onPress={() => handleJoinGroup(group)}
              >
                <Text style={styles.buttonLabel}>Join Group</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* modal for groups */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.headerTitle}>Create a New Group</Text>
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={styles.input}
              placeholder="Vibe Tags (comma separated)"
              value={vibeTags}
              onChangeText={setVibeTags}
            />
            <TextInput
              style={styles.input}
              placeholder="Max Members (2-256)"
              value={maxMembers}
              onChangeText={setMaxMembers}
              keyboardType="numeric"
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ marginRight: 8 }}>Public?</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Invite Friends (comma-separated emails)"
              value={invitees}
              onChangeText={setInvitees}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Pressable
                style={[styles.button, { flex: 1, marginRight: 6 }]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.buttonLabel}>Create</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: "#888", flex: 1, marginLeft: 6 },
                ]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.buttonLabel}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// search tab
function SearchScreen() {
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
        {/* search header */}
        <View style={[styles.searchHeaderContainer, { minHeight: 140 }]}>
          <Text style={styles.searchHeaderText}>What are you looking for?</Text>

          {/* search bar with button */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
            }}
          >
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

        {/* if searching, show results */}
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
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
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
              <Text
                style={{ textAlign: "center", marginTop: 20, color: "#777" }}
              >
                No books found.
              </Text>
            )}
          </View>
        ) : (
          /* otherwise show genres */
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
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
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

//supabase auth
//
export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert("Missing info", "Enter both email and password.");
      return;
    }
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });
    if (signUpError) {
      const message = (signUpError.message || "").toLowerCase();
      if (
        signUpError.code === "user_already_exists" ||
        message.includes("already") ||
        message.includes("exists")
      ) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) Alert.alert("Sign in error", signInError.message);
      } else {
        Alert.alert("Sign up error", signUpError.message);
      }
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) Alert.alert("Sign in error", signInError.message);
    }
    setSubmitting(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out error", error.message);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );

  if (!userEmail) {
    return (
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Welcome</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#999"
          />
          <Pressable
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonLabel}>Sign up</Text>
            )}
          </Pressable>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="My Groups" component={GroupsScreen} />
        <Tab.Screen name="Account">
          {() => (
            <View style={styles.center}>
              <Text style={styles.hero}>Signed in as</Text>
              <Text style={styles.subtitle}>{userEmail}</Text>
              <Pressable style={styles.button} onPress={signOut}>
                <Text style={styles.buttonLabel}>Sign out</Text>
              </Pressable>
            </View>
          )}
        </Tab.Screen>
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  hero: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666" },
  form: { width: "80%", maxWidth: 420, alignSelf: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 20,
    paddingHorizontal: 15,
  },
  buttonDisabled: { opacity: 0.4 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  browseButton: {
    padding: 8,
    backgroundColor: "#4B9CD3",
    borderRadius: 8,
  },
  browseText: { color: "#fff", fontWeight: "600" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },

  bookCard: {
    width: 140,
    alignItems: "center",
    marginRight: 12,
    marginBottom: 16,
  },
  bookCover: {
    width: 120,
    height: 170,
    borderRadius: 8,
    backgroundColor: "#ccc",
    marginBottom: 6,
  },
  bookTitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  recommendationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  groupCard: {
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  groupBook: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  searchHeaderContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    minHeight: 140,
    justifyContent: "center",
  },
  searchHeaderText: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  genreCard: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 10,
    height: 60,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  genreText: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },
});
