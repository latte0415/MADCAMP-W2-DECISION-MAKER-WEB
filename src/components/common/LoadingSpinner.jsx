/**
 * 로딩 스피너 컴포넌트
 */
import React from "react";

/**
 * 로딩 스피너
 * @param {string} [size] - 크기 (sm, md, lg)
 * @param {string} [message] - 로딩 메시지
 */
export function LoadingSpinner({ size = "md", message }) {
  const sizeClass = `spinner--${size}`;

  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClass}`} aria-label="로딩 중">
        <div className="spinner-circle"></div>
      </div>
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
}

/**
 * 인라인 로딩 스피너 (텍스트 옆에 작게 표시)
 */
export function InlineSpinner() {
  return <span className="inline-spinner" aria-label="로딩 중">⋯</span>;
}
