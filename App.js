// app.js
import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import styles from "./styling/global-styles";
import { theme } from "./styling/theme";
import { LibraryProvider } from "./lib/library-context";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import GroupChatScreen from "./screens/GroupChatScreen";

import SignInScreen from "./screens/SignInScreen";
//Icons
import { Ionicons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

//Fonts
import { useFonts as useBuenard, Buenard_400Regular, Buenard_700Bold } from "@expo-google-fonts/buenard";
import { useFonts as useRokkitt, Rokkitt_400Regular, Rokkitt_700Bold } from "@expo-google-fonts/rokkitt";
import { useFonts } from 'expo-font';


const Tab = createBottomTabNavigator();

const Stack = createNativeStackNavigator();

const AUTH_STAGES = {
  SIGN_IN: "signIn",
  SIGN_UP: "signUp",
  FORGOT_PASSWORD: "forgotPassword",
};

function GroupStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GroupsHome"
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={({ route }) => ({ title: route.params?.group?.name ?? "Group Chat" })}
      />
    </Stack.Navigator>
  );
}

function TopTabBar({ state, descriptors, navigation, profileInitial }) {
  const insets = useSafeAreaInsets();
  const primaryRoutes = state.routes.filter((route) => route.name !== "Account");
  const accountRoute = state.routes.find((route) => route.name === "Account");

  const getIcon = (routeName, isFocused) => {
    const palette = isFocused
      ? styles.navigation.topBarIconActive.color
      : styles.navigation.topBarIconInactive.color;
    const size = 20;

    switch (routeName) {
      case "Home":
        return <Ionicons name={isFocused ? "newspaper" : "newspaper-outline"} size={size} color={palette} />;
      case "Library":
        return <Ionicons name={isFocused ? "library" : "library-outline"} size={size} color={palette} />;
      case "Search":
        return <Feather name="search" size={size - 2} color={palette} />;
      case "My Groups":
        return <MaterialIcons name="groups" size={size + 1} color={palette} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={[
        styles.navigation.topBarContainer,
        { paddingTop: insets.top + theme.spacing.md },
      ]}
    >
      <View style={styles.navigation.topBarShell}>
        <View style={styles.navigation.topBarSegment}>
          {primaryRoutes.map((route, index) => {
            const { options } = descriptors[route.key];
            const rawLabel =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;
            const displayLabel = route.name === "My Groups" ? "Groups" : rawLabel;

            const isFocused = state.index === state.routes.indexOf(route);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.navigation.topBarItem,
                  isFocused ? styles.navigation.topBarItemActive : null,
                ]}
              >
                {getIcon(route.name, isFocused)}
                <Text
                  style={[
                    styles.navigation.topBarLabel,
                    isFocused && styles.navigation.topBarLabelActive,
                  ]}
                >
                  {displayLabel}
                </Text>
              </Pressable>
            );
          })}

          {accountRoute ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open account"
              onPress={() => navigation.navigate(accountRoute.name)}
              onLongPress={() =>
                navigation.emit({
                  type: "tabLongPress",
                  target: accountRoute.key,
                })
              }
              style={styles.navigation.topBarProfileButton}
            >
              <View style={styles.navigation.topBarProfile}>
                <Text style={styles.navigation.topBarProfileInitial}>
                  {(profileInitial ?? "A").slice(0, 1).toUpperCase()}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}


const DEFAULT_AUTH_STATUS =
  "Enter a username and password to sign in or create an account.";

export default function App() {
  // const [fontsLoaded] = useBuenard({
  //   Buenard_400Regular,
  //   Buenard_700Bold,
  // });

  // const [rokkittLoaded] = useRokkitt({
  //   Rokkitt_400Regular,
  //   Rokkitt_700Bold,
  // });

  // const [bebasLoaded] = useBebas({
  //   BebasNeue_400Regular,
  // });

  // if (!fontsLoaded || !rokkittLoaded || !bebasLoaded) {
  //   return null;
  // }
  const [fontsLoaded] = useFonts({
    BebasNeue: require("./assets/fonts/BebasNeue-Regular.ttf"),
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetCurrentPassword, setResetCurrentPassword] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(DEFAULT_AUTH_STATUS);
  const [submittingAction, setSubmittingAction] = useState(null);
  const [authStage, setAuthStage] = useState(AUTH_STAGES.SIGN_IN);

  const displayName =
    user?.user_metadata?.username ?? user?.email ?? user?.user_metadata?.full_name ?? null;

  const displayStatusMessage =
    statusMessage === DEFAULT_AUTH_STATUS ? "" : statusMessage;

  useEffect(() => {
    const loadUser = async () => {
      const current = await fetchCurrentUser();
      setUser(current);
      setLoading(false);
    };
    loadUser();
  }, []);

  const transitionToStage = (nextStage) => {
    if (!nextStage || !Object.values(AUTH_STAGES).includes(nextStage)) return;
    setAuthStage(nextStage);
    setStatusMessage(DEFAULT_AUTH_STATUS);
    setSubmittingAction(null);
    if (nextStage !== AUTH_STAGES.FORGOT_PASSWORD) {
      setResetCurrentPassword("");
      setResetNewPassword("");
    }
  };

  const normalizeUsernameInput = (value, { updateState = true } = {}) => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) {
      setStatusMessage("Enter a username first.");
      return null;
    }
    const normalized = trimmed.toLowerCase().replace(/\s+/g, "");
    if (!/^[a-z0-9._-]+$/.test(normalized)) {
      setStatusMessage("Use letters, numbers, dots, underscores, or dashes in your username.");
      return null;
    }
    if (updateState && normalized !== value) setUsername(normalized);
    return normalized;
  };

  const handleSignIn = async () => {
    if (submittingAction) return;
    const normalized = normalizeUsernameInput(username);
    if (!normalized) return;
    if (!password) {
      setStatusMessage("Enter your password to sign in.");
      return;
    }
    setSubmittingAction("signIn");
    try {
      const userResponse = await apiSignIn(normalized, password);
      if (!userResponse) {
        setStatusMessage("Incorrect username or password. Try again or reset your password.");
        setAuthStage(AUTH_STAGES.FORGOT_PASSWORD);
        setResetCurrentPassword("");
        setResetNewPassword("");
        return;
      }
      setUser(userResponse);
      setStatusMessage(`Welcome back, ${normalized}!`);
      setPassword("");
      setResetCurrentPassword("");
      setResetNewPassword("");
      setAuthStage(AUTH_STAGES.SIGN_IN);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleSignUp = async () => {
    if (submittingAction) return;
    const normalized = normalizeUsernameInput(username);
    if (!normalized) return;
    if (!password) {
      setStatusMessage("Choose a password to create your account.");
      return;
    }
    if (password.length < 6) {
      setStatusMessage("Password must be over six characters.");
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
      setUsername(normalized);
      setPassword("");
      setStatusMessage(`Welcome aboard, ${normalized}!`);
      setResetCurrentPassword("");
      setResetNewPassword("");
      setAuthStage(AUTH_STAGES.SIGN_IN);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleResetPassword = async () => {
    if (submittingAction) return;
    const normalized = normalizeUsernameInput(username);
    if (!normalized) return;
    if (!resetCurrentPassword) {
      setStatusMessage("Enter your current password to reset it.");
      return;
    }
    if (!resetNewPassword) {
      setStatusMessage("Choose a new password to finish resetting.");
      return;
    }
    if (resetNewPassword.length < 6) {
      setStatusMessage("Password must be over six characters.");
      return;
    }
    setSubmittingAction("resetPassword");
    try {
      const result = await apiResetPassword(normalized, resetCurrentPassword, resetNewPassword);
      if (!result) {
        setStatusMessage("Unable to reset your password. Double-check your credentials.");
        return;
      }
      setStatusMessage("Password updated. Sign in with your new password.");
      setResetCurrentPassword("");
      setResetNewPassword("");
      setPassword("");
      setAuthStage(AUTH_STAGES.SIGN_IN);
    } finally {
      setSubmittingAction(null);
    }
  };

  const signOut = async () => {
    await apiSignOut();
    setUser(null);
    setUsername("");
    setPassword("");
    setResetCurrentPassword("");
    setResetNewPassword("");
    setSubmittingAction(null);
    setStatusMessage(DEFAULT_AUTH_STATUS);
    setAuthStage(AUTH_STAGES.SIGN_IN);
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: "white" }} />;
  }

  if (!user) {
    return (
      <SignInScreen
        stage={authStage}
        username={username}
        password={password}
        resetCurrentPassword={resetCurrentPassword}
        resetNewPassword={resetNewPassword}
        onUsernameChange={(value) => {
          setUsername(value);
          setStatusMessage(DEFAULT_AUTH_STATUS);
        }}
        onPasswordChange={(value) => {
          setPassword(value);
          setStatusMessage(DEFAULT_AUTH_STATUS);
        }}
        onResetCurrentPasswordChange={(value) => {
          setResetCurrentPassword(value);
          setStatusMessage(DEFAULT_AUTH_STATUS);
        }}
        onResetNewPasswordChange={(value) => {
          setResetNewPassword(value);
          setStatusMessage(DEFAULT_AUTH_STATUS);
        }}
        onSubmitSignIn={handleSignIn}
        onSubmitSignUp={handleSignUp}
        onSubmitResetPassword={handleResetPassword}
        submittingAction={submittingAction}
        statusMessage={displayStatusMessage}
        onStageChange={transitionToStage}
      />
    );
  }

  return (
    <LibraryProvider user={user}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { height: 0 },
          }}
          sceneContainerStyle={{
            paddingTop: 76,
            backgroundColor: theme.colors.offwhite,
          }}
          tabBar={(props) => (
            <TopTabBar
              {...props}
              profileInitial={displayName ? displayName.charAt(0) : "A"}
            />
          )}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Library" component={LibraryScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="My Groups" component={GroupStack} />
          <Tab.Screen name="Account">
            {() => (
              <View style={styles.center}>
                <Text style={styles.subtitle}>Signed in as</Text>
                <Text style={styles.hero}>{displayName}</Text>
                <Pressable style={styles.button} onPress={signOut}>
                  <Text style={styles.buttonLabel}>Sign out</Text>
                </Pressable>
              </View>
            )}
          </Tab.Screen>
        </Tab.Navigator>

        <StatusBar style="dark" />
      </NavigationContainer>
    </LibraryProvider>
  );
}
