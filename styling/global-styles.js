import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({

  // Full App
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
    padding: theme.spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.offwhite,
  },
  form: {
    width: "80%",
    maxWidth: 420,
    alignSelf: "center",
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeight.semiBold,
    marginBottom: theme.spacing.md,
    textAlign: "center",
    color: theme.colors.black,
  },
  hero: {
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
    color: theme.colors.black,
  },
  subtitle: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.black,
    textAlign: "center",
  },
  formStatus: {
    textAlign: "center",
    color: theme.colors.black,
    marginTop: theme.spacing.sm,
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
  button: {
    backgroundColor: theme.colors.teal,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginVertical: theme.spacing.sm,
  },
  authActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  authActionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm / 2,
  },
  buttonLabel: {
    color: theme.colors.offwhite,
    fontWeight: theme.fontWeight.semiBold,
    fontSize: theme.fontSizes.md,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.black,
    opacity: 0.7,
  },
  buttonAlt: {
    backgroundColor: theme.colors.teal,
    marginLeft: theme.spacing.sm,
  },
  buttonMuted: {
    backgroundColor: theme.colors.black,
  },
  linkButton: {
    alignSelf: "center",
    marginTop: theme.spacing.sm,
  },
  linkButtonLabel: {
    color: theme.colors.teal,
    fontWeight: theme.fontWeight.semiBold,
  },

  header: {
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
  browseButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.teal,
    borderRadius: theme.borderRadius.md,
  },
  browseText: {
    color: theme.colors.offwhite,
    fontWeight: theme.fontWeight.semiBold,
  },


  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeight.semiBold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.black,
    fontFamily: theme.fonts.subheading
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
  recommendationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
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
  modalImage: {
    width: 160,
    height: 220,
    borderRadius: theme.borderRadius.md,
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
    color: theme.colors.black,
  },
  modalAuthor: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  modalBlurb: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  searchHeaderContainer: {
    backgroundColor: theme.colors.offwhite,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.md,
  },
  searchHeaderText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeight.semiBold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.black,
  },
  searchInput: {
    backgroundColor: theme.colors.offwhite,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.black,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
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
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: theme.spacing.md,
  },
  createListButton: {
    marginBottom: theme.spacing.md,
  },
  modalScroll: {
    maxHeight: 300,
    marginBottom: theme.spacing.md,
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
  groupsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  groupButton: {
    alignSelf: "center",
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
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
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  searchScroll: {
    paddingBottom: theme.spacing.lg,
  },
  searchHeaderTall: {
    minHeight: 140,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
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
  searchEmpty: {
    textAlign: "center",
    marginTop: theme.spacing.lg,
    color: theme.colors.black,
  },
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

  // Navigation styling
  navigation: {
    tabBar: {
      backgroundColor: theme.colors.offwhite,
      borderTopColor: theme.colors.offwhite,
      borderTopWidth: 1,
      height: 60,
    },
    tabBarLabel: {
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeight.semiBold,
      marginBottom: 4,
    },
    tabBarLabelActive: {
      color: theme.colors.teal,
    },
    tabBarLabelInactive: {
      color: theme.colors.black,
    },
    tabBarIconContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    tabBarIconActive: {
      tintColor: theme.colors.teal,
    },
    tabBarIconInactive: {
      tintColor: theme.colors.black,
    },
  },

  // Group and Recc changes
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
    paddingVertical: theme.spacing.sm + 2, // ~10
    paddingHorizontal: theme.spacing.lg + 4, // ~20
    borderRadius: theme.borderRadius.xl, // 20+
    gap: theme.spacing.sm,
  },
  goButtonPressed: {
    backgroundColor: theme.colors.black, // fallback darker shade
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

  joinButton: {
    backgroundColor: theme.colors.coffee,
    paddingHorizontal: theme.spacing.xl + 6,
    paddingVertical: theme.spacing.md - 4, 
    borderRadius: theme.borderRadius.xl + 13, 
  },

  currentlyReadingSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.beige,
  },

  // sectionTitle: {
  //   fontSize: theme.fontSizes.sm + 2,
  //   fontWeight: theme.fontWeight.semiBold,
  //   letterSpacing: 1,
  //   color: theme.colors.black,
  //   marginBottom: theme.spacing.md,
  // },

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

  modalCloseButton: {
    marginTop: theme.spacing.sm,
  },

  openChatButton: {
    backgroundColor: theme.colors.teal,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  congratsModal: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 24,
  margin: 20,
  maxWidth: 340,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 5,
},
congratsTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 12,
  textAlign: 'center',
},
congratsText: {
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 20,
  lineHeight: 24,
  color: '#333',
},
});