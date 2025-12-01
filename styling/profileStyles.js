// styling/profileStyles.js
import { theme } from "./theme";

export const profileStyles = {
  container: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.xl,
    backgroundColor: "white",
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFE4B5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "700",
    color: theme.colors.darkgray,
  },
  displayName: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.black,
    marginBottom: theme.spacing.lg,
  },
  achievementBox: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.darkgray,
    marginBottom: theme.spacing.xs,
  },
  achievementMessage: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: "center",
  },
  menuSection: {
    backgroundColor: "white",
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightgray,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  menuItemLabel: {
    fontSize: 16,
    color: theme.colors.black,
  },
  menuItemLabelDanger: {
    color: "#e74c3c",
  },
  badge: {
    backgroundColor: theme.colors.black,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.black,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.gray,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightgray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.black,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.colors.gray,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.darkgray,
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.lightgray,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.black,
    backgroundColor: theme.colors.offwhite,
  },
  modalNote: {
    fontSize: 14,
    color: theme.colors.gray,
    textAlign: "center",
    fontStyle: "italic",
  },
};