import { StyleSheet } from "react-native";
import { theme } from "./theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.offwhite,
  },
  listContent: {
    paddingVertical: 8,
  },
  messageWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageFromMe: {
    backgroundColor: theme.colors.black,
    alignSelf: "flex-end",
  },
  messageFromOther: {
    backgroundColor: theme.colors.offwhite,
    alignSelf: "flex-start",
  },
  username: {
    fontWeight: "600",
    fontSize: 12,
    marginBottom: 2,
  },
  usernameFromMe: {
    color: theme.colors.offwhite,
  },
  usernameFromOther: {
    color: "#333",
  },
  messageTextFromMe: {
    color: theme.colors.offwhite,
  },
  messageTextFromOther: {
    color: theme.colors.black,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.offwhite,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.offwhite,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: theme.colors.black,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendButtonText: {
    color: theme.colors.offwhite,
    fontWeight: "600",
  },
});

export default styles;
