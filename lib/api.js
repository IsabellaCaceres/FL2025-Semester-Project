import Constants from "expo-constants";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

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

function parseUrl(input) {
  if (!input) return null;
  try {
    return new URL(input);
  } catch {
    try {
      return new URL(`http://${input}`);
    } catch {
      return null;
    }
  }
}

function buildBase(protocol, hostname, port) {
  const normalizedProtocol = protocol || "http:";
  const host = port ? `${hostname}:${port}` : hostname;
  return normalizeUrl(`${normalizedProtocol}//${host}`);
}

function resolveApiBase() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  const windowHostname =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : null;

  if (configured) {
    const parsedConfigured = parseUrl(configured);
    if (parsedConfigured) {
      if (
        windowHostname &&
        LOOPBACK_HOSTS.has(parsedConfigured.hostname) &&
        LOOPBACK_HOSTS.has(windowHostname) &&
        parsedConfigured.hostname !== windowHostname
      ) {
        return buildBase(parsedConfigured.protocol, windowHostname, parsedConfigured.port);
      }
      return buildBase(parsedConfigured.protocol, parsedConfigured.hostname, parsedConfigured.port);
    }
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
    return buildBase("http:", hostFromExpo, "4000");
  }

  if (windowHostname) {
    return buildBase(window.location.protocol, windowHostname, "4000");
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
  const data = await jsonRequest("/api/auth/reset-password", {
    method: "POST",
    body: {
      username,
      currentPassword,
      newPassword,
    },
  });
  return data ?? null;
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

export async function fetchLists() {
  const data = await jsonRequest("/api/lists");
  return data?.lists ?? [];
}

export async function createList(payload) {
  const data = await jsonRequest("/api/lists", {
    method: "POST",
    body: payload,
  });
  return data?.list ?? null;
}

export async function downloadBook(bookId) {
  const response = await fetch(`${API_BASE}/api/books/${bookId}/download`, {
    credentials: "include",
  });
  return response.arrayBuffer();
}

export async function semanticSearch(query, options = {}) {
  const { limit } = options;
  const body = { query };
  if (typeof limit === "number") body.limit = limit;
  const data = await jsonRequest("/api/search/semantic", {
    method: "POST",
    body,
  });
  return data ?? null;
}

export async function fetchSemanticRecommendations(limit) {
  const suffix =
    typeof limit === "number" ? `?limit=${encodeURIComponent(limit)}` : "";
  const data = await jsonRequest(`/api/search/recommendations${suffix}`);
  return data?.results ?? [];
}
