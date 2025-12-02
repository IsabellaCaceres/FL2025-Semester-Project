import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../styling/theme";
import { profileStyles } from "../styling/profileStyles";
import { fetchMyProfile, updateMyProfile, fetchMyStats } from "../lib/api";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen({ onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  
  // Edit State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, stats] = await Promise.all([fetchMyProfile(), fetchMyStats()]);
      setProfile(p);
      setFollowingCount(stats.following || 0);
      setFollowersCount(stats.followers || 0);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        full_name: editedName,
        bio: editedBio,
      });
      if (updated) {
        setProfile(updated);
        setIsEditModalVisible(false);
        Alert.alert("Success", "Profile updated!");
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditedName(profile.full_name || "");
    setEditedBio(profile.bio || "");
    setIsEditModalVisible(true);
  };

  const handleSignOut = async () => {
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        Alert.alert("Error", "Sign out handler not available");
      }
    } catch (error) {
      console.error("Sign out failed", error);
      Alert.alert("Error", "Sign out failed: " + error.message);
    }
  };

  const handlePlaceholderPress = (title) => {
    Alert.alert(title, "This feature is coming soon!");
  }

  if (loading && !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.black} />
      </View>
    );
  }

  const displayName = profile?.full_name || profile?.username || "User";
  const displayBio = profile?.bio || "No bio yet.";
  const initial = displayName.charAt(0).toUpperCase();

  const menuItems = [
    {
      icon: "notifications-outline",
      label: "Notifications",
      badge: "3",
      onPress: () => handlePlaceholderPress("Notifications"),
    },
    {
      icon: "bookmark-outline",
      label: "Bookmarks",
      onPress: () => handlePlaceholderPress("Bookmarks"),
    },
    {
      icon: "settings-outline",
      label: "Account settings",
      onPress: () => handlePlaceholderPress("Account Settings"),
    },
    {
      icon: "log-out-outline",
      label: "Log out",
      onPress: handleSignOut,
      danger: true,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.offwhite }}>
      <ScrollView style={profileStyles.container} contentContainerStyle={profileStyles.scrollContent}>
        <View style={profileStyles.header}>
          <Pressable style={profileStyles.avatarContainer} onPress={openEditModal}>
            {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={profileStyles.avatar} />
            ) : (
                <View style={profileStyles.avatar}>
                <Text style={profileStyles.avatarText}>{initial}</Text>
                </View>
            )}
            <View style={profileStyles.editBadge}>
                <Ionicons name="pencil" size={12} color="white" />
            </View>
          </Pressable>

          <Text style={profileStyles.displayName}>{displayName}</Text>
          <Text style={{ fontFamily: theme.fonts.text, color: theme.colors.secondary, marginBottom: 16 }}>@{profile?.username}</Text>

          <View style={profileStyles.achievementBox}>
            <Text style={profileStyles.achievementMessage}>
              {displayBio}
            </Text>
          </View>
        </View>

        <View style={profileStyles.statsSection}>
          <View style={profileStyles.statCard}>
            <Ionicons name="people-outline" size={24} color={theme.colors.darkgray} />
            <Text style={profileStyles.statNumber}>{followingCount}</Text>
            <Text style={profileStyles.statLabel}>following</Text>
          </View>
          <View style={profileStyles.statCard}>
            <Ionicons name="heart-outline" size={24} color={theme.colors.darkgray} />
            <Text style={profileStyles.statNumber}>{followersCount}</Text>
            <Text style={profileStyles.statLabel}>followers</Text>
          </View>
        </View>

        <View style={profileStyles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={[
                profileStyles.menuItem,
                index === menuItems.length - 1 && profileStyles.menuItemLast,
              ]}
              onPress={item.onPress}
            >
              <View style={profileStyles.menuItemLeft}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.danger ? theme.colors.error : theme.colors.darkgray}
                />
                <Text
                  style={[
                    profileStyles.menuItemLabel,
                    item.danger && profileStyles.menuItemLabelDanger,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {item.badge && (
                <View style={profileStyles.badge}>
                  <Text style={profileStyles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={profileStyles.modalOverlay}>
          <View style={profileStyles.modalContent}>
            <View style={profileStyles.modalHeader}>
              <Pressable onPress={() => setIsEditModalVisible(false)}>
                <Text style={profileStyles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={profileStyles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={handleSaveProfile} disabled={saving}>
                <Text style={[profileStyles.modalSave, saving && { opacity: 0.5 }]}>
                    {saving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>

            <ScrollView style={profileStyles.modalBody}>
              <View style={profileStyles.inputGroup}>
                <Text style={profileStyles.inputLabel}>Display Name</Text>
                <TextInput
                  style={profileStyles.textInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Your name"
                />
              </View>
              
              <View style={profileStyles.inputGroup}>
                <Text style={profileStyles.inputLabel}>Bio</Text>
                <TextInput
                  style={[profileStyles.textInput, { height: 80 }]}
                  value={editedBio}
                  onChangeText={setEditedBio}
                  placeholder="Tell us about yourself..."
                  multiline
                />
              </View>

              <Text style={profileStyles.modalNote}>
                Avatar uploading coming soon.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
