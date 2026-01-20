// src/api/apiClient.js
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getRefreshPromise,
  setRefreshPromise,
} from "../auth/tokenStore";
import { getIdempotencyKey } from "../utils/idempotency";

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
// Idempotency-Key를 자동으로 추가합니다
export async function apiFetchAuth(path, options = {}) {
  const url = buildUrl(path);
  const method = options.method || "GET";

  const token = getAccessToken();
  
  // Idempotency-Key 확인 및 추가
  const idempotencyKey = getIdempotencyKey(
    url,
    method,
    options.idempotencyKey || options.headers?.["Idempotency-Key"]
  );

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
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
    if (!res.ok) {
      // 409 Conflict 에러 처리 (Idempotency key reused 등)
      if (res.status === 409) {
        const detail = data?.detail || "";
        if (detail.includes("Idempotency key reused")) {
          const err = new Error("이미 처리된 요청입니다. 다른 요청에 같은 키를 사용할 수 없습니다.");
          err.status = 409;
          err.data = data;
          throw err;
        } else if (detail.includes("Request in progress")) {
          const err = new Error("요청이 처리 중입니다. 잠시 후 다시 시도해주세요.");
          err.status = 409;
          err.data = data;
          throw err;
        }
      }
      throwHttpError(res, data);
    }
    return data;
  }

  // prevent infinite loops
  if (options._retried) {
    const data = await parseJsonSafe(res);
    throwHttpError(res, data);
  }

  // refresh + retry once (같은 Idempotency-Key 유지)
  const newToken = await refreshAccessToken();

  res = await fetch(url, {
    credentials: "include",
    ...options,
    _retried: true,
    headers: {
      ...headers,
      Authorization: `Bearer ${newToken}`,
      // 재시도 시 같은 Idempotency-Key 사용
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    // 409 Conflict 에러 처리
    if (res.status === 409) {
      const detail = data?.detail || "";
      if (detail.includes("Idempotency key reused")) {
        const err = new Error("이미 처리된 요청입니다. 다른 요청에 같은 키를 사용할 수 없습니다.");
        err.status = 409;
        err.data = data;
        throw err;
      } else if (detail.includes("Request in progress")) {
        const err = new Error("요청이 처리 중입니다. 잠시 후 다시 시도해주세요.");
        err.status = 409;
        err.data = data;
        throw err;
      }
    }
    throwHttpError(res, data);
  }
  return data;
}
