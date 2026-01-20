/**
 * 멤버십 관리 관련 API 함수 (관리자용)
 */
import { apiFetchAuth } from "./apiClient";

/**
 * 멤버십 목록 조회 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Array>} 멤버십 목록
 */
export function listMemberships(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/memberships`, { method: "GET" });
}

/**
 * 멤버십 승인 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @param {string} membershipId - 멤버십 ID
 * @returns {Promise<Object>} 승인 결과
 */
export function approveMembership(eventId, membershipId) {
  if (!eventId) throw new Error("eventId is required");
  if (!membershipId) throw new Error("membershipId is required");
  return apiFetchAuth(`/v1/events/${eventId}/memberships/${membershipId}/approve`, {
    method: "PATCH",
  });
}

/**
 * 멤버십 거부 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @param {string} membershipId - 멤버십 ID
 * @returns {Promise<Object>} 거부 결과
 */
export function rejectMembership(eventId, membershipId) {
  if (!eventId) throw new Error("eventId is required");
  if (!membershipId) throw new Error("membershipId is required");
  return apiFetchAuth(`/v1/events/${eventId}/memberships/${membershipId}/reject`, {
    method: "PATCH",
  });
}

/**
 * 멤버십 일괄 승인 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Object>} 일괄 승인 결과
 */
export function bulkApproveMemberships(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/memberships/bulk-approve`, {
    method: "POST",
  });
}

/**
 * 멤버십 일괄 거부 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Object>} 일괄 거부 결과
 */
export function bulkRejectMemberships(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/memberships/bulk-reject`, {
    method: "POST",
  });
}
