/**
 * 상태 배지 컴포넌트
 * 이벤트 상태, 멤버십 상태 등을 표시합니다.
 */
import React from "react";

/**
 * 이벤트 상태 배지
 * @param {string} status - 이벤트 상태 (NOT_STARTED, IN_PROGRESS, PAUSED, FINISHED)
 * @param {string} [variant] - 스타일 변형 (long, short 등)
 */
export function EventStatusBadge({ status, variant = "short" }) {
  const statusConfig = {
    NOT_STARTED: { label: variant === "long" ? "대기 중" : "대기", className: "status-pill status-waiting" },
    IN_PROGRESS: { label: variant === "long" ? "진행 중" : "진행", className: "status-pill status-progress" },
    PAUSED: { label: variant === "long" ? "일시정지" : "일시정지", className: "status-pill status-paused" },
    FINISHED: { label: variant === "long" ? "완료" : "완료", className: "status-pill status-finished" },
  };

  const config = statusConfig[status] || { label: status ?? "알 수 없음", className: "status-pill status-default" };
  const className = variant === "long" ? `${config.className} status-pill--long` : config.className;

  return <div className={className}>{config.label}</div>;
}

/**
 * 멤버십 상태 배지
 * @param {string} status - 멤버십 상태 (PENDING, ACCEPTED, REJECTED)
 */
export function MembershipStatusBadge({ status }) {
  const statusConfig = {
    PENDING: { label: "승인 대기 중", className: "badge badge-pending" },
    REJECTED: { label: "거절됨", className: "badge badge-rejected" },
    ACCEPTED: null, // ACCEPTED는 배지 표시 안 함
  };

  const config = statusConfig[status];
  if (!config) return null;

  return <span className={config.className}>{config.label}</span>;
}

/**
 * 관리자 배지
 * @param {boolean} isAdmin - 관리자 여부
 */
export function AdminBadge({ isAdmin }) {
  if (!isAdmin) return null;
  return <span className="badge badge-admin">관리자</span>;
}

/**
 * 제안 상태 배지
 * @param {string} status - 제안 상태 (PENDING, ACCEPTED, REJECTED, DELETED)
 */
export function ProposalStatusBadge({ status }) {
  const statusConfig = {
    PENDING: { label: "대기 중", className: "badge badge-pending" },
    ACCEPTED: { label: "승인됨", className: "badge badge-accepted" },
    REJECTED: { label: "거부됨", className: "badge badge-rejected" },
    DELETED: { label: "삭제됨", className: "badge badge-deleted" },
  };

  const config = statusConfig[status];
  if (!config) return null;

  return <span className={config.className}>{config.label}</span>;
}
