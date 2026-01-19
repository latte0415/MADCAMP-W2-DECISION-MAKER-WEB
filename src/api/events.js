import { apiFetchAuth } from "./apiClient";

export function listParticipatedEvents() {
  return apiFetchAuth("/v1/events/participated", { method: "GET" });
}

export function createEvent(payload) {
  return apiFetchAuth("/v1/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkEntranceCode(entrance_code) {
  return apiFetchAuth("/v1/events/entrance-code/check", {
    method: "POST",
    body: JSON.stringify({ entrance_code }),
  });
}

export function generateEntranceCode() {
  return apiFetchAuth("/v1/events/entrance-code/generate", { method: "GET" });
}

export function enterEventByCode(entrance_code) {
  return apiFetchAuth("/v1/events/entry", {
    method: "POST",
    body: JSON.stringify({ entrance_code }),
  });
}

export function getEventOverview(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/overview`, { method: "GET" });
}

export function getEventDetail(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}`, { method: "GET" });
}