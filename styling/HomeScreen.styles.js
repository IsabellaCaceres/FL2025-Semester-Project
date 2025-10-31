// screens/HomeScreen.styles.js
import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
    padding: theme.spacing.md,
  },

  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.black,
    fontFamily: "Helvetica",
  },

  searchEmpty: {
    textAlign: "center",
    marginTop: theme.spacing.lg,
    color: theme.colors.black,
  },

  bookCard: {
    width: 140,
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  bookCoverWrapper: {
    backgroundColor: theme.colors.offwhite,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.grey,
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  bookCover: {
    width: 120,
    height: 170,
    borderRadius: theme.borderRadius.md,
  },
  bookTitle: {
    fontSize: theme.fontSizes.md,   
    textAlign: "center",
    color: theme.colors.black,
    fontFamily: theme.fonts.text,
    width: "90%",   
    marginTop: theme.spacing.sm,               
  },
  recommendationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  recommendationCard: {
    width: "31%",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  recommendationCoverWrapper: {
    width: "100%",
    aspectRatio: 2 / 3,
    backgroundColor: theme.colors.offwhite,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.grey,
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: theme.spacing.sm,
  },
  recommendationCover: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.md,
  },
  recommendationTitle: {
    fontSize: theme.fontSizes.md,
    textAlign: "center",
    color: theme.colors.black,
    width: "100%",
    fontFamily: theme.fonts.text
  },

  emptyRecommendationsContainer: {
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  emptyRecommendationsText: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },

  goButton: {
    backgroundColor: theme.colors.teal,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.lg + 4,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
  },
  goButtonPressed: {
    backgroundColor: theme.colors.black,
    opacity: 0.8,
  },
  goButtonText: {
    color: theme.colors.offwhite,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeight.semiBold,
  },
  goButtonArrow: {
    color: theme.colors.offwhite,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeight.semiBold,
  },
});
