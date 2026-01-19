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

export function requestPasswordReset(email) {
  return apiFetch("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset(token, new_password) {
  return apiFetch("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });
}

export function updateMyName(name, accessToken) {
  return apiFetch("/auth/me/name", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  });
}