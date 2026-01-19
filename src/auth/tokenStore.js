// src/auth/tokenStore.js
let accessToken = null;

// Dedup concurrent refreshes
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getRefreshPromise() {
  return refreshPromise;
}

export function setRefreshPromise(p) {
  refreshPromise = p;
}
