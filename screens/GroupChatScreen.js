import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { theme } from "../styling/theme";
import styles from "../styling/GroupChatScreen.styles";
import { fetchGroupMessages, sendMessage, fetchCurrentUser, followUser, fetchProfile } from "../lib/api";
import { Feather } from "@expo/vector-icons";

export default function GroupChatScreen({ route }) {
  const { groupId, title } = route.params ?? {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [followingUser, setFollowingUser] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const navigation = useNavigation();

  // Load current user ID for bubble alignment
  useEffect(() => {
    fetchCurrentUser().then(u => {
      if (u) setCurrentUserId(u.id);
    });
  }, []);

  // Initial load + polling
  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchGroupMessages(groupId);
      setMessages(data);
    } catch (error) {
      console.warn("Failed to load messages", error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerTitle: title ?? "Group Chat" });
      loadMessages();
      
      // Poll every 5 seconds
      pollRef.current = setInterval(loadMessages, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [loadMessages, title, navigation])
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    
    setInput(""); 
    try {
      const newMsg = await sendMessage(groupId, text);
      if (newMsg) {
        const localMsg = {
            ...newMsg,
            profiles: { username: "You" } 
        };
        setMessages(prev => [...prev, localMsg]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error("Failed to send", error);
      setInput(text); 
    }
  };

  const handleUserPress = (userId, username) => {
    if (userId === currentUserId) return;
    setSelectedUser({ id: userId, username });
    setShowUserModal(true);
  };

  const handleFollow = async () => {
    if (!selectedUser) return;
    setFollowingUser(true);
    try {
      await followUser(selectedUser.id);
      Alert.alert("Success", `You are now following @${selectedUser.username}`);
      setShowUserModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to follow user");
    } finally {
      setFollowingUser(false);
    }
  };

  if (loading && !messages.length) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.colors.black} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.user_id === currentUserId;
            const username = item.profiles?.username || "Unknown";
            return (
              <View style={[styles.messageWrapper, { alignItems: isMe ? "flex-end" : "flex-start" }]}>
                <View
                    style={[
                    styles.messageBubble,
                    isMe ? styles.messageFromMe : styles.messageFromOther,
                    ]}
                >
                    {!isMe && (
                        <Pressable onPress={() => handleUserPress(item.user_id, username)}>
                          <Text
                            style={[
                                styles.username,
                                styles.usernameFromOther,
                                { textDecorationLine: 'underline' }
                            ]}
                          >
                            @{username}
                          </Text>
                        </Pressable>
                    )}
                    <Text style={isMe ? styles.messageTextFromMe : styles.messageTextFromOther}>
                        {item.content}
                    </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={theme.colors.grey}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={(e) => {
              if (!e.nativeEvent.shiftKey) handleSend();
            }}
          />
          <Pressable onPress={handleSend} style={styles.sendButton} disabled={!input.trim()}>
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserModal(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowUserModal(false)}
        >
          <View style={{ backgroundColor: theme.colors.white, borderRadius: 16, padding: 24, width: 280, alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.teal, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: theme.colors.white, fontSize: 24, fontWeight: 'bold' }}>
                {selectedUser?.username?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontFamily: theme.fonts.heading, marginBottom: 4 }}>
              @{selectedUser?.username}
            </Text>
            <Pressable
              style={{ marginTop: 16, backgroundColor: theme.colors.black, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }}
              onPress={handleFollow}
              disabled={followingUser}
            >
              <Text style={{ color: theme.colors.white, fontFamily: theme.fonts.text, fontWeight: '600' }}>
                {followingUser ? 'Following...' : 'Follow'}
              </Text>
            </Pressable>
            <Pressable
              style={{ marginTop: 12 }}
              onPress={() => setShowUserModal(false)}
            >
              <Text style={{ color: theme.colors.grey, fontFamily: theme.fonts.text }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
