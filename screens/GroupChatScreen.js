import React, { useState, useRef, useEffect } from "react";
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "../styling/GroupChatScreen.styles";

export default function GroupChatScreen({ route }) {
  const username = "You";
  const { group } = route.params ?? {};
  const [messages, setMessages] = useState([
    { id: "1", text: `Welcome to ${group?.name ?? "the group"}!`, fromMe: false, ts: Date.now(), username: "System" },
  ]);

  const [input, setInput] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      { id: String(Date.now()), text: t, fromMe: true, ts: Date.now(), username },
    ]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={[styles.messageWrapper, { alignItems: item.fromMe ? "flex-end" : "flex-start" }]}>
              <View
                style={[
                  styles.messageBubble,
                  item.fromMe ? styles.messageFromMe : styles.messageFromOther,
                ]}
              >
                <Text
                  style={[
                    styles.username,
                    item.fromMe ? styles.usernameFromMe : styles.usernameFromOther,
                  ]}
                >
                  {item.username}
                </Text>
                <Text style={item.fromMe ? styles.messageTextFromMe : styles.messageTextFromOther}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            autoFocus
            style={styles.input}
            placeholder="Message…"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Pressable onPress={send} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
