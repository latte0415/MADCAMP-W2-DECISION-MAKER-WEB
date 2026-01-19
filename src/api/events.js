import { apiFetch } from "./apiClient";

// GET /v1/events/participated (Bearer required)
export function listParticipatedEvents(accessToken) {
  return apiFetch("/v1/events/participated", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// POST /v1/events (Bearer required)
export function createEvent(accessToken, payload) {
  return apiFetch("/v1/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
}

// POST /v1/events/entrance-code/check
export function checkEntranceCode(accessToken, entrance_code) {
  return apiFetch("/v1/events/entrance-code/check", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ entrance_code }),
  });
}

// GET /v1/events/entrance-code/generate
export function generateEntranceCode(accessToken) {
  return apiFetch("/v1/events/entrance-code/generate", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}