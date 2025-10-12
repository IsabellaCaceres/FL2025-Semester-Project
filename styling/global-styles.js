// global-styles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  browseButton: {
    padding: 8,
    backgroundColor: "#4B9CD3",
    borderRadius: 8,
  },
  browseText: { color: "#fff", fontWeight: "600" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  bookCard: { width: 140, alignItems: "center", marginRight: 12 },
  bookCover: { width: 120, height: 170, borderRadius: 8, marginBottom: 6 },
  bookTitle: { fontSize: 13, textAlign: "center" },
  recommendationsGrid: { flexDirection: "row", flexWrap: "wrap" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 6,
  },
  buttonLabel: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
