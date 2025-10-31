// screens/SearchScreen.styles.js
import { StyleSheet } from "react-native";
import { theme } from "../styling/theme";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
    padding: theme.spacing.md,
  },

  // Scroll
  searchScroll: {
    paddingBottom: theme.spacing.lg,
  },

  // Search header
  searchHeaderContainer: {
    backgroundColor: theme.colors.offwhite,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.md,
  },
  searchHeaderTall: {
    minHeight: 140,
  },
  searchHeaderText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeight.semiBold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.black,
  },

  // Search bar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.offwhite,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.black,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInputFlex: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  searchButton: {
    backgroundColor: theme.colors.teal,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  searchButtonText: {
    color: theme.colors.offwhite,
    fontWeight: theme.fontWeight.semiBold,
  },

  // Results
  searchResults: {
    marginTop: theme.spacing.lg,
  },
  searchActiveFilter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  searchActiveLabel: {
    fontWeight: theme.fontWeight.semiBold,
    color: theme.colors.black,
  },
  searchClearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  searchClearText: {
    color: theme.colors.teal,
    fontWeight: theme.fontWeight.semiBold,
  },
  searchEmpty: {
    textAlign: "center",
    marginTop: theme.spacing.lg,
    color: theme.colors.black,
  },

  // Result cards
  searchResultCard: {
    padding: theme.spacing.md - 4,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.offwhite,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  searchResultTitle: {
    fontWeight: theme.fontWeight.semiBold,
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
  },
  searchResultAuthor: {
    color: theme.colors.black,
    marginTop: theme.spacing.xs,
  },
  searchResultSummary: {
    color: theme.colors.black,
    marginTop: theme.spacing.sm - 2,
    fontSize: theme.fontSizes.sm,
  },
  searchResultMeta: {
    color: theme.colors.black,
    marginTop: theme.spacing.sm - 2,
    fontSize: theme.fontSizes.sm - 2,
  },
  searchResultButton: {
    marginTop: theme.spacing.sm,
  },

  // Genres
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
  },
  genreCard: {
    flexBasis: "32%",
    marginBottom: theme.spacing.sm + 2,
    height: 70,
    backgroundColor: theme.colors.offwhite,
    borderWidth: 1,
    borderColor: theme.colors.black,
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  genreLabel: {
    fontWeight: theme.fontWeight.semiBold,
    textAlign: "center",
    fontSize: theme.fontSizes.sm,
    color: theme.colors.black,
  },
  genreCardActive: {
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.teal,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  congratsModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  congratsText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
    color: "#333",
  },
});
