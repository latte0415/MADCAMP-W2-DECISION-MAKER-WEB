/**
 * 제안 관련 API 함수
 * 전제, 기준, 결론 제안 생성 및 상태 변경
 */
import { apiFetchAuth } from "./apiClient";

/**
 * 전제 제안 생성
 * @param {string} eventId - 이벤트 ID
 * @param {Object} payload - 제안 데이터
 * @param {string} payload.proposal_category - CREATION, MODIFICATION, DELETION
 * @param {string|null} payload.assumption_id - 전제 ID (생성 시 null)
 * @param {string|null} payload.proposal_content - 제안 내용 (삭제 시 null)
 * @param {string} payload.reason - 제안 이유
 * @returns {Promise<Object>} 생성된 제안 정보
 */
export function createAssumptionProposal(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/assumption-proposals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 기준 제안 생성
 * @param {string} eventId - 이벤트 ID
 * @param {Object} payload - 제안 데이터
 * @param {string} payload.proposal_category - CREATION, MODIFICATION, DELETION
 * @param {string|null} payload.criteria_id - 기준 ID (생성 시 null)
 * @param {string|null} payload.proposal_content - 제안 내용 (삭제 시 null)
 * @param {string} payload.reason - 제안 이유
 * @returns {Promise<Object>} 생성된 제안 정보
 */
export function createCriteriaProposal(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria-proposals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 결론 제안 생성
 * @param {string} eventId - 이벤트 ID
 * @param {string} criterionId - 기준 ID
 * @param {Object} payload - 제안 데이터
 * @param {string} payload.proposal_content - 결론 내용
 * @returns {Promise<Object>} 생성된 제안 정보
 */
export function createConclusionProposal(eventId, criterionId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!criterionId) throw new Error("criterionId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria/${criterionId}/conclusion-proposals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 전제 제안 상태 변경 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @param {Object} payload - 상태 변경 데이터
 * @param {string} payload.status - ACCEPTED 또는 REJECTED
 * @returns {Promise<Object>} 업데이트된 제안 정보
 */
export function updateAssumptionProposalStatus(eventId, proposalId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/assumption-proposals/${proposalId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * 기준 제안 상태 변경 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @param {Object} payload - 상태 변경 데이터
 * @param {string} payload.status - ACCEPTED 또는 REJECTED
 * @returns {Promise<Object>} 업데이트된 제안 정보
 */
export function updateCriteriaProposalStatus(eventId, proposalId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/criteria-proposals/${proposalId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * 결론 제안 상태 변경 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @param {Object} payload - 상태 변경 데이터
 * @param {string} payload.status - ACCEPTED 또는 REJECTED
 * @returns {Promise<Object>} 업데이트된 제안 정보
 */
export function updateConclusionProposalStatus(eventId, proposalId, payload) {
  if (!eventId) throw new Error("eventId is required");
  if (!proposalId) throw new Error("proposalId is required");
  return apiFetchAuth(`/v1/events/${eventId}/conclusion-proposals/${proposalId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
