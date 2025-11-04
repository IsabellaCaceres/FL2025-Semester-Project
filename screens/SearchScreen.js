// screens/SearchScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import styles from "../styling/SearchScreen.styles";
import { theme } from "../styling/theme";
import { semanticSearch, fetchSemanticRecommendations } from "../lib/api";
import { useLibrary } from "../lib/library-context";

const QUICK_PROMPTS = [
  "I want a whimsical fantasy with found family",
  "Give me a sharp contemporary romance with banter",
  "Looking for a high-stakes sci-fi thriller",
  "Suggest a lyrical historical drama with mystery",
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

  const [inputValue, setInputValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState([]);
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
      try {
        const response = await semanticSearch(queryText, { limit: 6 });
        if (!response) {
          setResults([]);
          setReasoning("");
          setSearchError("I couldn’t find anything that fits. Try describing the characters or tone.");
          setLastQuery(queryText);
          return;
        }
        const mapped = mapResults(response.results ?? []);
        if (!mapped.length) {
          setResults([]);
          setReasoning("");
          setSearchError("I heard you, but I need a few more details to find the right match.");
          setLastQuery(queryText);
          return;
        }
        setResults(mapped);
        setReasoning(response.reasoning ?? "");
        setLastQuery(queryText);
        await refreshRecommendations();
        await loadSuggestions();
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

  const inputDisabled = isSearching || !inputValue.trim();

  const resultContent = useMemo(() => {
    if (!results.length) {
      return null;
    }

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
  }, [results, isInLibrary, handleToggleLibrary, pendingBookId]);

  const suggestionContent = useMemo(() => {
    if (isLoadingSuggestions && !suggestions.length) {
      return (
        <View style={styles.suggestionEmpty}>
          <ActivityIndicator size="small" color="rgba(32,29,25,0.5)" />
          <Text style={styles.suggestionEmptyLabel}>Finding picks for you…</Text>
        </View>
      );
    }

    if (!suggestions.length) {
      return null;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionRow}
      >
        {suggestions.map(({ book, reason }, index) => {
          const inLibrary = isInLibrary(book.id);
          return (
            <View key={`${book.id}-${index}`} style={styles.suggestionCard}>
              <Image
                source={book.coverSource ?? book.cover ?? undefined}
                style={styles.suggestionCover}
                resizeMode="cover"
              />
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionTitle}>{book.title}</Text>
                {book.author ? <Text style={styles.suggestionAuthor}>{book.author}</Text> : null}
                {reason ? <Text style={styles.suggestionReason}>{reason}</Text> : null}
              </View>
              <Pressable
                style={[
                  styles.suggestionButton,
                  inLibrary ? styles.suggestionButtonAdded : null,
                ]}
                onPress={() => handleToggleLibrary(book)}
                disabled={pendingBookId === book.id}
              >
                <Text
                  style={[
                    styles.suggestionButtonLabel,
                    inLibrary ? styles.suggestionButtonLabelAdded : null,
                  ]}
                >
                  {inLibrary ? "In Library" : "Add"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    );
  }, [suggestions, isLoadingSuggestions, isInLibrary, handleToggleLibrary, pendingBookId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Library Intelligence</Text>
          <Text style={styles.heroTitle}>Describe your next read.</Text>
          <Text style={styles.heroSubtitle}>
            Tell us about the characters, vibes, tropes—or anything you want—and we’ll surface
            books that match.
          </Text>
        </View>

        <View style={styles.messageStack}>
          {lastQuery ? (
            <View style={styles.messageBubble}>
              <Text style={styles.messageBadge}>You</Text>
              <Text style={styles.messageHeading}>{lastQuery}</Text>
            </View>
          ) : null}
          {reasoning ? (
            <View style={styles.messageBubble}>
              <Text style={styles.messageBadge}>AI</Text>
              <Text style={styles.messageHeading}>Why these picks work</Text>
              <Text style={styles.messageBody}>{reasoning}</Text>
            </View>
          ) : null}
          {searchError && !results.length ? (
            <View style={styles.messageBubble}>
              <Text style={styles.messageBadge}>AI</Text>
              <Text style={styles.messageHeading}>Let’s try again</Text>
              <Text style={styles.messageBody}>{searchError}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.quickPromptSection}>
          <Text style={styles.quickPromptTitle}>Try one of these prompts</Text>
          <View style={styles.quickPromptGrid}>
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
          </View>
        </View>

        {results.length ? (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeading}>Matches</Text>
            <View style={styles.resultList}>{resultContent}</View>
          </View>
        ) : null}

        <View style={styles.suggestionSection}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionTitleHeader}>Because you liked…</Text>
            <Pressable
              onPress={loadSuggestions}
              style={styles.suggestionRefresh}
              disabled={isLoadingSuggestions}
            >
              {isLoadingSuggestions ? (
                <ActivityIndicator size="small" color="rgba(32,29,25,0.6)" />
              ) : (
                <Feather name="refresh-ccw" size={18} color="rgba(32,29,25,0.6)" />
              )}
            </Pressable>
          </View>
          {suggestionContent}
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Describe what you want to read next"
          placeholderTextColor="rgba(32,29,25,0.4)"
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
            <ActivityIndicator size="small" color="rgba(32,29,25,0.7)" />
          ) : (
            <Feather name="arrow-up-right" size={20} color="rgba(32,29,25,0.7)" />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
