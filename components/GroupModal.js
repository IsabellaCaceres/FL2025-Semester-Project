// components/GroupModal.js
import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    ScrollView,
    Pressable,
    ImageBackground,
    StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import styles from "../styling/GroupModal.styles";
import groupBanner from '../assets/groupBanner.png';


export default function GroupModal({
    visible,
    selectedGroup,
    showJoinButton,
    onClose,
    onJoinGroup,
    myGroups,
}) {
    const navigation = useNavigation();
    const [showReadMore, setShowReadMore] = useState(false);

    useEffect(() => {
        if (!visible) {
            setShowReadMore(false);
        }
    }, [visible, selectedGroup]);

    if (!visible || !selectedGroup) {
        return null;
    }

    const handleOpenChat = () => {
        onClose();
        navigation.navigate("GroupChat", { group: selectedGroup });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            {/* Outer container to manage the full screen layout */}
            <View style={styles.fullscreenContainer}>
                <Pressable
                    style={[styles.button, styles.modalCloseButton, styles.absoluteCloseButton]}
                    onPress={onClose}
                >
                    <Text style={styles.buttonLabel}>Close</Text>
                </Pressable>
                {/* Full-screen background and overlay layer (absolute position) */}

                <ImageBackground
                    source={groupBanner}
                    style={styles.backgroundImageAbsolute}
                    resizeMode="cover"
                >
                    <View style={styles.overlay} />

                </ImageBackground>

                {/* Top Navigation/Close Button (Absolute Positioned for stability) */}

                <View style={styles.groupDetailHeader}>
                    <Text style={styles.headerTitle}>{selectedGroup?.name}</Text>

                    <View style={styles.groupDetailHeaderText}>
                        <Text style={styles.groupDetailSubtext}>
                            {selectedGroup?.isPublic ? "PUBLIC GROUP" : "PRIVATE GROUP"}
                        </Text>
                        <Text style={styles.groupDetailSubtext}>
                            {selectedGroup?.maxMembers || 0} members
                        </Text>
                    </View>
                </View>

                {/* Content Container (Anchored to the bottom) */}
                <View style={styles.contentContainerBottom}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>


                        <View style={styles.currentlyReadingSection}>
                            <View style={styles.bookDetailRow}>
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

                            {showJoinButton && (
                                <Pressable
                                    style={[styles.button, styles.joinButton]}
                                    onPress={onJoinGroup}
                                >
                                    <Text style={styles.buttonLabel}>JOIN</Text>
                                </Pressable>
                            )}

                            {!showJoinButton && (
                                <Pressable
                                    style={[styles.button, styles.openChatButton]}
                                    onPress={handleOpenChat}
                                >
                                    <Text style={styles.buttonLabel}>Open Chat</Text>
                                </Pressable>
                            )}
                        </View>
                    </ScrollView>
                </View>

            </View>
        </Modal>
    );
}









// // components/GroupModal.js
// import React, { useState, useEffect } from "react";
// import { Modal, View, Text, ScrollView, Pressable } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// // Assuming your GroupsScreen.styles covers modal styles too
// import styles from "../styling/GroupModal.styles";


// export default function GroupModal({
//     visible,
//     selectedGroup,
//     showJoinButton,
//     onClose,
//     onJoinGroup,
//     // Pass these states/setters from GroupsScreen
//     myGroups, // Needed for checking if already joined in modal
// }) {
//     const navigation = useNavigation();
//     const [showReadMore, setShowReadMore] = useState(false);

//     // Reset internal state when the modal closes or a new group is selected
//     useEffect(() => {
//         if (!visible) {
//             setShowReadMore(false);
//         }
//     }, [visible, selectedGroup]);

//     // If the modal is visible but somehow selectedGroup is null, don't render.
//     if (!visible || !selectedGroup) {
//         return null;
//     }

//     // Handlers specific to the modal content
//     const handleOpenChat = () => {
//         // Navigate, then close the modal.
//         onClose(); // Close the modal first
//         navigation.navigate("GroupChat", { group: selectedGroup });
//     };

//     return (
//         <Modal
//             visible={visible}
//             animationType="slide"
//             transparent
//             onRequestClose={onClose}
//         >
//             <Pressable
//                 style={[styles.button, styles.buttonMuted, styles.modalCloseButton]}
//                 onPress={onClose}
//             >
//                 <Text style={styles.buttonLabel}>Close</Text>
//             </Pressable>

//             <View style={styles.modalContainer}>
//                 {/* Group Header */}

//                 {/* <View style={styles.groupProfilePic}>
//                             <Text style={styles.groupProfileInitial}>
//                                 {selectedGroup?.name?.charAt(0) || "G"}
//                             </Text>
//                         </View> */}
//                 <View style={styles.groupDetailHeaderText}>
//                     <Text style={styles.headerTitle}>{selectedGroup?.name}</Text>
//                     <Text style={styles.groupDetailSubtext}>
//                         {selectedGroup?.isPublic ? "DISCUSSES ONLINE" : "PRIVATE GROUP"}
//                     </Text>
//                     <Text style={styles.groupDetailSubtext}>
//                         {selectedGroup?.maxMembers || 0} members
//                     </Text>
//                 </View>

//                 {/* Currently Reading Section (Description) */}
//                 <View style={styles.currentlyReadingSection}>
//                     {/* <Text style={styles.sectionTitle}>CURRENTLY READING</Text> */}
//                     <View style={styles.bookDetailRow}>
//                         {/* <View style={styles.bookCoverPlaceholder}>
//                                 <Text style={styles.placeholderText}>Book Cover</Text>
//                             </View> */}
//                         <View style={styles.bookDetailInfo}>
//                             <Text style={styles.bookDetailTitle}>
//                                 About {selectedGroup?.name}
//                             </Text>
//                             <Text style={styles.bookDetailDescription}>
//                                 Welcome to {selectedGroup?.name}! We hope you're ready for some great reads and invigorating discussions!
//                                 {"\n\n"}
//                                 Our focus is to highlight exceptional books from all different genres.
//                                 {showReadMore && (
//                                     <>
//                                         {"\n\n"}
//                                         This book club operates through messages where we share our favorite reads and discuss them together. Join us to connect with fellow readers!
//                                     </>
//                                 )}
//                             </Text>
//                             <Pressable onPress={() => setShowReadMore(!showReadMore)}>
//                                 <Text style={styles.showMoreLink}>
//                                     {showReadMore ? "Show less" : "Show more"}
//                                 </Text>
//                             </Pressable>
//                         </View>
//                     </View>
//                     {/* NOTE: We call the passed-in onJoinGroup handler */}
//                     {showJoinButton && (
//                         <Pressable
//                             style={[styles.button, styles.joinButton]}
//                             onPress={onJoinGroup}
//                         >
//                             <Text style={styles.buttonLabel}>JOIN</Text>
//                         </Pressable>
//                     )}
//                 </View>

//                 {/* <View style={styles.groupDetailFooter}>
//                         <Text style={styles.stayConnectedText}>
//                             Stay connected with {selectedGroup?.name}
//                         </Text>
//                     </View> */}

//                 {/* Currently non-functional as groups can't be seen */}

//                 {/* {!showJoinButton && (
//                     <Pressable
//                         style={[styles.button, styles.openChatButton]}
//                         onPress={handleOpenChat}
//                     >
//                         <Text style={styles.buttonLabel}>Open Chat</Text>
//                     </Pressable>
//                 )} */}


//             </View>
//         </Modal>
//     );
// }