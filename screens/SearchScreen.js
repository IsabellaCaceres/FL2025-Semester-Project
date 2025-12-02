import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { theme } from "../styling/theme";
import { semanticSearch, fetchSemanticRecommendations } from "../lib/api";
import { useLibrary } from "../lib/library-context";

const QUICK_PROMPTS = [
  "I want a whimsical fantasy with found family",
  "Give me a sharp contemporary romance with banter",
  "What are my friends reading?",
  "What is @alice saying about 'The Hobbit'?",
];

function formatSnippet(text) {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 260) return cleaned;
  return `${cleaned.slice(0, 257)}…`;
}

export default function SearchScreen() {
  const {
    addToLibrary,
    removeFromLibrary,
    isInLibrary,
    getBook,
    refreshRecommendations,
  } = useLibrary();

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 900;

  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState([]);
  const [searchType, setSearchType] = useState("book"); // 'book' | 'social'
  const [pendingBookId, setPendingBookId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const mapResults = useCallback(
    (items = []) =>
      items
        .map((item) => {
          const hash = item?.bookId ?? item?.book_id ?? null;
          const book = hash ? getBook(hash) : null;
          if (!book) return null;
          return {
            book,
            reason: item?.reason ?? null,
            confidence: item?.confidence ?? null,
            similarity: item?.similarity ?? null,
            snippets: Array.isArray(item?.snippets) ? item.snippets : [],
            source: item?.source ?? "semantic",
          };
        })
        .filter(Boolean),
    [getBook]
  );

  const loadSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    try {
      const data = await fetchSemanticRecommendations(8);
      setSuggestions(mapResults(data));
    } catch (error) {
      console.warn("[search] Failed to load recommendations", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [mapResults]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleSearch = useCallback(
    async (override) => {
      if (isSearching) return;
      const queryText = (override ?? inputValue).trim();
      if (!queryText) return;
      setInputValue(queryText);
      setIsSearching(true);
      setSearchError("");
      setResults([]);
      setSearchType("book");

      try {
        const response = await semanticSearch(queryText, { limit: 6 });
        if (!response) {
          setReasoning("");
          setSearchError("I couldn’t find anything that fits. Try describing the characters or tone.");
          setLastQuery(queryText);
          return;
        }

        setReasoning(response.reasoning ?? "");
        setLastQuery(queryText);
        
        if (response.type === 'social') {
          setSearchType('social');
          // Social results are embedded in reasoning for now, or we can add explicit results later
        } else {
          const mapped = mapResults(response.results ?? []);
          if (!mapped.length && !response.reasoning) {
             setSearchError("I heard you, but I need a few more details to find the right match.");
             return;
          }
          setResults(mapped);
          await refreshRecommendations();
          await loadSuggestions();
        }

      } catch (error) {
        console.error("[search] Semantic search failed", error);
        setSearchError("Something went wrong. Give it another try in a moment.");
      } finally {
        setIsSearching(false);
      }
    },
    [inputValue, isSearching, mapResults, refreshRecommendations, loadSuggestions]
  );

  const handleToggleLibrary = useCallback(
    async (book) => {
      if (!book || pendingBookId) return;
      const alreadyInLibrary = isInLibrary(book.id);
      setPendingBookId(book.id);
      try {
        if (alreadyInLibrary) await removeFromLibrary(book.id);
        else await addToLibrary(book.id);
        await refreshRecommendations();
        await loadSuggestions();
      } catch (error) {
        console.warn("[search] Failed to update library", error);
      } finally {
        setPendingBookId(null);
      }
    },
    [addToLibrary, removeFromLibrary, isInLibrary, pendingBookId, refreshRecommendations, loadSuggestions]
  );

  const resultContent = useMemo(() => {
    if (searchType === 'social') return null;
    if (!results.length) return null;

    return results.map(({ book, reason, snippets }) => {
      const inLibrary = isInLibrary(book.id);
      const snippet = snippets?.length ? formatSnippet(snippets[0]) : null;
      return (
        <View key={book.id} style={styles.resultCard}>
          <View style={styles.resultCoverShadow}>
            <Image
              source={book.coverSource ?? book.cover ?? undefined}
              style={styles.resultCover}
              resizeMode="cover"
            />
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{book.title}</Text>
            {book.author ? <Text style={styles.resultAuthor}>by {book.author}</Text> : null}
            {reason ? <Text style={styles.resultReason}>{reason}</Text> : null}
            {snippet ? <Text style={styles.resultSnippet}>{snippet}</Text> : null}
            <Pressable
              style={[
                styles.resultButton,
                inLibrary ? styles.resultButtonAdded : styles.resultButtonAdd,
              ]}
              onPress={() => handleToggleLibrary(book)}
              disabled={pendingBookId === book.id}
            >
              {pendingBookId === book.id ? (
                <ActivityIndicator size="small" color={theme.colors.black} />
              ) : (
                <Text
                  style={[
                    styles.resultButtonLabel,
                    inLibrary ? styles.resultButtonLabelAdded : null,
                  ]}
                >
                  {inLibrary ? "In Library" : "Add to Library"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      );
    });
  }, [results, isInLibrary, handleToggleLibrary, pendingBookId, searchType]);

  const inputDisabled = isSearching || !inputValue.trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={isDesktop ? styles.desktopLayout : styles.mobileLayout}>
        
        <View style={isDesktop ? styles.leftColumn : styles.fullColumn}>
           <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.heroCard}>
                <Text style={styles.heroEyebrow}>Library Intelligence</Text>
                <Text style={styles.heroTitle}>Describe your next read.</Text>
                <Text style={styles.heroSubtitle}>
                  Tell us about the characters, vibes, or ask what your friends are reading.
                </Text>
              </View>

              <View style={styles.messageStack}>
                {lastQuery ? (
                  <View style={styles.messageBubbleUser}>
                    <Text style={styles.messageBadgeUser}>You</Text>
                    <Text style={styles.messageHeadingUser}>{lastQuery}</Text>
                  </View>
                ) : null}

                {reasoning ? (
                  <View style={styles.messageBubbleAI}>
                    <Text style={styles.messageBadgeAI}>AI</Text>
                    <Text style={styles.messageHeadingAI}>
                      {searchType === 'social' ? "Community Insight" : "Why these picks work"}
                    </Text>
                    <Text style={styles.messageBody}>{reasoning}</Text>
                  </View>
                ) : null}

                {searchError ? (
                  <View style={styles.messageBubbleAI}>
                    <Text style={styles.messageBadgeAI}>AI</Text>
                    <Text style={styles.messageHeadingAI}>Let’s try again</Text>
                    <Text style={styles.messageBody}>{searchError}</Text>
                  </View>
                ) : null}
              </View>
              
              {/* Suggestions (Mobile only or if no results) */}
              {!isDesktop && !results.length && (
                 <View style={styles.suggestionSection}>
                    {/* Reuse existing logic for suggestions if needed */}
                 </View>
              )}
           </ScrollView>

           <View style={styles.inputWrapper}>
              <View style={styles.inputBar}>
                <TextInput
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder="Describe characters, vibes, or ask friends..."
                  placeholderTextColor={theme.colors.grey}
                  style={styles.input}
                  autoCapitalize="sentences"
                  returnKeyType="search"
                  onSubmitEditing={() => handleSearch()}
                  editable={!isSearching}
                />
                <Pressable
                  style={[styles.inputButton, inputDisabled ? styles.inputButtonDisabled : null]}
                  onPress={() => handleSearch()}
                  disabled={inputDisabled}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Feather name="arrow-up" size={20} color={theme.colors.white} />
                  )}
                </Pressable>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptScroll}>
                {QUICK_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    style={styles.quickPromptChip}
                    onPress={() => handleSearch(prompt)}
                    disabled={isSearching}
                  >
                    <Text style={styles.quickPromptLabel}>{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
           </View>
        </View>

        <View style={isDesktop ? styles.rightColumn : styles.fullColumn}>
           <ScrollView contentContainerStyle={styles.resultScrollContent}>
              {results.length > 0 && (
                <View style={styles.resultsSection}>
                   <Text style={styles.resultsHeading}>Matches</Text>
                   <View style={styles.resultList}>{resultContent}</View>
                </View>
              )}
           </ScrollView>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  desktopLayout: {
    flexDirection: 'row',
    flex: 1,
  },
  mobileLayout: {
    flexDirection: 'column',
    flex: 1,
  },
  leftColumn: {
    flex: 1,
    maxWidth: 600,
    borderRightWidth: 1,
    borderRightColor: theme.colors.lightGrey,
    display: 'flex',
    flexDirection: 'column',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  fullColumn: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  resultScrollContent: {
    padding: theme.spacing.lg,
  },
  
  // Hero
  heroCard: {
    marginBottom: theme.spacing.xl,
  },
  heroEyebrow: {
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: theme.colors.coffee,
    marginBottom: theme.spacing.sm,
  },
  heroTitle: {
    fontSize: theme.fontSizes.txl,
    fontFamily: theme.fonts.heading,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.fonts.text,
    lineHeight: 24,
  },

  // Chat
  messageStack: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.lightGrey,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomRightRadius: 2,
    maxWidth: '85%',
  },
  messageBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.white, // clean card look
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: 2,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    ...theme.shadows.sm,
  },
  messageBadgeUser: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    marginBottom: 4,
    textAlign: 'right',
  },
  messageBadgeAI: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.teal, // AI accent
    marginBottom: 4,
  },
  messageHeadingUser: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
    fontFamily: theme.fonts.text,
  },
  messageHeadingAI: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.heading,
    color: theme.colors.black,
    marginBottom: theme.spacing.sm,
  },
  messageBody: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.charcoal,
    lineHeight: 24,
    fontFamily: theme.fonts.text,
  },

  // Input Area
  inputWrapper: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGrey,
    backgroundColor: theme.colors.offwhite,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    ...theme.shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.text,
    color: theme.colors.black,
    paddingVertical: 8,
    outlineStyle: 'none',
  },
  inputButton: {
    backgroundColor: theme.colors.black,
    padding: 10,
    borderRadius: theme.borderRadius.full,
    marginLeft: theme.spacing.sm,
  },
  inputButtonDisabled: {
    backgroundColor: theme.colors.grey,
  },
  promptScroll: {
    marginTop: theme.spacing.md,
    maxHeight: 40,
  },
  quickPromptChip: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
    marginRight: theme.spacing.sm,
  },
  quickPromptLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.secondary,
    fontFamily: theme.fonts.text,
  },

  // Results
  resultsSection: {
    marginBottom: theme.spacing.xxl,
  },
  resultsHeading: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.heading,
    marginBottom: theme.spacing.md,
    color: theme.colors.black,
  },
  resultList: {
    gap: theme.spacing.lg,
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.lightGrey,
  },
  resultCoverShadow: {
    ...theme.shadows.sm,
  },
  resultCover: {
    width: 80,
    height: 120,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.grey,
  },
  resultContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  resultTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.heading,
    color: theme.colors.black,
  },
  resultAuthor: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.secondary,
    fontFamily: theme.fonts.text,
    marginBottom: theme.spacing.sm,
  },
  resultReason: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.teal,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  resultSnippet: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.charcoal,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  resultButton: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  resultButtonAdd: {
    backgroundColor: theme.colors.black,
  },
  resultButtonAdded: {
    backgroundColor: theme.colors.lightGrey,
  },
  resultButtonLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  resultButtonLabelAdded: {
    color: theme.colors.black,
  },
});
