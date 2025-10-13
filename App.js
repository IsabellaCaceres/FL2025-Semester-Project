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

// Screens
import HomeScreen from "./screens/HomeScreen";
import LibraryScreen from "./screens/LibraryScreen";
import GroupsScreen from "./screens/GroupsScreen";
import SearchScreen from "./screens/SearchScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("getUser error:", error.message);
      }
      setUserEmail(data?.user?.email ?? null);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      try {
        sub?.subscription?.unsubscribe();
      } catch (_e) {
        // ignore cleanup errors
      }
    };
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

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

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
