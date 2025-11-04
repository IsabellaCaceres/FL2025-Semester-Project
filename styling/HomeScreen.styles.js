// screens/HomeScreen.styles.js
import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  content: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  featureCard: {
    backgroundColor: "rgba(32,29,25,0.04)",
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  featureImageWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "rgba(32,29,25,0.08)",
  },
  featureImage: {
    width: "100%",
    height: "100%",
  },
  featureContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: 28,
    color: theme.colors.black,
    fontFamily: theme.fonts.heading,
    letterSpacing: 0.5,
  },
  featureAuthor: {
    fontSize: theme.fontSizes.md,
    color: "rgba(32,29,25,0.75)",
    fontFamily: theme.fonts.accent,
  },
  featureSummary: {
    fontSize: theme.fontSizes.md,
    lineHeight: 20,
    color: "rgba(32,29,25,0.75)",
    fontFamily: theme.fonts.text,
  },
  featureGenre: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.black,
    color: theme.colors.offwhite,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 36,
    color: theme.colors.black,
    fontFamily: theme.fonts.heading,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.6,
  },
  genreGrid: {
    paddingBottom: theme.spacing.lg,
  },
  genreSection: {
    marginBottom: theme.spacing.xl,
  },
  genreHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  genreTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.accent,
    color: theme.colors.black,
    letterSpacing: 0.6,
  },
  genreCount: {
    fontSize: 12,
    color: "rgba(32,29,25,0.55)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  genreRow: {
    paddingRight: theme.spacing.md,
  },
  genreCard: {
    width: 140,
    marginRight: theme.spacing.md,
  },
  genreCoverWrapper: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "rgba(32,29,25,0.05)",
    overflow: "hidden",
  },
  genreCover: {
    width: "100%",
    height: "100%",
  },
  genreBookTitle: {
    fontSize: theme.fontSizes.md,
    lineHeight: 20,
    color: theme.colors.black,
    fontFamily: theme.fonts.text,
    marginTop: theme.spacing.sm,
  },
  trendingSection: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  trendingHeader: {
    marginBottom: theme.spacing.md,
  },
  trendingHeading: {
    fontSize: 32,
    color: theme.colors.black,
    fontFamily: theme.fonts.heading,
    letterSpacing: 0.4,
  },
  trendingRow: {
    paddingRight: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  trendingCard: {
    width: 280,
    marginRight: theme.spacing.lg,
  },
});
