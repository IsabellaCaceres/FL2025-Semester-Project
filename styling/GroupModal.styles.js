// styling/GroupModal.styles.js
import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({
    fullscreenContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    backgroundImageAbsolute: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
absoluteCloseButton: {
        position: 'absolute',
        top: 40,
        left: theme.spacing.md,
        zIndex: 10,
        paddingHorizontal: theme.spacing.lg,
    },
    contentContainerBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        width: '100%',
        backgroundColor: theme.colors.offwhite,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        zIndex: 5,
    },
    scrollContent: {
        paddingBottom: theme.spacing.lg,
    },

    modalContainer: {
        width: "100%",
        padding: theme.spacing.lg,
    },

    groupDetailHeader: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        flexDirection: "column",
        alignItems: "center", 
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
        zIndex: 9, 
        width: '90%',
        marginLeft: 15,
    },
    groupDetailHeaderText: {
        flex: 1,
        width: '100%', 
        flexDirection: "row",
        justifyContent: "space-between", 
    },
    groupDetailSubtext: {
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.subheading,
        color: theme.colors.offwhite,
    },
    headerTitle: {
        fontSize: theme.fontSizes.qxl,
        fontFamily: theme.fonts.heading,
        color: theme.colors.offwhite,
    },

    currentlyReadingSection: {
        paddingHorizontal: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.md,
        fontWeight: theme.fontWeight.semiBold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.black,
        fontFamily: theme.fonts.subheading,
    },
    bookDetailRow: {
        flexDirection: "row",
        gap: theme.spacing.md,
        backgroundColor: theme.colors.offwhite,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    bookCoverPlaceholder: {
        width: 120,
        height: 180,
        backgroundColor: theme.colors.black,
        borderRadius: theme.borderRadius.sm,
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        color: theme.colors.black,
        fontSize: theme.fontSizes.sm - 2,
    },
    bookDetailInfo: {
        flex: 1,
    },
    bookDetailTitle: {
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeight.semiBold,
        marginBottom: theme.spacing.sm + 2,
        color: theme.colors.black,
    },
    bookDetailDescription: {
        fontSize: theme.fontSizes.sm,
        lineHeight: 20,
        color: theme.colors.black,
        marginBottom: theme.spacing.sm,
    },
    showMoreLink: {
        fontSize: theme.fontSizes.sm,
        color: theme.colors.teal,
        textDecorationLine: "underline",
        marginTop: theme.spacing.xs,
    },

    groupDetailFooter: {
        padding: theme.spacing.lg,
        alignItems: "center",
    },
    stayConnectedText: {
        fontSize: theme.fontSizes.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.black,
    },

    modalButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: theme.spacing.md,
    },
    modalButton: {
        flex: 1,
        marginHorizontal: theme.spacing.sm,
    },
    joinButton: {
        backgroundColor: theme.colors.teal,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        alignItems: "center",

    },
    buttonLabel: {
        fontFamily: theme.fonts.subheading,
        fontSize: theme.fontSizes.xl,
        color: theme.colors.offwhite,
    },
    openChatButton: {
        backgroundColor: theme.colors.teal,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    modalCloseButton: {
        marginTop: theme.spacing.sm,
    },
});