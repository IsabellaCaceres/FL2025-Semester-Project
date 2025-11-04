// screens/SearchScreen.styles.js
import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  scroll: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  heroCard: {
    marginTop: theme.spacing.md,
    backgroundColor: "rgba(32,29,25,0.04)",
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  heroEyebrow: {
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 11,
    color: "rgba(32,29,25,0.55)",
    fontFamily: theme.fonts.text,
  },
  heroTitle: {
    fontSize: 32,
    color: theme.colors.black,
    fontFamily: theme.fonts.heading,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.md,
    color: "rgba(32,29,25,0.7)",
    lineHeight: 22,
    fontFamily: theme.fonts.text,
  },
  messageStack: {
    gap: theme.spacing.md,
  },
  messageBubble: {
    backgroundColor: "rgba(32,29,25,0.05)",
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  messageBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.black,
    color: theme.colors.offwhite,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  messageHeading: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.accent,
    color: theme.colors.black,
    letterSpacing: 0.4,
  },
  messageBody: {
    fontSize: theme.fontSizes.md,
    color: "rgba(32,29,25,0.8)",
    lineHeight: 22,
    fontFamily: theme.fonts.text,
  },
  quickPromptSection: {
    gap: theme.spacing.sm,
  },
  quickPromptTitle: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.text,
    color: "rgba(32,29,25,0.7)",
    letterSpacing: 0.4,
  },
  quickPromptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  quickPromptChip: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: "rgba(32,29,25,0.08)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  quickPromptLabel: {
    fontFamily: theme.fonts.text,
    color: theme.colors.black,
    fontSize: theme.fontSizes.sm,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(32,29,25,0.12)",
    backgroundColor: theme.colors.offwhite,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(32,29,25,0.2)",
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.text,
    color: "rgba(32,29,25,0.65)",
  },
  inputButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(32,29,25,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputButtonDisabled: {
    opacity: 0.5,
  },
  resultsSection: {
    gap: theme.spacing.sm,
  },
  resultsHeading: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fonts.text,
    color: "rgba(32,29,25,0.7)",
    letterSpacing: 0.3,
  },
  resultList: {
    gap: theme.spacing.md,
  },
  resultCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: "rgba(32,29,25,0.04)",
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  resultCoverShadow: {
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    backgroundColor: "rgba(32,29,25,0.05)",
  },
  resultCover: {
    width: 90,
    height: 135,
    borderRadius: theme.borderRadius.lg,
  },
  resultContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  resultTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.black,
  },
  resultAuthor: {
    fontFamily: theme.fonts.text,
    color: "rgba(32,29,25,0.6)",
    fontSize: theme.fontSizes.sm,
  },
  resultReason: {
    fontFamily: theme.fonts.text,
    color: "rgba(32,29,25,0.8)",
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  resultSnippet: {
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.sm,
    color: "rgba(32,29,25,0.55)",
    lineHeight: 18,
  },
  resultButton: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  resultButtonAdd: {
    backgroundColor: theme.colors.black,
  },
  resultButtonAdded: {
    backgroundColor: "rgba(32,29,25,0.12)",
  },
  resultButtonLabel: {
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.sm,
    letterSpacing: 0.3,
    color: theme.colors.offwhite,
  },
  resultButtonLabelAdded: {
    color: "rgba(32,29,25,0.65)",
  },
  suggestionSection: {
    gap: theme.spacing.sm,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  suggestionTitleHeader: {
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.md,
    color: "rgba(32,29,25,0.75)",
    letterSpacing: 0.3,
  },
  suggestionRefresh: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  suggestionRow: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  suggestionCard: {
    width: 220,
    backgroundColor: "rgba(32,29,25,0.04)",
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  suggestionCover: {
    width: "100%",
    height: 120,
  },
  suggestionContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  suggestionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
  },
  suggestionAuthor: {
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.sm,
    color: "rgba(32,29,25,0.6)",
  },
  suggestionReason: {
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.sm,
    color: "rgba(32,29,25,0.65)",
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  suggestionButton: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(32,29,25,0.2)",
    paddingVertical: theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionButtonAdded: {
    backgroundColor: "rgba(32,29,25,0.08)",
    borderColor: "rgba(32,29,25,0.08)",
  },
  suggestionButtonLabel: {
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.black,
  },
  suggestionButtonLabelAdded: {
    color: "rgba(32,29,25,0.6)",
  },
  suggestionEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  suggestionEmptyLabel: {
    fontFamily: theme.fonts.text,
    fontSize: theme.fontSizes.sm,
    color: "rgba(32,29,25,0.6)",
  },
});
