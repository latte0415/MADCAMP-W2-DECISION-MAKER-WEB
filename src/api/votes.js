/**
 * 투표 관련 API 함수
 * 제안 투표 및 최종 투표
 */
import { apiFetchAuth } from "./apiClient";

/**
 * 전제 제안 투표 생성
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @returns {Promise<Object>} 투표 결과
 */
export function castAssumptionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/assumption-proposals/${proposalId}/votes`, {
    method: "POST",
  });
}

/**
 * 전제 제안 투표 삭제
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @returns {Promise<Object>} 투표 결과
 */
export function retrieveAssumptionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/assumption-proposals/${proposalId}/votes`, {
    method: "DELETE",
  });
}

/**
 * 기준 제안 투표 생성
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @returns {Promise<Object>} 투표 결과
 */
export function castCriteriaVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria-proposals/${proposalId}/votes`, {
    method: "POST",
  });
}

/**
 * 기준 제안 투표 삭제
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @returns {Promise<Object>} 투표 결과
 */
export function retrieveCriteriaVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria-proposals/${proposalId}/votes`, {
    method: "DELETE",
  });
}

/**
 * 결론 제안 투표 생성
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @returns {Promise<Object>} 투표 결과
 */
export function castConclusionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/conclusion-proposals/${proposalId}/votes`, {
    method: "POST",
  });
}

/**
 * 결론 제안 투표 삭제
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @returns {Promise<Object>} 투표 결과
 */
export function retrieveConclusionVote(eventId, proposalId) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/conclusion-proposals/${proposalId}/votes`, {
    method: "DELETE",
  });
}

/**
 * 본인 투표 내역 조회
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Object>} 투표 내역
 */
export function getMyVote(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/votes/me`, { method: "GET" });
}

/**
 * 투표 생성/업데이트 (최종 투표)
 * @param {string} eventId - 이벤트 ID
 * @param {Object} payload - 투표 데이터
 * @param {string} payload.option_id - 선택한 옵션 ID
 * @param {string[]} payload.criterion_ids - 기준 ID 배열 (우선순위 순서)
 * @returns {Promise<Object>} 투표 결과
 */
export function createOrUpdateVote(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/votes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 투표 결과 조회
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Object>} 투표 결과 통계
 */
export function getVoteResult(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/votes/result`, { method: "GET" });
}
