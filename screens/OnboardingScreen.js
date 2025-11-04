import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import CoverCarousel from "../components/CoverCarousel";
import books from "../data/books.json";
import libraryBooks from "../data/libraryBooks.json";

const FONT_SANS = "SF Pro Display, SF Pro Text, Helvetica Neue, Helvetica, Arial, sans-serif";

const MAX_FAVORITE_GENRES = 5;
const MAX_FAVORITE_BOOKS = 6;

function GenreChip({ label, selected, onToggle }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onToggle(label)}
      style={[styles.genreChip, selected && styles.genreChipSelected]}
    >
      <Text style={[styles.genreLabel, selected && styles.genreLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function BookCard({ book, selected, onToggle }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onToggle(book.title)}
      style={[styles.bookCard, selected && styles.bookCardSelected]}
    >
      <View style={styles.bookCoverPlaceholder} />
      <View style={styles.bookCopy}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{book.author}</Text>
      </View>
      <View style={[styles.bookCheckbox, selected && styles.bookCheckboxSelected]} />
    </Pressable>
  );
}

export default function OnboardingScreen({
  onDismiss,
  onComplete,
  submittingAction,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const availableGenres = useMemo(() => {
    const set = new Set();
    books.forEach((entry) => {
      (entry.genres || []).forEach((genre) => set.add(genre));
    });
    return Array.from(set).sort();
  }, []);

  const recommendedBooks = useMemo(() => libraryBooks.slice(0, 12), []);

  const goNext = () => {
    if (stepIndex === 0) {
      const raw = username.trim();
      if (!raw) {
        setErrorMessage("Enter a username to continue.");
        return;
      }
      const normalized = raw.toLowerCase().replace(/\s+/g, "");
      if (!/^[a-z0-9._-]+$/.test(normalized)) {
        setErrorMessage("Use letters, numbers, dots, underscores, or dashes only.");
        return;
      }
      if (!password) {
        setErrorMessage("Choose a password for your account.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
      setErrorMessage("");
      setUsername(normalized);
      setStepIndex(1);
      return;
    }

    if (stepIndex === 1) {
      if (favoriteGenres.length === 0) {
        setErrorMessage("Select at least one genre you love.");
        return;
      }
      setErrorMessage("");
      setStepIndex(2);
      return;
    }
  };

  const goBack = () => {
    if (stepIndex === 0) {
      onDismiss();
      return;
    }
    setErrorMessage("");
    setStepIndex((index) => Math.max(0, index - 1));
  };

  const toggleGenre = (genre) => {
    setFavoriteGenres((current) => {
      if (current.includes(genre)) {
        return current.filter((item) => item !== genre);
      }
      if (current.length >= MAX_FAVORITE_GENRES) {
        return current;
      }
      return [...current, genre];
    });
  };

  const toggleBook = (title) => {
    setFavoriteBooks((current) => {
      if (current.includes(title)) {
        return current.filter((item) => item !== title);
      }
      if (current.length >= MAX_FAVORITE_BOOKS) {
        return current;
      }
      return [...current, title];
    });
  };

  const handleFinish = () => {
    if (favoriteBooks.length === 0) {
      setErrorMessage("Pick at least one book to tailor your shelf.");
      return;
    }
    setErrorMessage("");
    onComplete({
      username: username.trim().toLowerCase(),
      password,
      favoriteGenres,
      favoriteBooks,
    });
  };

  return (
    <View style={styles.container}>
      <CoverCarousel rows={5} cardsPerRow={12} />
      <View style={styles.overlay}>
        <View style={styles.heroWrapper}>
          <View style={[styles.heroCard, styles.cardShadow]}>
            <View style={styles.heroHeader}>
              <Pressable onPress={goBack} style={styles.backButton}>
                <Text style={styles.backLabel}>{stepIndex === 0 ? "Back to sign in" : "Back"}</Text>
              </Pressable>
              <Text style={styles.progressLabel}>{`Step ${stepIndex + 1} of 3`}</Text>
            </View>

            <ScrollView
              contentContainerStyle={styles.contentCard}
              showsVerticalScrollIndicator={false}
            >
              {stepIndex === 0 ? (
                <View>
                  <Text style={styles.stepTitle}>Create your account</Text>
                  <View style={[styles.inputShell, styles.fieldShell]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#d1d5db"
                      value={username}
                      autoCapitalize="none"
                      onChangeText={setUsername}
                    />
                  </View>
                  <View style={[styles.inputShell, styles.fieldShell]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#d1d5db"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                  <View style={[styles.inputShell, styles.fieldShell]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      placeholderTextColor="#d1d5db"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>
              ) : null}

              {stepIndex === 1 ? (
                <View>
                  <Text style={styles.stepTitle}>What genres keep you reading?</Text>
                  <Text style={styles.stepHint}>
                    Pick up to {MAX_FAVORITE_GENRES}. We’ll use these to recommend your first shelf.
                  </Text>
                  <View style={styles.genreGrid}>
                    {availableGenres.map((genre) => (
                      <GenreChip
                        key={genre}
                        label={genre}
                        selected={favoriteGenres.includes(genre)}
                        onToggle={toggleGenre}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {stepIndex === 2 ? (
                <View>
                  <Text style={styles.stepTitle}>Choose a few instant favorites</Text>
                  <Text style={styles.stepHint}>
                    Pick up to {MAX_FAVORITE_BOOKS} books to personalize your dashboard.
                  </Text>
                  <View style={styles.booksGrid}>
                    {recommendedBooks.map((book) => (
                      <BookCard
                        key={book.title}
                        book={book}
                        selected={favoriteBooks.includes(book.title)}
                        onToggle={toggleBook}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

              {stepIndex < 2 ? (
                <Pressable style={styles.primaryButton} onPress={goNext}>
                  <Text style={styles.primaryLabel}>Continue</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.primaryButton, submittingAction ? styles.primaryButtonDisabled : null]}
                  onPress={handleFinish}
                  disabled={!!submittingAction}
                >
                  {submittingAction === "signUp" ? (
                    <ActivityIndicator color="#111827" />
                  ) : (
                    <Text style={styles.primaryLabel}>Create account</Text>
                  )}
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 32,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroWrapper: {
    width: "100%",
    maxWidth: 860,
  },
  heroCard: {
    width: "100%",
    backgroundColor: "rgba(7, 12, 26, 0.82)",
    alignSelf: "center",
    borderRadius: 36,
    padding: 28,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backLabel: {
    color: "rgba(248,250,252,0.85)",
    fontSize: 14,
    textDecorationLine: "underline",
    fontFamily: FONT_SANS,
  },
  progressLabel: {
    color: "rgba(248,250,252,0.85)",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FONT_SANS,
  },
  contentCard: {
    paddingBottom: 120,
    gap: 18,
  },
  stepTitle: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
    fontFamily: FONT_SANS,
  },
  stepHint: {
    color: "rgba(248,250,252,0.7)",
    marginBottom: 18,
    fontSize: 16,
    fontFamily: FONT_SANS,
  },
  inputShell: {
    borderRadius: 32,
    marginBottom: 18,
  },
  fieldShell: {
    backgroundColor: "rgba(248,250,252,0.92)",
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  input: {
    color: "#111827",
    fontSize: 18,
    fontFamily: FONT_SANS,
    fontWeight: "600",
    width: "100%",
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  genreChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.3)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 8,
  },
  genreChipSelected: {
    backgroundColor: "rgba(14,116,144,0.8)",
    borderColor: "rgba(14,116,144,1)",
  },
  genreLabel: {
    color: "rgba(248,250,252,0.8)",
    fontSize: 14,
    fontFamily: FONT_SANS,
  },
  genreLabelSelected: {
    color: "#f8fafc",
    fontWeight: "600",
    fontFamily: FONT_SANS,
  },
  booksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bookCard: {
    width: "48%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.15)",
    padding: 16,
    marginBottom: 16,
    backgroundColor: "rgba(15,23,42,0.4)",
  },
  bookCardSelected: {
    borderColor: "rgba(14,116,144,1)",
    backgroundColor: "rgba(14,116,144,0.45)",
  },
  bookCoverPlaceholder: {
    height: 120,
    borderRadius: 12,
    backgroundColor: "rgba(148,163,184,0.2)",
    marginBottom: 12,
  },
  bookCopy: {
    marginBottom: 12,
  },
  bookTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: FONT_SANS,
  },
  bookAuthor: {
    color: "rgba(248,250,252,0.75)",
    fontSize: 14,
    fontFamily: FONT_SANS,
  },
  bookCheckbox: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.35)",
  },
  bookCheckboxSelected: {
    borderColor: "rgba(14,116,144,1)",
    backgroundColor: "rgba(14,116,144,0.9)",
  },
  error: {
    color: "#fca5a5",
    fontSize: 14,
    marginBottom: 16,
    fontFamily: FONT_SANS,
  },
  primaryButton: {
    borderRadius: 28,
    marginTop: 24,
    backgroundColor: "#f8fafc",
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryLabel: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1.1,
    textAlign: "center",
    fontFamily: FONT_SANS,
  },
  cardShadow: {
    shadowColor: "rgba(15,23,42,0.8)",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    elevation: 10,
  },
});


