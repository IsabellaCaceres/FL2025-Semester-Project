// app.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import styles from "./styling/global-styles";
import { supabase } from "./lib/supabase";
import { LibraryProvider } from "./lib/library-context";

// Screens
import HomeScreen from "./screens/HomeScreen";
import LibraryScreen from "./screens/LibraryScreen";
import GroupsScreen from "./screens/GroupsScreen";
import SearchScreen from "./screens/SearchScreen";

const Tab = createBottomTabNavigator();
const DEFAULT_AUTH_STATUS =
  "Enter a username and password to sign in or create an account.";

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(DEFAULT_AUTH_STATUS);

  const displayName =
    user?.user_metadata?.username ?? user?.email ?? user?.user_metadata?.full_name ?? null;

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("getUser error:", error.message);
        const message = error.message?.toLowerCase() ?? "";
        if (error.status === 403 || message.includes("sub claim")) {
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.warn("signOut after getUser error failed:", signOutError.message);
          }
        }
      }
      setUser(error ? null : data?.user ?? null);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      try {
        sub?.subscription?.unsubscribe();
      } catch (_e) {
        // ignore cleanup errors
      }
    };
  }, []);

  const buildAuthEmail = (rawUsername) =>
    `${rawUsername.toLowerCase()}@local.goodreads-demo`;

  const handleSubmit = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setStatusMessage("Enter both username and password.");
      return;
    }
    const normalizedUsername = trimmedUsername.toLowerCase().replace(/\s+/g, "");
    setUsername(normalizedUsername);
    if (!/^[a-z0-9._-]+$/.test(normalizedUsername)) {
      setStatusMessage("Use letters, numbers, dots, underscores, or dashes in your username.");
      return;
    }
    if (password.length < 6) {
      setStatusMessage("Password must be at least 6 characters long.");
      return;
    }
    setSubmitting(true);
    setStatusMessage("");

    const emailForAuth = buildAuthEmail(normalizedUsername);

    try {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });

      if (!signInError) {
        setStatusMessage(`Welcome back, ${normalizedUsername}!`);
        if (signInData?.user?.user_metadata?.username !== normalizedUsername) {
          await supabase.auth.updateUser({
            data: { username: normalizedUsername },
          });
        }
        return;
      }

      const lowerMessage = (signInError.message || "").toLowerCase();

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailForAuth,
        password,
        options: { data: { username: normalizedUsername } },
      });

      if (signUpError) {
        if (
          signUpError.code === "user_already_exists" ||
          lowerMessage.includes("invalid login credentials") ||
          lowerMessage.includes("password")
        ) {
          setStatusMessage("That username exists, but the password is incorrect.");
          return;
        }
        setStatusMessage(signUpError.message || "Sign up error.");
        return;
      }

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });
        if (signInError) {
          setStatusMessage(signInError.message || "Sign in error.");
          return;
        }
      }
      setStatusMessage(`Account created. Welcome, ${normalizedUsername}!`);
    } catch (error) {
      console.error("Auth error:", error);
      setStatusMessage(
        "We could not reach Supabase. Make sure the local stack is running and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out error", error.message);
    else {
      setUser(null);
      setUsername("");
      setPassword("");
      setStatusMessage(DEFAULT_AUTH_STATUS);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Welcome</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setStatusMessage(DEFAULT_AUTH_STATUS);
            }}
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setStatusMessage(DEFAULT_AUTH_STATUS);
            }}
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
              <Text style={styles.buttonLabel}>Sign In / Sign Up</Text>
            )}
          </Pressable>
          {statusMessage ? (
            <Text style={styles.formStatus}>{statusMessage}</Text>
          ) : null}
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <LibraryProvider user={user}>
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
                <Text style={styles.subtitle}>{displayName}</Text>
                <Pressable style={styles.button} onPress={signOut}>
                  <Text style={styles.buttonLabel}>Sign out</Text>
                </Pressable>
              </View>
            )}
          </Tab.Screen>
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </LibraryProvider>
  );
}
