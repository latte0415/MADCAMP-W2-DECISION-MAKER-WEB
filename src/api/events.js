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

export function getEventSetting(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/setting`, { method: "GET" });
}

export function castAssumptionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/assumption-proposals/${proposalId}/votes`, { method: "POST" });
}

export function retrieveAssumptionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/assumption-proposals/${proposalId}/votes`, { method: "DELETE" });
}

export function castCriteriaVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria-proposals/${proposalId}/votes`, { method: "POST" });
}

export function retrieveCriteriaVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria-proposals/${proposalId}/votes`, { method: "DELETE" });
}

export function castConclusionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/conclusion-proposals/${proposalId}/votes`, { method: "POST" });
}

export function retrieveConclusionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/conclusion-proposals/${proposalId}/votes`, { method: "DELETE" });
}

export function createAssumptionProposal(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/assumption-proposals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createCriteriaProposal(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria-proposals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createConclusionProposal(eventId, criterionId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!criterionId) throw new Error("criterionId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria/${criterionId}/conclusion-proposals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listCriteriaComments(eventId, criterionId) {
  if (!eventId) throw new Error("eventId is required");
  if (!criterionId) throw new Error("criterionId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria/${criterionId}/comments`, { method: "GET" });
}

export function createCriteriaComment(eventId, criterionId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!criterionId) throw new Error("criterionId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria/${criterionId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}