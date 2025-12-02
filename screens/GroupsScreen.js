import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import styles from "../styling/GroupsScreen.styles";
import { theme } from "../styling/theme";
import { fetchGroups, fetchMyGroups, createGroup, joinGroup } from "../lib/api";
import GroupModal from "../components/GroupModal"; 

export default function GroupsScreen() {
  const [myGroups, setMyGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showJoinButton, setShowJoinButton] = useState(false);
  const [loading, setLoading] = useState(true);

  const [groupName, setGroupName] = useState("");
  const [vibeTags, setVibeTags] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [invitees, setInvitees] = useState("");
  
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 768;

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const [my, publicData] = await Promise.all([
        fetchMyGroups(),
        fetchGroups()
      ]);
      setMyGroups(my);
      setPublicGroups(publicData);
    } catch (error) {
      console.error("Failed to load groups", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Missing info", "Group name is required.");
      return;
    }

    try {
      const newGroup = await createGroup({
        name: groupName.trim(),
        description: description.trim(),
        vibe_tags: vibeTags.split(",").map((tag) => tag.trim()).filter(Boolean),
        is_public: isPublic,
      });
      
      if (newGroup) {
        setShowCreateModal(false);
        setGroupName("");
        setVibeTags("");
        setDescription("");
        setIsPublic(true);
        loadGroups(); 
        Alert.alert("Success", "Group created!");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to create group");
    }
  };

  const handleJoinGroupClick = (group) => {
    setSelectedGroup(group);
    setShowJoinButton(true);
  };

  const handleJoinGroup = async () => {
    if (!selectedGroup) return;
    try {
      await joinGroup(selectedGroup.id);
      Alert.alert("Joined", `You joined "${selectedGroup.name}"`);
      setShowJoinButton(false);
      setSelectedGroup(null);
      loadGroups(); 
    } catch (err) {
      Alert.alert("Error", "Failed to join group");
    }
  };

  const handleOpenGroup = (group) => {
    navigation.navigate("GroupChat", { groupId: group.id, title: group.name });
  };

  const handleCloseModal = () => {
    setSelectedGroup(null);
    setShowJoinButton(false);
  };

  const suggestedGroups = publicGroups.filter(
    (group) => !myGroups.some((g) => g.id === group.id)
  );

  if (loading && !myGroups.length && !publicGroups.length) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.black} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.groupsHeader}>
        <Text style={styles.headerTitle}>
          {showBrowse ? "Browse Groups" : "My Groups"}
        </Text>
        <Pressable style={styles.button} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.buttonLabel}>Create Group</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {showBrowse ? (
          <>
            {suggestedGroups.length === 0 ? (
              <Text style={{ padding: 20, textAlign: 'center', fontFamily: theme.fonts.text, fontSize: 16 }}>No new groups to join.</Text>
            ) : (
              suggestedGroups.map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupBook} numberOfLines={2}>
                    {group.description || "No description"}
                  </Text>
                  {group.vibe_tags?.length ? (
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {group.vibe_tags.map((t, i) => (
                         <Text key={i} style={{ fontSize: 12, color: theme.colors.black, backgroundColor: 'rgba(0,0,0,0.05)', padding: 2 }}>#{t}</Text>
                      ))}
                    </View>
                  ) : null}
                  <Pressable
                    style={[styles.button, { marginTop: 12 }]}
                    onPress={() => handleJoinGroupClick(group)}
                  >
                    <Text style={styles.buttonLabel}>Join Group</Text>
                  </Pressable>
                </View>
              ))
            )}
            <Pressable
              style={[styles.button, styles.groupButton]}
              onPress={() => setShowBrowse(false)}
            >
              <Text style={styles.buttonLabel}>Back to My Groups</Text>
            </Pressable>
          </>
        ) : (
          <>
            {myGroups.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontFamily: theme.fonts.text, fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
                  You haven't joined any groups yet.
                </Text>
                <Pressable
                  style={[styles.button, styles.groupButton]}
                  onPress={() => setShowBrowse(true)}
                >
                  <Text style={styles.buttonLabel}>Browse Groups</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {myGroups.map((group) => (
                  <Pressable
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => handleOpenGroup(group)}
                  >
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupBook}>
                      {group.is_public ? "Public" : "Private"}
                    </Text>
                     {group.vibe_tags?.length ? (
                      <Text style={{ fontSize: 12, color: theme.colors.black, marginTop: 4 }}>
                        {group.vibe_tags.join(", ")}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.button, styles.groupButton]}
                  onPress={() => setShowBrowse(true)}
                >
                  <Text style={styles.buttonLabel}>Browse More Groups</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>

      <GroupModal
        visible={!!selectedGroup}
        selectedGroup={selectedGroup}
        showJoinButton={showJoinButton}
        onClose={handleCloseModal}
        onJoinGroup={handleJoinGroup}
        myGroups={myGroups}
      />

      <Modal
        visible={showCreateModal}
        animationType={isDesktop ? "fade" : "slide"}
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDesktop && { width: 500, maxHeight: '90%' }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={styles.headerTitle}>Create a New Group</Text>
                <TextInput
                style={styles.input}
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
                />
                <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                />
                <TextInput
                style={styles.input}
                placeholder="Vibe Tags (comma separated)"
                value={vibeTags}
                onChangeText={setVibeTags}
                />
                <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Public?</Text>
                <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: theme.colors.teal }} />
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
