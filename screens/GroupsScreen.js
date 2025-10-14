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
import styles from "../styling/global-styles";
import { allGroups } from "../data/data";
import { useLibrary } from "../lib/library-context";

export default function GroupsScreen() {
  const { library } = useLibrary();
  const [myGroups, setMyGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [vibeTags, setVibeTags] = useState("");
  const [maxMembers, setMaxMembers] = useState("10");
  const [isPublic, setIsPublic] = useState(true);
  const [invitees, setInvitees] = useState("");

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

  const handleJoinGroup = (group) => {
    if (myGroups.some((g) => g.id === group.id)) {
      Alert.alert("Already joined", `You're already in "${group.name}"`);
      return;
    }
    setMyGroups([...myGroups, group]);
    Alert.alert("Joined", `You joined "${group.name}"`);
  };

  const suggestedGroups = allGroups.filter(
    (group) =>
      library.some((book) => book.title === group.relatedBook) &&
      !myGroups.some((g) => g.id === group.id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.groupsHeader}>
        <Text style={styles.headerTitle}>
          {myGroups.length ? "My Groups" : "Suggested Groups"}
        </Text>
        <Pressable style={styles.button} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.buttonLabel}>Create Group</Text>
        </Pressable>
      </View>

      <ScrollView>
        {myGroups.length > 0 ? (
          <>
            {myGroups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupBook}>
                  {group.isPublic ? "Public" : "Private"} | Max {group.maxMembers} members
                </Text>
                {group.vibeTags?.length ? (
                  <Text style={styles.groupBook}>Tags: {group.vibeTags.join(", ")}</Text>
                ) : null}
                <Pressable
                  style={[styles.button, styles.groupButton]}
                  onPress={() =>
                    Alert.alert("Open Group", `Opening group: "${group.name}"`)
                  }
                >
                  <Text style={styles.buttonLabel}>Open Group</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              style={[styles.button, styles.groupButton]}
              onPress={() =>
                Alert.alert("Browse Groups", "Navigate to Browse Groups screen")
              }
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
                onPress={() => handleJoinGroup(group)}
              >
                <Text style={styles.buttonLabel}>Join Group</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

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
