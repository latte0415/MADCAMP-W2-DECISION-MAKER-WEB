import { apiFetch } from "./apiClient";

// POST /api/auth/login
export function loginWithEmail(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// POST /api/auth/signup
export function signupWithEmail(email, password) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// POST /api/auth/refresh (uses refresh_token cookie)
export function refreshToken() {
  return apiFetch("/auth/refresh", { method: "POST" });
}

// POST /api/auth/logout
export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

// GET /api/auth/me (Bearer access token)
export function me(accessToken) {
  return apiFetch("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// POST /api/auth/google (frontend sends Google ID token)
export function loginWithGoogleIdToken(id_token) {
  return apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token }),
  });
}
