// screens/GroupsScreen.styles.js
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

  // Buttons
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
  joinButton: {
    backgroundColor: theme.colors.coffee,
    paddingHorizontal: theme.spacing.xl + 6,
    paddingVertical: theme.spacing.md - 4,
    borderRadius: theme.borderRadius.xl + 13,
  },
  openChatButton: {
    backgroundColor: theme.colors.teal,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  modalCloseButton: {
    marginTop: theme.spacing.sm,
  },

  // Group cards
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

  // Modal basics
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.colors.offwhite,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
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

  // Group detail modal
  groupDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.black,
    gap: theme.spacing.md,
  },
  groupProfilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.teal,
    justifyContent: "center",
    alignItems: "center",
  },
  groupProfileInitial: {
    fontSize: theme.fontSizes.xl + 8,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.offwhite,
  },
  groupDetailHeaderText: {
    flex: 1,
  },
  groupDetailSubtext: {
    fontSize: theme.fontSizes.sm - 2,
    color: theme.colors.black,
    marginTop: theme.spacing.xs,
  },

  currentlyReadingSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.beige,
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

  // Form inputs
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
