/**
 * 제안 관리자 액션 컴포넌트
 * 제안 승인/거부 기능 (관리자용)
 */
import React, { useState } from "react";
import * as proposalsApi from "../../api/proposals";
import { ErrorDisplay, getErrorMessage } from "../common/ErrorDisplay";

/**
 * 제안 관리자 액션 버튼
 * @param {string} eventId - 이벤트 ID
 * @param {string} proposalId - 제안 ID
 * @param {string} proposalType - 제안 타입 (assumption, criteria, conclusion)
 * @param {string} currentStatus - 현재 제안 상태
 * @param {Function} onStatusChange - 상태 변경 성공 핸들러
 */
export function ProposalAdminActions({ eventId, proposalId, proposalType, currentStatus, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // PENDING 상태가 아니면 버튼 표시 안 함
  if (currentStatus !== "PENDING") {
    return null;
  }

  const handleStatusChange = async (status) => {
    if (!eventId || !proposalId) return;

    setLoading(true);
    setError("");

    try {
      let result;
      const payload = { status };

      switch (proposalType) {
        case "assumption":
          result = await proposalsApi.updateAssumptionProposalStatus(eventId, proposalId, payload);
          break;
        case "criteria":
          result = await proposalsApi.updateCriteriaProposalStatus(eventId, proposalId, payload);
          break;
        case "conclusion":
          result = await proposalsApi.updateConclusionProposalStatus(eventId, proposalId, payload);
          break;
        default:
          throw new Error("Unknown proposal type");
      }

      onStatusChange?.(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proposal-admin-actions">
      {error && (
        <ErrorDisplay message={error} dismissible onDismiss={() => setError("")} />
      )}
      <div className="proposal-admin-buttons">
        <button
          type="button"
          className="dm-btn dm-btn--sm dm-btn--success"
          onClick={() => handleStatusChange("ACCEPTED")}
          disabled={loading}
        >
          {loading ? "처리 중..." : "승인"}
        </button>
        <button
          type="button"
          className="dm-btn dm-btn--sm dm-btn--danger"
          onClick={() => handleStatusChange("REJECTED")}
          disabled={loading}
        >
          {loading ? "처리 중..." : "거부"}
        </button>
      </div>
    </div>
  );
}
