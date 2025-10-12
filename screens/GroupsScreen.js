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
import styles from "../styling/global-styles"
import { libraryBooks, allGroups } from "../data/data";

export default function GroupsScreen() {
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
    if (parseInt(maxMembers) > 256 || parseInt(maxMembers) < 2) {
      Alert.alert("Invalid number", "Max members must be between 2 and 256.");
      return;
    }

    const newGroup = {
      id: Date.now(),
      name: groupName.trim(),
      vibeTags: vibeTags.split(",").map((tag) => tag.trim()),
      maxMembers: parseInt(maxMembers),
      isPublic,
      invitees: invitees.split(",").map((i) => i.trim()),
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
      libraryBooks.some((book) => book.title === group.relatedBook) &&
      !myGroups.some((g) => g.id === group.id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
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
                  style={[styles.button, { marginTop: 8 }]}
                  onPress={() =>
                    Alert.alert("Open Group", `Opening group: "${group.name}"`)
                  }
                >
                  <Text style={styles.buttonLabel}>Open Group</Text>
                </Pressable>
              </View>
            ))}
          </>
        ) : (
          suggestedGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupBook}>Related to {group.relatedBook}</Text>
              <Pressable style={styles.button} onPress={() => handleJoinGroup(group)}>
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
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ marginRight: 8 }}>Public?</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Invite Friends (comma-separated emails)"
              value={invitees}
              onChangeText={setInvitees}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Pressable
                style={[styles.button, { flex: 1, marginRight: 6 }]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.buttonLabel}>Create</Text>
              </Pressable>
              <Pressable
                style={[styles.button, { backgroundColor: "#888", flex: 1, marginLeft: 6 }]}
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
