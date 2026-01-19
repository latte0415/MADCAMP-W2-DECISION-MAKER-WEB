import { apiFetch, apiFetchAuth } from "./apiClient";

export function loginWithEmail(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginWithGoogleIdToken(id_token) {
    return apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token }),
  });
}

export function signupWithEmail(email, password) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refreshToken() {
  return apiFetch("/auth/refresh", { method: "POST" });
}

export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

export function me() {
  return apiFetchAuth("/auth/me", { method: "GET" });
}

export function updateMyName(name) {
  return apiFetchAuth("/auth/me/name", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}
