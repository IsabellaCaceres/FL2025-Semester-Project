// screens/LibraryScreen.styles.js
import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
    padding: theme.spacing.md,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.black,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.black,
  },
  tabButtonLabel: {
    textAlign: "center",
    color: theme.colors.offwhite,
    fontWeight: theme.fontWeight.semiBold,
  },
  tabButtonLabelActive: {
    color: theme.colors.offwhite,
  },

  // Library grid
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: theme.spacing.md,
  },
  bookCard: {
    width: 140,
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  bookCover: {
    width: 120,
    height: 170,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  bookTitle: {
    fontSize: theme.fontSizes.sm,
    textAlign: "center",
    color: theme.colors.black,
  },

  // Empty state
  searchEmpty: {
    textAlign: "center",
    marginTop: theme.spacing.lg,
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
  createListButton: {
    marginBottom: theme.spacing.md,
  },

  // Groups / lists
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

  // Modal
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
  modalScroll: {
    maxHeight: 300,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.offwhite,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  listItemSelected: {
    backgroundColor: theme.colors.teal,
  },
  listItemImage: {
    width: 40,
    height: 60,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
});
