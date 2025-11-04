// screens/GroupsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import styles from "../styling/GroupsScreen.styles";
import { allGroups } from "../data/data";
import { useLibrary } from "../lib/library-context";


export default function GroupsScreen() {
  const { library } = useLibrary();
  const [myGroups, setMyGroups] = useState([]);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showJoinButton, setShowJoinButton] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [vibeTags, setVibeTags] = useState("");
  const [maxMembers, setMaxMembers] = useState("10");
  const [isPublic, setIsPublic] = useState(true);
  const [invitees, setInvitees] = useState("");

  const navigation = useNavigation();


  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert("Missing info", "Group name is required.");
      return;
    }
    if (parseInt(maxMembers, 10) > 256 || parseInt(maxMembers, 10) < 2) {
      Alert.alert("Invalid number", "Max members must be between 2 and 256.");
      return;
    }

    const newGroup = {
      id: Date.now(),
      name: groupName.trim(),
      vibeTags: vibeTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      maxMembers: parseInt(maxMembers, 10),
      isPublic,
      invitees: invitees.split(",").map((i) => i.trim()).filter(Boolean),
    };
    setMyGroups([...myGroups, newGroup]);
    setShowCreateModal(false);

    setGroupName("");
    setVibeTags("");
    setMaxMembers("10");
    setIsPublic(true);
    setInvitees("");
  };

  const handleJoinGroupClick = (group) => {
    setSelectedGroup(group);
    setShowJoinButton(true);
    setShowReadMore(false);
  };

  const handleJoinGroup = () => {
    if (myGroups.some((g) => g.id === selectedGroup.id)) {
      Alert.alert("Already joined", `You're already in "${selectedGroup.name}"`);
      setSelectedGroup(null);
      return;
    }
    setMyGroups([...myGroups, selectedGroup]);
    setSelectedGroup(null);
    Alert.alert("Joined", `You joined "${selectedGroup.name}"`);
  };

  const handleOpenGroup = (group) => {
    setSelectedGroup(group);
    setShowJoinButton(false);
    setShowReadMore(false);
  };

  const handleCloseGroup = () => {
    setSelectedGroup(null);
    setShowReadMore(false);
    setShowJoinButton(false);
  };

  // Show groups related to books in library, or all groups if library is empty
  const suggestedGroups = allGroups.filter(
    (group) => !myGroups.some((g) => g.id === group.id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.groupsHeader}>
        <Text style={styles.headerTitle}>
          {showBrowse ? "Browse Groups" : myGroups.length ? "My Groups" : "Suggested Groups"}
        </Text>
        <Pressable style={styles.button} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.buttonLabel}>Create Group</Text>
        </Pressable>
      </View>

      <ScrollView>
        {showBrowse ? (
          <>
            {suggestedGroups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupBook}>
                  Related to {group.relatedBook}
                </Text>
                <Pressable
                  style={styles.button}
                  onPress={() => handleJoinGroupClick(group)}
                >
                  <Text style={styles.buttonLabel}>Join Group</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              style={[styles.button, styles.groupButton]}
              onPress={() => setShowBrowse(false)}
            >
              <Text style={styles.buttonLabel}>Back to My Groups</Text>
            </Pressable>
          </>
        ) : myGroups.length > 0 ? (
          <>
            {myGroups.map((group) => (
  <Pressable
    key={group.id}
    style={styles.groupCard}
    onPress={() => navigation.navigate("GroupChat", { group })}
    accessibilityRole="button"
  >
    <Text style={styles.groupName}>{group.name}</Text>
    <Text style={styles.groupBook}>
      {group.isPublic ? "Public" : "Private"} | Max {group.maxMembers} members
    </Text>
    {group.vibeTags?.length ? (
      <Text style={styles.groupBook}>Tags: {group.vibeTags.join(", ")}</Text>
    ) : null}
  </Pressable>
))}
            <Pressable
              style={[styles.button, styles.groupButton]}
              onPress={() => setShowBrowse(true)}
            >
              <Text style={styles.buttonLabel}>Browse Groups</Text>
            </Pressable>
          </>
        ) : (
          suggestedGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupBook}>
                Related to {group.relatedBook}
              </Text>
              <Pressable
                style={styles.button}
                onPress={() => handleJoinGroupClick(group)}
              >
                <Text style={styles.buttonLabel}>Join Group</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal for viewing group details */}
      <Modal
        visible={!!selectedGroup}
        animationType="slide"
        transparent
        onRequestClose={handleCloseGroup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {/* Group Header */}
              <View style={styles.groupDetailHeader}>
                <View style={styles.groupProfilePic}>
                  <Text style={styles.groupProfileInitial}>
                    {selectedGroup?.name?.charAt(0) || "G"}
                  </Text>
                </View>
                <View style={styles.groupDetailHeaderText}>
                  <Text style={styles.headerTitle}>{selectedGroup?.name}</Text>
                  <Text style={styles.groupDetailSubtext}>
                    {selectedGroup?.isPublic ? "DISCUSSES ONLINE" : "PRIVATE GROUP"}
                  </Text>
                  <Text style={styles.groupDetailSubtext}>
                    {selectedGroup?.maxMembers || 0} members
                  </Text>
                </View>
                {showJoinButton && (
                  <Pressable
                    style={[styles.button, styles.joinButton]}
                    onPress={handleJoinGroup}
                  >
                    <Text style={styles.buttonLabel}>JOIN</Text>
                  </Pressable>
                )}
              </View>

              {/* Currently Reading Section */}
              <View style={styles.currentlyReadingSection}>
                <Text style={styles.sectionTitle}>CURRENTLY READING</Text>
                <View style={styles.bookDetailRow}>
                  <View style={styles.bookCoverPlaceholder}>
                    <Text style={styles.placeholderText}>Book Cover</Text>
                  </View>
                  <View style={styles.bookDetailInfo}>
                    <Text style={styles.bookDetailTitle}>
                      About {selectedGroup?.name}
                    </Text>
                    <Text style={styles.bookDetailDescription}>
                      Welcome to {selectedGroup?.name}! We hope you're ready for some great reads and invigorating discussions!
                      {"\n\n"}
                      Our focus is to highlight exceptional books from all different genres.
                      {showReadMore && (
                        <>
                          {"\n\n"}
                          This book club operates through messages where we share our favorite reads and discuss them together. Join us to connect with fellow readers!
                        </>
                      )}
                    </Text>
                    <Pressable onPress={() => setShowReadMore(!showReadMore)}>
                      <Text style={styles.showMoreLink}>
                        {showReadMore ? "Show less" : "Show more"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.groupDetailFooter}>
                <Text style={styles.stayConnectedText}>
                  Stay connected with {selectedGroup?.name}
                </Text>
              </View>
            </ScrollView>

            {!showJoinButton && (
              <Pressable
              style={[styles.button, styles.openChatButton]}
              onPress={() => {
                const g = selectedGroup;
                setSelectedGroup(null);
                setShowReadMore(false);
                setShowJoinButton(false);
                navigation.navigate("GroupChat", { group: g });
              }}
            >
              <Text style={styles.buttonLabel}>Open Chat</Text>
            </Pressable>
            )}

            <Pressable
              style={[styles.button, styles.buttonMuted, styles.modalCloseButton]}
              onPress={handleCloseGroup}
            >
              <Text style={styles.buttonLabel}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal for creating groups */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.headerTitle}>Create a New Group</Text>
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
            />
            <TextInput
              style={styles.input}
              placeholder="Vibe Tags (comma separated)"
              value={vibeTags}
              onChangeText={setVibeTags}
            />
            <TextInput
              style={styles.input}
              placeholder="Max Members (2-256)"
              value={maxMembers}
              onChangeText={setMaxMembers}
              keyboardType="numeric"
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Public?</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Invite Friends (comma-separated emails)"
              value={invitees}
              onChangeText={setInvitees}
            />

            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.button, styles.modalButton]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.buttonLabel}>Create</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonMuted, styles.modalButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.buttonLabel}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}