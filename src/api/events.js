/**
 * 이벤트 기본 정보 관련 API 함수
 */
import { apiFetchAuth } from "./apiClient";

/**
 * 참가한 이벤트 목록 조회
 * @returns {Promise<Array>} 이벤트 목록
 */
export function listParticipatedEvents() {
  return apiFetchAuth("/v1/events/participated", { method: "GET" });
}

/**
 * 이벤트 생성
 * @param {Object} payload - 이벤트 생성 데이터
 * @returns {Promise<Object>} 생성된 이벤트 정보
 */
export function createEvent(payload) {
  return apiFetchAuth("/v1/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 입장 코드 중복 확인
 * @param {string} entrance_code - 입장 코드
 * @returns {Promise<Object>} 사용 가능 여부
 */
export function checkEntranceCode(entrance_code) {
  return apiFetchAuth("/v1/events/entrance-code/check", {
    method: "POST",
    body: JSON.stringify({ entrance_code }),
  });
}

/**
 * 랜덤 입장 코드 생성
 * @returns {Promise<Object>} 생성된 코드
 */
export function generateEntranceCode() {
  return apiFetchAuth("/v1/events/entrance-code/generate", { method: "GET" });
}

/**
 * 이벤트 입장 (코드로 참가)
 * @param {string} entrance_code - 입장 코드
 * @returns {Promise<Object>} 참가 결과
 */
export function enterEventByCode(entrance_code) {
  return apiFetchAuth("/v1/events/entry", {
    method: "POST",
    body: JSON.stringify({ entrance_code }),
  });
}

/**
 * 이벤트 오버뷰 정보 조회
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Object>} 오버뷰 정보
 */
export function getEventOverview(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/overview`, { method: "GET" });
}

/**
 * 이벤트 상세 조회
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Object>} 이벤트 상세 정보
 */
export function getEventDetail(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}`, { method: "GET" });
}

/**
 * 이벤트 설정 조회 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @returns {Promise<Object>} 이벤트 설정 정보
 */
export function getEventSetting(eventId) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/setting`, { method: "GET" });
}

/**
 * 이벤트 설정 수정 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @param {Object} payload - 수정할 설정 데이터
 * @returns {Promise<Object>} 수정된 이벤트 정보
 */
export function updateEvent(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * 이벤트 상태 변경 (관리자용)
 * @param {string} eventId - 이벤트 ID
 * @param {Object} payload - 상태 변경 데이터
 * @param {string} payload.status - 변경할 상태 (NOT_STARTED, IN_PROGRESS, PAUSED, FINISHED)
 * @returns {Promise<Object>} 업데이트된 이벤트 정보
 */
export function updateEventStatus(eventId, payload) {
  if (!eventId) throw new Error("eventId is required");
  return apiFetchAuth(`/v1/events/${eventId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}