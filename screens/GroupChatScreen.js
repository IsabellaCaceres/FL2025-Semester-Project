// screens/GroupChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import { View, Text, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, paddingVertical: 6, alignItems: item.fromMe ? "flex-end" : "flex-start" }}>
              <View style={{ maxWidth: "80%", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: item.fromMe ? "#111" : "#eee" }}>
                <Text style={{ fontWeight: "600", fontSize: 12, marginBottom: 2, color: item.fromMe ? "#ddd" : "#333" }}>
                  {item.username}
                </Text>
                <Text style={{ color: item.fromMe ? "#fff" : "#000" }}>{item.text}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderColor: "#ddd" }}>
          <TextInput
            ref={inputRef}
            autoFocus
            style={{ flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 }}
            placeholder="Message…"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Pressable onPress={send} style={{ backgroundColor: "#111", borderRadius: 20, paddingHorizontal: 16, justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
