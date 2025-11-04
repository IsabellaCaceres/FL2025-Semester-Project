import { StyleSheet } from "react-native";
import { theme } from "./theme";

export default StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.offwhite,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.md,
    },
    modalContainer: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        zIndex: 1,
    },
    modalImage: {
        width: 160,
        height: 220,
        borderRadius: theme.borderRadius.md,
        alignSelf: "center",
        marginBottom: theme.spacing.md,
    },
    modalTitle: {
        fontSize: theme.fontSizes.qxl,
        fontWeight: theme.fontWeight.bold,
        textAlign: "left",
        marginBottom: theme.spacing.xs,
        color: theme.colors.offwhite,
        fontFamily: theme.fonts.heading
    },
    modalAuthor: {
        fontSize: theme.fontSizes.xl,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.offwhite,
        textAlign: "left",
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.md,
        fontFamily: theme.fonts.subheading
    },
    modalBlurb: {
        fontSize: theme.fontSizes.md,
        color: theme.colors.offwhite,
        textAlign: "center",
        marginBottom: theme.spacing.xl,
        fontFamily: theme.fonts.text,
    },
    modalButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: theme.spacing.md,
    },
    button: {
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
        fontSize: theme.fontSizes.xl,
        fontFamily: theme.fonts.subheading
    },
    buttonDisabled: {
        backgroundColor: theme.colors.black,
        opacity: 0.7,
    },
    buttonAlt: {
        backgroundColor: theme.colors.buttonOverlay,
        borderColor: theme.colors.offwhite,
        borderRadius: 8,
        borderWidth: 2,
        marginLeft: theme.spacing.sm,
        width: 300,
    },
    buttonClose:{
        // marginLeft: -30,
    },
    buttonToggle:{
        // marginRight: -30,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-start",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.bookOverlay,
    },
    buttonNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 0, 
        marginBottom: 20,
    },
    readButtonContainer: {
        height: 70, 
        alignSelf: 'center',
        justifyContent: 'center', 
    },
});