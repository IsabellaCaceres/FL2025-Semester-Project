import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BlurView } from "expo-blur";
import CoverCarousel from "../components/CoverCarousel";
import { theme } from "../styling/theme";

const STAGES = {
  SIGN_IN: "signIn",
  SIGN_UP: "signUp",
  FORGOT_PASSWORD: "forgotPassword",
};

const CARD_BACKGROUND = "rgba(247, 238, 226, 0.9)";
const FIELD_BACKGROUND = "rgba(255, 255, 255, 0.88)";
const TEXT_PRIMARY = theme.colors.black;
const TEXT_MUTED = "rgba(32, 29, 25, 0.65)";
const PLACEHOLDER = "rgba(32, 29, 25, 0.45)";
const APPLE_BLUE = "#007AFF";
const BACKGROUND_COLOR = "#0f172a";
const FONT_SYSTEM = theme.fonts.text;

const STAGE_COPY = {
  [STAGES.SIGN_IN]: {
    title: "Welcome back",
    subtitle: "Sign in to continue exploring your library.",
    actionLabel: "Sign in",
    submittingKey: "signIn",
  },
  [STAGES.SIGN_UP]: {
    title: "Create an account",
    subtitle: "Pick a username and password to join the community.",
    actionLabel: "Create account",
    submittingKey: "signUp",
  },
  [STAGES.FORGOT_PASSWORD]: {
    title: "Reset your password",
    subtitle: "Confirm your current password and choose a new one.",
    actionLabel: "Reset password",
    submittingKey: "resetPassword",
  },
};

export default function SignInScreen({
  stage = STAGES.SIGN_IN,
  username,
  password,
  resetCurrentPassword,
  resetNewPassword,
  onUsernameChange,
  onPasswordChange,
  onResetCurrentPasswordChange,
  onResetNewPasswordChange,
  onSubmitSignIn,
  onSubmitSignUp,
  onSubmitResetPassword,
  submittingAction,
  statusMessage,
  onStageChange,
}) {
  const supportedStages = Object.values(STAGES);
  const activeStage = supportedStages.includes(stage) ? stage : STAGES.SIGN_IN;
  const copy = STAGE_COPY[activeStage] ?? STAGE_COPY[STAGES.SIGN_IN];
  const busyKey = copy.submittingKey;
  const isBusy = submittingAction === busyKey;

  const handlePrimaryPress = () => {
    switch (activeStage) {
      case STAGES.SIGN_IN:
        onSubmitSignIn?.();
        break;
      case STAGES.SIGN_UP:
        onSubmitSignUp?.();
        break;
      case STAGES.FORGOT_PASSWORD:
        onSubmitResetPassword?.();
        break;
      default:
        onSubmitSignIn?.();
    }
  };

  const handleStageChange = (nextStage) => {
    if (!onStageChange || nextStage === activeStage) return;
    onStageChange(nextStage);
  };

  const fields = [
    {
      key: "username",
      label: "Username",
      value: username,
      onChangeText: onUsernameChange,
      textContentType: "username",
      autoCapitalize: "none",
      secure: false,
      returnKeyType: "next",
    },
  ];

  if (activeStage === STAGES.SIGN_IN) {
    fields.push({
      key: "password",
      label: "Password",
      value: password,
      onChangeText: onPasswordChange,
      textContentType: "password",
      secure: true,
      returnKeyType: "go",
      onSubmitEditing: handlePrimaryPress,
    });
  } else if (activeStage === STAGES.SIGN_UP) {
    fields.push({
      key: "create-password",
      label: "Create password",
      value: password,
      onChangeText: onPasswordChange,
      textContentType: "newPassword",
      secure: true,
      returnKeyType: "go",
      onSubmitEditing: handlePrimaryPress,
    });
  } else if (activeStage === STAGES.FORGOT_PASSWORD) {
    fields.push(
      {
        key: "current-password",
        label: "Current password",
        value: resetCurrentPassword,
        onChangeText: onResetCurrentPasswordChange,
        textContentType: "password",
        secure: true,
        returnKeyType: "next",
      },
      {
        key: "new-password",
        label: "New password",
        value: resetNewPassword,
        onChangeText: onResetNewPasswordChange,
        textContentType: "newPassword",
        secure: true,
        returnKeyType: "go",
        onSubmitEditing: handlePrimaryPress,
      }
    );
  }

  const lowerStatus = statusMessage?.toLowerCase?.() ?? "";
  const isPositiveStatus = lowerStatus.includes("welcome") || lowerStatus.includes("updated");
  const statusToneStyle = isPositiveStatus ? styles.statusPositive : styles.statusNegative;

  const renderLinks = () => {
    if (activeStage === STAGES.SIGN_IN) {
      return (
        <View style={styles.linkRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleStageChange(STAGES.SIGN_UP)}
            style={styles.linkPressable}
          >
            <Text style={styles.linkPrimary}>Create an account</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleStageChange(STAGES.FORGOT_PASSWORD)}
            style={styles.linkPressable}
          >
            <Text style={styles.linkSecondary}>Forgot password?</Text>
          </Pressable>
        </View>
      );
    }

    if (activeStage === STAGES.SIGN_UP) {
      return (
        <View style={styles.linkColumn}>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleStageChange(STAGES.SIGN_IN)}
            style={styles.linkPressable}
          >
            <Text style={styles.linkComposite}>
              <Text style={styles.linkPrimaryBlack}>Already have an account? </Text>
              <Text style={styles.linkPrimary}>{"Sign in"}</Text>
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.linkColumn}>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleStageChange(STAGES.SIGN_IN)}
          style={styles.linkPressable}
        >
          <Text style={styles.linkPrimaryBlack}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CoverCarousel rows={5} cardsPerRow={12} />
      <View style={styles.overlay}>
        <View style={styles.heroCardWrapper}>
          <View style={styles.cardShadow}>
            <BlurView intensity={60} tint="light" style={styles.heroCard}>
              <View style={styles.heroCardInner}>
                <View style={styles.header}>
                  <Text style={styles.title}>{copy.title}</Text>
                  <Text style={styles.subtitle}>{copy.subtitle}</Text>
                </View>
                <View style={styles.fieldColumn}>
                  {fields.map((field) => (
                    <View key={field.key} style={styles.fieldShell}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <TextInput
                        style={styles.input}
                        value={field.value ?? ""}
                        onChangeText={field.onChangeText ?? (() => {})}
                        placeholder={field.label}
                        placeholderTextColor={PLACEHOLDER}
                        autoCapitalize={field.autoCapitalize ?? "none"}
                        autoCorrect={false}
                        secureTextEntry={!!field.secure}
                        textContentType={field.textContentType}
                        returnKeyType={field.returnKeyType}
                        onSubmitEditing={field.onSubmitEditing}
                      />
                    </View>
                  ))}
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.primaryButton, isBusy && styles.primaryButtonDisabled]}
                  onPress={handlePrimaryPress}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <ActivityIndicator color={theme.colors.offwhite} />
                  ) : (
                    <Text style={styles.primaryButtonLabel}>{copy.actionLabel}</Text>
                  )}
                </Pressable>
                {statusMessage ? (
                  <Text style={[styles.status, statusToneStyle]}>{statusMessage}</Text>
                ) : null}
                {renderLinks()}
              </View>
            </BlurView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroCardWrapper: {
    width: "100%",
    alignItems: "center",
  },
  cardShadow: {
    width: "100%",
    maxWidth: 420,
    shadowColor: "rgba(12, 23, 46, 0.55)",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 36,
    elevation: 18,
    borderRadius: 32,
  },
  heroCard: {
    width: "100%",
    borderRadius: 32,
    overflow: "hidden",
  },
  heroCardInner: {
    backgroundColor: CARD_BACKGROUND,
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: "center",
    gap: 24,
  },
  header: {
    gap: 6,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    letterSpacing: 0.5,
    fontFamily: theme.fonts.heading,
    color: TEXT_PRIMARY,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: TEXT_MUTED,
    fontFamily: FONT_SYSTEM,
  },
  fieldColumn: {
    width: "100%",
    gap: 14,
    alignItems: "center",
  },
  fieldShell: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: FIELD_BACKGROUND,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(32, 29, 25, 0.55)",
    fontFamily: FONT_SYSTEM,
  },
  input: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontFamily: FONT_SYSTEM,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.black,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 220,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonLabel: {
    color: theme.colors.offwhite,
    fontSize: 18,
    fontFamily: FONT_SYSTEM,
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  status: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    fontFamily: FONT_SYSTEM,
  },
  statusPositive: {
    color: theme.colors.teal,
  },
  statusNegative: {
    color: TEXT_PRIMARY,
  },
  linkRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  linkColumn: {
    marginTop: 16,
    alignItems: "center",
    gap: 10,
  },
  linkPressable: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  linkPrimary: {
    fontFamily: FONT_SYSTEM,
    fontSize: 15,
    color: APPLE_BLUE,
    fontWeight: "600",
  },
  linkPrimaryBlack: {
    fontFamily: FONT_SYSTEM,
    fontSize: 15,
    color: TEXT_PRIMARY,
    fontWeight: "600",
  },
  linkComposite: {
    fontFamily: FONT_SYSTEM,
    fontSize: 15,
    fontWeight: "600",
  },
  linkSecondary: {
    fontFamily: FONT_SYSTEM,
    fontSize: 15,
    color: TEXT_MUTED,
    fontWeight: "500",
  },
});

