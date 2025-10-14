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
  const [statusMessage, setStatusMessage] = useState(DEFAULT_AUTH_STATUS);
  const [submittingAction, setSubmittingAction] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [resetCurrentPassword, setResetCurrentPassword] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

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

  const normalizeUsernameInput = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setStatusMessage("Enter a username first.");
      return null;
    }
    const normalized = trimmed.toLowerCase().replace(/\s+/g, "");
    if (!/^[a-z0-9._-]+$/.test(normalized)) {
      setStatusMessage("Use letters, numbers, dots, underscores, or dashes in your username.");
      return null;
    }
    if (normalized !== username) setUsername(normalized);
    return normalized;
  };

  const handleSignIn = async () => {
    if (submittingAction) return;
    const normalized = normalizeUsernameInput();
    if (!normalized) return;
    if (!password) {
      setStatusMessage("Enter your password to sign in.");
      return;
    }
    const emailForAuth = buildAuthEmail(normalized);
    setSubmittingAction("signIn");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password,
      });
      if (error) {
        const lower = (error.message || "").toLowerCase();
        if (lower.includes("invalid login credentials")) {
          setStatusMessage("Incorrect username or password. Try again or use Sign Up.");
        } else {
          setStatusMessage(error.message || "Sign in error.");
        }
        return;
      }
      setStatusMessage(`Welcome back, ${normalized}!`);
      if (data?.user?.user_metadata?.username !== normalized) {
        await supabase.auth.updateUser({ data: { username: normalized } });
      }
      setPassword("");
    } catch (error) {
      console.error("Sign in error:", error);
      setStatusMessage("Unable to sign in. Is Supabase running?");
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleSignUp = async () => {
    if (submittingAction) return;
    const normalized = normalizeUsernameInput();
    if (!normalized) return;
    if (!password) {
      setStatusMessage("Choose a password to create your account.");
      return;
    }
    if (password.length < 6) {
      setStatusMessage("Password must be at least 6 characters long.");
      return;
    }
    const emailForAuth = buildAuthEmail(normalized);
    setSubmittingAction("signUp");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailForAuth,
        password,
        options: { data: { username: normalized } },
      });
      if (error) {
        const lower = (error.message || "").toLowerCase();
        if (error.code === "user_already_exists" || lower.includes("already") || lower.includes("exists")) {
          setStatusMessage("That username is already taken. Use Sign In instead.");
        } else {
          setStatusMessage(error.message || "Sign up error.");
        }
        return;
      }
      let session = data.session;
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });
        if (signInError) {
          setStatusMessage("Account created, but automatic sign-in failed. Try signing in now.");
          return;
        }
        session = signInData.session;
      }
      if (session?.user?.user_metadata?.username !== normalized) {
        await supabase.auth.updateUser({ data: { username: normalized } });
      }
      setStatusMessage(`Account created. You're signed in as ${normalized}.`);
      setPassword("");
    } catch (error) {
      console.error("Sign up error:", error);
      setStatusMessage("Unable to sign up. Is Supabase running?");
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleResetPassword = async () => {
    if (submittingAction) return;
    const normalized = normalizeUsernameInput();
    if (!normalized) return;
    if (!resetCurrentPassword) {
      setStatusMessage("Enter your current password first.");
      return;
    }
    if (!resetNewPassword) {
      setStatusMessage("Enter a new password.");
      return;
    }
    if (resetNewPassword.length < 6) {
      setStatusMessage("New password must be at least 6 characters long.");
      return;
    }
    if (resetNewPassword === resetCurrentPassword) {
      setStatusMessage("New password must be different from the current password.");
      return;
    }
    const emailForAuth = buildAuthEmail(normalized);
    setSubmittingAction("reset");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password: resetCurrentPassword,
      });
      if (signInError) {
        const lower = (signInError.message || "").toLowerCase();
        setStatusMessage(
          lower.includes("invalid") || lower.includes("password")
            ? "Current password is incorrect."
            : signInError.message || "Unable to verify current password."
        );
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password: resetNewPassword,
      });
      if (updateError) {
        setStatusMessage(updateError.message || "Could not update password.");
        return;
      }
      setStatusMessage("Password updated. Use your new password next time you sign in.");
      setResetCurrentPassword("");
      setResetNewPassword("");
      setShowReset(false);
      setPassword("");
    } catch (error) {
      console.error("Reset password error:", error);
      setStatusMessage("Unable to reset password right now.");
    } finally {
      setSubmittingAction(null);
    }
  };

  const toggleReset = () => {
    const next = !showReset;
    setShowReset(next);
    setStatusMessage(
      next
        ? "Enter your username, current password, and a new password."
        : DEFAULT_AUTH_STATUS
    );
    if (!next) {
      setResetCurrentPassword("");
      setResetNewPassword("");
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Sign out error", error.message);
    else {
      setUser(null);
      setUsername("");
      setPassword("");
      setShowReset(false);
      setResetCurrentPassword("");
      setResetNewPassword("");
      setSubmittingAction(null);
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
          <View style={styles.authActionRow}>
            <Pressable
              style={[
                styles.button,
                styles.authActionButton,
                submittingAction && styles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={!!submittingAction}
            >
              {submittingAction === "signIn" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonLabel}>Sign In</Text>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.authActionButton,
                submittingAction && styles.buttonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={!!submittingAction}
            >
              {submittingAction === "signUp" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonLabel}>Sign Up</Text>
              )}
            </Pressable>
          </View>
          <Pressable style={styles.linkButton} onPress={toggleReset}>
            <Text style={styles.linkButtonLabel}>
              {showReset ? "Cancel password reset" : "Reset password"}
            </Text>
          </Pressable>
          {showReset ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Current password"
                secureTextEntry
                value={resetCurrentPassword}
                onChangeText={(value) => {
                  setResetCurrentPassword(value);
                  setStatusMessage("Enter your username, current password, and a new password.");
                }}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="New password"
                secureTextEntry
                value={resetNewPassword}
                onChangeText={(value) => {
                  setResetNewPassword(value);
                  setStatusMessage("Enter your username, current password, and a new password.");
                }}
                placeholderTextColor="#999"
              />
              <Pressable
                style={[
                  styles.button,
                  submittingAction && styles.buttonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={!!submittingAction}
              >
                {submittingAction === "reset" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonLabel}>Update Password</Text>
                )}
              </Pressable>
            </>
          ) : null}
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
