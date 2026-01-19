// src/api/apiClient.js
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getRefreshPromise,
  setRefreshPromise,
} from "../auth/tokenStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

function buildUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJsonSafe(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (!isJson) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function throwHttpError(res, data) {
  const message = data?.detail || data?.message || `HTTP ${res.status}`;
  const err = new Error(message);
  err.status = res.status;
  err.data = data;
  throw err;
}

// Existing (public/basic) fetch
export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);

  const res = await fetch(url, {
    credentials: "include", // refresh cookie
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) throwHttpError(res, data);
  return data;
}

// Internal: refresh access token once, deduped
async function refreshAccessToken() {
  const ACCESS_TOKEN_KEY = "access_token"; 
  const existing = getRefreshPromise();
  if (existing) return existing;

  const p = (async () => {
    // IMPORTANT: call refresh using apiFetch (no recursion)
    const data = await apiFetch("/auth/refresh", { method: "POST" });

    const newToken = data?.access_token

    if (!newToken) {
      clearAccessToken();
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      const err = new Error("Refresh succeeded but no access token returned");
      err.status = 401;
      throw err;
    }

    setAccessToken(newToken);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    return newToken;
  })().finally(() => {
    setRefreshPromise(null);
  });

  setRefreshPromise(p);
  return p;
}

// Authenticated fetch: attaches Bearer, refreshes on 401, retries once
export async function apiFetchAuth(path, options = {}) {
  const url = buildUrl(path);

  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // attempt 1
  let res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  // normal success/failure (non-401)
  if (res.status !== 401) {
    const data = await parseJsonSafe(res);
    if (!res.ok) throwHttpError(res, data);
    return data;
  }

  // prevent infinite loops
  if (options._retried) {
    const data = await parseJsonSafe(res);
    throwHttpError(res, data);
  }

  // refresh + retry once
  const newToken = await refreshAccessToken();

  res = await fetch(url, {
    credentials: "include",
    ...options,
    _retried: true,
    headers: {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    },
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) throwHttpError(res, data);
  return data;
}
