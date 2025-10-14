// app.js
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import styles from "./styling/global-styles";
import { theme } from "./styling/theme";
import { LibraryProvider } from "./lib/library-context";
import {
  fetchCurrentUser,
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  resetPassword as apiResetPassword,
} from "./lib/api";

// Screens
import HomeScreen from "./screens/HomeScreen";
import LibraryScreen from "./screens/LibraryScreen";
import GroupsScreen from "./screens/GroupsScreen";
import SearchScreen from "./screens/SearchScreen";

//Icons
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

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
    const loadUser = async () => {
      const current = await fetchCurrentUser();
      setUser(current);
      setLoading(false);
    };
    loadUser();
  }, []);

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
    setSubmittingAction("signIn");
    try {
      const userResponse = await apiSignIn(normalized, password);
      if (!userResponse) {
        setStatusMessage("Incorrect username or password. Try again or use Sign Up.");
        return;
      }
      setUser(userResponse);
      setStatusMessage(`Welcome back, ${normalized}!`);
      setPassword("");
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
    setSubmittingAction("signUp");
    try {
      const userResponse = await apiSignUp(normalized, password);
      if (!userResponse) {
        setStatusMessage("Unable to create your account right now. Try again soon.");
        return;
      }
      setUser(userResponse);
      setStatusMessage(`Account created. You're signed in as ${normalized}.`);
      setPassword("");
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
    setSubmittingAction("reset");
    try {
      await apiResetPassword(normalized, resetCurrentPassword, resetNewPassword);
      setStatusMessage("Password updated. Use your new password next time you sign in.");
      setResetCurrentPassword("");
      setResetNewPassword("");
      setShowReset(false);
      setPassword("");
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
    await apiSignOut();
    setUser(null);
    setUsername("");
    setPassword("");
    setShowReset(false);
    setResetCurrentPassword("");
    setResetNewPassword("");
    setSubmittingAction(null);
    setStatusMessage(DEFAULT_AUTH_STATUS);
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
        <Tab.Navigator
          screenOptions={({ route }) => ({
            //Header Styling
            headerStyle: {
              backgroundColor: theme.colors.teal,
            },
            headerTitleStyle: {
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.offwhite,
            },
            headerTintColor: theme.colors.offwhite,
            headerTitleAlign: "center",

            // Tab Styling
            tabBarStyle: styles.navigation.tabBar,
            tabBarLabelStyle: styles.navigation.tabBarLabel,
            tabBarActiveTintColor: styles.navigation.tabBarLabelActive.color,
            tabBarInactiveTintColor: styles.navigation.tabBarLabelInactive.color,
            tabBarIcon: ({ focused, color, size }) => {
              let IconComponent;
              let iconName;

              switch (route.name) {
                case "Home":
                  IconComponent = Ionicons;
                  iconName = "home";
                  break;
                case "Library":
                  IconComponent = FontAwesome;
                  iconName = "book";
                  break;
                case "Search":
                  IconComponent = Feather;
                  iconName = "search";
                  break;
                case "My Groups":
                  IconComponent = MaterialIcons;
                  iconName = "chat";
                  break;
                case "Account":
                  IconComponent = FontAwesome;
                  iconName = "user";
                  break;
                default:
                  return null;
              }

              return (
                <View style={styles.navigation.tabBarIconContainer}>
                  <IconComponent
                    name={iconName}
                    size={size}
                    color={focused ? styles.navigation.tabBarIconActive.tintColor : styles.navigation.tabBarIconInactive.tintColor}
                  />
                </View>
              );
            },
          })}
        >
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
