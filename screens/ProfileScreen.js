// screens/ProfileScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import styles from "../styling/global-styles";
import { theme } from "../styling/theme";
import { profileStyles } from "../styling/profileStyles";

export default function ProfileScreen({ user, onSignOut }) {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState("");

  // hardcoded data - replace with real data if possible
  const displayName = user?.user_metadata?.username ?? user?.email ?? "User";
  const [profileData, setProfileData] = useState({
    achievementTitle: "this is maybe your bio",
    achievementMessage: "You've finished last book in 3 days 🔥",
    followers: 248,
    following: 312,
    booksDone: 5,
  });

  const handleSaveProfile = () => {
    if (editedName) {
      // Save the edited name to backend here
    }
    setIsEditModalVisible(false);
  };

  const openEditModal = () => {
    setEditedName(displayName);
    setIsEditModalVisible(true);
  };

  const menuItems = [
    {
      icon: "notifications-outline",
      iconType: "ionicons",
      label: "Notifications",
      badge: "3",
      onPress: () => console.log("Notifications"),
    },
    {
      icon: "bookmark-outline",
      iconType: "ionicons",
      label: "Bookmarks",
      onPress: () => console.log("Bookmarks"),
    },
    {
      icon: "star-outline",
      iconType: "ionicons",
      label: "Subscription plan",
      onPress: () => console.log("Subscription"),
    },
    {
      icon: "settings-outline",
      iconType: "ionicons",
      label: "Account settings",
      onPress: () => console.log("Settings"),
    },
    {
      icon: "log-out-outline",
      iconType: "ionicons",
      label: "Log out",
      onPress: onSignOut,
      danger: true,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.offwhite }}>
      <ScrollView style={profileStyles.container}>
        {/* Header with Profile Picture */}
        <View style={profileStyles.header}>
          <Pressable style={profileStyles.avatarContainer} onPress={openEditModal}>
            <View style={profileStyles.avatar}>
              <Text style={profileStyles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </Pressable>

          <Text style={profileStyles.displayName}>{displayName}</Text>

          {/* Achievement Message */}
          <View style={profileStyles.achievementBox}>
            <Text style={profileStyles.achievementTitle}>
              {profileData.achievementTitle}
            </Text>
            <Text style={profileStyles.achievementMessage}>
              {profileData.achievementMessage}
            </Text>
          </View>
        </View>

        {/* Menu List */}
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
                  color={item.danger ? "#e74c3c" : theme.colors.darkgray}
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

        {/* Reading Stats */}
        <View style={profileStyles.statsSection}>
          <View style={profileStyles.statCard}>
            <Ionicons name="people-outline" size={32} color={theme.colors.darkgray} />
            <Text style={profileStyles.statNumber}>{profileData.followers}</Text>
            <Text style={profileStyles.statLabel}>followers</Text>
          </View>

          <View style={profileStyles.statCard}>
            <Ionicons name="person-add-outline" size={32} color={theme.colors.darkgray} />
            <Text style={profileStyles.statNumber}>{profileData.following}</Text>
            <Text style={profileStyles.statLabel}>following</Text>
          </View>

          <View style={profileStyles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.darkgray} />
            <Text style={profileStyles.statNumber}>{profileData.booksDone} books</Text>
            <Text style={profileStyles.statLabel}>done</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
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
              <Pressable onPress={handleSaveProfile}>
                <Text style={profileStyles.modalSave}>Save</Text>
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

              <Text style={profileStyles.modalNote}>
                Tap your profile picture to change it
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}