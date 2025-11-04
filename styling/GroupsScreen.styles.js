// styling/GroupsScreen.styles.js (The original file, now updated)
import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.offwhite,
        padding: theme.spacing.md,
    },

    // Header
    groupsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.black,
    },

    // Buttons (General/Reused styles remain)
    button: {
        backgroundColor: theme.colors.black,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        alignItems: "center",
        marginVertical: theme.spacing.sm,
    },
    buttonLabel: {
        color: theme.colors.offwhite,
        fontWeight: theme.fontWeight.semiBold,
        fontSize: theme.fontSizes.md,
    },
    buttonMuted: {
        backgroundColor: theme.colors.black,
    },
    groupButton: {
        alignSelf: "center",
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
    },

    // Group cards (List items on the main screen)
    groupCard: {
        backgroundColor: theme.colors.teal,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    groupName: {
        fontSize: theme.fontSizes.md,
        fontWeight: theme.fontWeight.semiBold,
        marginBottom: theme.spacing.xs,
        color: theme.colors.offwhite,
    },
    groupBook: {
        color: theme.colors.offwhite,
    },

    // Form inputs (Used by the Create Group Modal in GroupsScreen)
    input: {
        borderWidth: 1,
        borderColor: theme.colors.black,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.offwhite,
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: theme.spacing.md,
    },
    switchLabel: {
        marginRight: theme.spacing.sm,
        color: theme.colors.black,
    },
});