import { StyleSheet } from "react-native";
import { theme } from "./theme";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.offwhite,
    },
    listContent: {
        paddingVertical: 8,
    },
    messageWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    messageBubble: {
        maxWidth: "80%",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,

        //the comic-book looking chat
        shadowColor: theme.colors.black,        
        shadowOpacity: 1,             
        shadowOffset: { width: -2, height: 4 }, // 👈 left (-x) and bottom (+y)
    },
    messageFromMe: {
        backgroundColor: theme.colors.teal,
        alignSelf: "flex-end",
    },
    messageFromOther: {
        backgroundColor: theme.colors.beige,
        alignSelf: "flex-start",
    },
    username: {
        fontWeight: "600",
        fontSize: 12,
        marginBottom: 2,
        fontFamily: theme.fonts.subheading,
        fontSize: theme.fontSizes.md,
    },
    usernameFromMe: {
        color: theme.colors.offwhite,
    },
    usernameFromOther: {
        color: theme.colors.grey,
    },
    messageTextFromMe: {
        color: theme.colors.offwhite,
        fontFamily: theme.fonts.text,
        fontSize: theme.fontSizes.md,
    },
    messageTextFromOther: {
        color: theme.colors.black,
    },
    inputContainer: {
        flexDirection: "row",
        padding: 12,
        borderTopWidth: 1,
        borderColor: theme.colors.grey,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.grey,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 8,
        fontFamily: theme.fonts.subheading,
        fontSize: theme.fontSizes.md,
        color: theme.colors.grey,
    },
    sendButton: {
        backgroundColor: theme.colors.teal,
        borderRadius: 10,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    sendButtonText: {
        color: theme.colors.offwhite,
        fontFamily: theme.fonts.subheading,
        fontSize: theme.fontSizes.lg,
        fontWeight: "600",
    },
});

export default styles;
