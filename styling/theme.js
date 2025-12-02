// theme.js
export const theme = {
  colors: {
    beige: "#E5D8C6",
    offwhite: "#FAF8F5", // Slightly cleaner/brighter than #F7EEE2
    white: "#FFFFFF",
    black: "#202124", // Google dark grey
    charcoal: "#3C4043",
    coffee: "#8E5C4E",
    teal: "#578888",
    grey: "#BDC1C6", // Google grey
    lightGrey: "#F1F3F4",
    darkgray: "#5F6368",
    bookOverlay: "rgba(32, 33, 36, 0.04)",
    buttonOverlay: "rgba(23, 22, 21, 0.05)",
    primary: "#202124",
    secondary: "#5F6368",
    accent: "#8E5C4E",
    error: "#D93025",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    txl: 40,
    qxl: 56
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  fontWeight: {
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
  },
  fonts: {
    heading: "Buenard",
    subheading: "Buenard",
    text: "Rokkitt",
    accent: "Rokkitt",
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    }
  }
};
