/**
 * 에러 표시 컴포넌트
 */
import React from "react";

/**
 * 에러 메시지 표시
 * @param {string} message - 에러 메시지
 * @param {boolean} [dismissible] - 닫기 버튼 표시 여부
 * @param {Function} [onDismiss] - 닫기 버튼 클릭 핸들러
 */
export function ErrorDisplay({ message, dismissible = false, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-display" role="alert">
      <div className="error-message">{message}</div>
      {dismissible && (
        <button
          type="button"
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="에러 메시지 닫기"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * HTTP 상태 코드에 따른 사용자 친화적인 에러 메시지 변환
 * @param {Error} error - 에러 객체
 * @returns {string} 사용자 친화적인 메시지
 */
export function getErrorMessage(error) {
  if (!error) return "알 수 없는 오류가 발생했습니다.";

  const status = error.status || error.response?.status;
  const message = error.message || error.response?.data?.detail || error.response?.data?.message;

  // HTTP 상태 코드별 메시지
  if (status === 400) {
    return message || "잘못된 요청입니다. 입력 내용을 확인해주세요.";
  }
  if (status === 401) {
    return "인증이 필요합니다. 다시 로그인해주세요.";
  }
  if (status === 403) {
    return message || "권한이 없습니다.";
  }
  if (status === 404) {
    return message || "요청한 리소스를 찾을 수 없습니다.";
  }
  if (status === 409) {
    return message || "충돌이 발생했습니다. 다시 시도해주세요.";
  }
  if (status === 500) {
    return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
  if (status === 502) {
    return "서버 연결에 실패했습니다. 네트워크를 확인해주세요.";
  }

  // 네트워크 오류
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.";
  }

  return message || "알 수 없는 오류가 발생했습니다.";
}
