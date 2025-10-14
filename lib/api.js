import Constants from "expo-constants";

function normalizeUrl(url) {
  return url.replace(/\/$/, "");
}

function extractHost(uri) {
  if (!uri) return null;
  try {
    const url = new URL(uri.includes("://") ? uri : `http://${uri}`);
    return url.hostname || null;
  } catch {
    return null;
  }
}

function resolveApiBase() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) {
    return normalizeUrl(configured);
  }

  const expoHostUri =
    Constants?.expoConfig?.hostUri ??
    Constants?.expoGoConfig?.hostUri ??
    Constants?.manifest?.debuggerHost ??
    Constants?.manifest2?.extra?.expoClient?.hostUri ??
    Constants?.debuggerHost ?? null;

  const hostFromExpo = extractHost(expoHostUri);
  if (hostFromExpo) {
    return normalizeUrl(`http://${hostFromExpo}:4000`);
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    return normalizeUrl(`${protocol}//${hostname}:4000`);
  }

  return "http://127.0.0.1:4000";
}

const API_BASE = resolveApiBase();

async function jsonRequest(path, options = {}) {
  const { method = "GET", body } = options;
  const init = {
    method,
    credentials: "include",
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    init.headers = {
      "Content-Type": "application/json",
    };
  }
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    console.warn("jsonRequest received non-JSON response", { path, contentType });
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn("jsonRequest failed to parse JSON", { path, error });
    return null;
  }
}

export async function fetchCurrentUser() {
  const data = await jsonRequest("/api/auth/me");
  return data?.user ?? null;
}

export async function signIn(username, password) {
  const data = await jsonRequest("/api/auth/sign-in", {
    method: "POST",
    body: { username, password },
  });
  return data?.user ?? null;
}

export async function signUp(username, password) {
  const data = await jsonRequest("/api/auth/sign-up", {
    method: "POST",
    body: { username, password },
  });
  return data?.user ?? null;
}

export async function signOut() {
  await jsonRequest("/api/auth/sign-out", { method: "POST" });
}

export async function resetPassword(username, currentPassword, newPassword) {
  await jsonRequest("/api/auth/reset-password", {
    method: "POST",
    body: {
      username,
      currentPassword,
      newPassword,
    },
  });
}

export async function fetchLibraryRecords() {
  const data = await jsonRequest("/api/library/records");
  return data ?? null;
}

export async function upsertBooks(payloads) {
  if (!payloads || payloads.length === 0) return;
  await jsonRequest("/api/library/books", {
    method: "POST",
    body: payloads,
  });
}

export async function addUserBook(bookId) {
  await jsonRequest("/api/library/user-books", {
    method: "POST",
    body: { bookId },
  });
}

export async function removeUserBook(bookId) {
  await jsonRequest(`/api/library/user-books/${bookId}`, {
    method: "DELETE",
  });
}

export async function fetchProgress(bookId) {
  const data = await jsonRequest(`/api/library/progress/${bookId}`);
  return data?.progress ?? null;
}

export async function saveProgress(bookId, payload) {
  await jsonRequest(`/api/library/progress/${bookId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function downloadBook(bookId) {
  const response = await fetch(`${API_BASE}/api/books/${bookId}/download`, {
    credentials: "include",
  });
  return response.arrayBuffer();
}
