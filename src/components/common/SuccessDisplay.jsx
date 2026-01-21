/**
 * 성공 메시지 표시 컴포넌트
 */
import React, { useEffect } from "react";

/**
 * 성공 메시지 표시
 * @param {string} message - 성공 메시지
 * @param {number} [duration] - 자동으로 사라질 시간 (ms, 0이면 자동 사라짐 없음)
 * @param {Function} [onDismiss] - 닫기/사라질 때 호출할 콜백
 */
export function SuccessDisplay({ message, duration = 3000, onDismiss }) {
  if (!message) return null;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className="success-display" role="status">
      <div className="success-message">{message}</div>
      <button
        type="button"
        className="success-dismiss"
        onClick={onDismiss}
        aria-label="성공 메시지 닫기"
      >
        ×
      </button>
    </div>
  );
}
