/**
 * 코멘트 관련 API 함수
 */
import { apiFetchAuth } from "./apiClient";

/**
 * 기준에 대한 코멘트 수 조회
 * @param {string} eventId - 이벤트 ID
 * @param {string} criterionId - 기준 ID
 * @returns {Promise<Object>} 코멘트 수
 */
export function getCommentCount(eventId, criterionId) {
  if (!eventId) throw new Error("eventId is required");
  if (!criterionId) throw new Error("criterionId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria/${criterionId}/comments/count`, {
    method: "GET",
  });
}

/**
 * 기준에 대한 코멘트 목록 조회
 * @param {string} eventId - 이벤트 ID
 * @param {string} criterionId - 기준 ID
 * @returns {Promise<Array>} 코멘트 목록
 */
export function listCriteriaComments(eventId, criterionId) {
  if (!eventId) throw new Error("eventId is required");
  if (!criterionId) throw new Error("criterionId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria/${criterionId}/comments`, {
    method: "GET",
  });
}

/**
 * 코멘트 생성
 * @param {string} eventId - 이벤트 ID
 * @param {string} criterionId - 기준 ID
 * @param {Object} payload - 코멘트 데이터
 * @param {string} payload.content - 코멘트 내용
 * @returns {Promise<Object>} 생성된 코멘트 정보
 */
export function createCriteriaComment(eventId, criterionId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!criterionId) throw new Error("criterionId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria/${criterionId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 코멘트 수정
 * @param {string} eventId - 이벤트 ID
 * @param {string} commentId - 코멘트 ID
 * @param {Object} payload - 수정 데이터
 * @param {string} payload.content - 수정된 코멘트 내용
 * @returns {Promise<Object>} 수정된 코멘트 정보
 */
export function updateComment(eventId, commentId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!commentId) throw new Error("commentId is required");
  return apiFetchAuth(`/v1/events/${eventId}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * 코멘트 삭제
 * @param {string} eventId - 이벤트 ID
 * @param {string} commentId - 코멘트 ID
 * @returns {Promise<void>}
 */
export function deleteComment(eventId, commentId) {
  if (!eventId) throw new Error("eventId is required");
  if (!commentId) throw new Error("commentId is required");
  return apiFetchAuth(`/v1/events/${eventId}/comments/${commentId}`, {
    method: "DELETE",
  });
}
