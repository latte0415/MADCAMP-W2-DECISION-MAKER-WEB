/**
 * 멤버십 관리 모달 컴포넌트 (관리자용)
 */
import React, { useCallback, useEffect, useState } from "react";
import ModalShell from "../ModalShell";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay, getErrorMessage } from "../common/ErrorDisplay";
import { MembershipStatusBadge } from "../common/StatusBadge";
import * as membershipsApi from "../../api/memberships";
import "../../styles/membershipmodal.css";

/**
 * 멤버십 관리 모달
 * @param {boolean} open - 모달 열림 여부
 * @param {string} eventId - 이벤트 ID
 * @param {Function} onClose - 모달 닫기 핸들러
 * @param {Function} onSuccess - 멤버십 변경 성공 핸들러
 */
export default function MembershipManagementModal({ open, eventId, onClose, onSuccess }) {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 멤버십 목록 불러오기
  useEffect(() => {
    if (!open || !eventId) return;

    let alive = true;
    setLoadingData(true);
    setError("");

    (async () => {
      try {
        const data = await membershipsApi.listMemberships(eventId);
        if (alive) {
          setMemberships(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (alive) setError(getErrorMessage(err));
      } finally {
        if (alive) setLoadingData(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, eventId]);

  // Poll membership list when modal is open to show new join requests
  useEffect(() => {
    if (!open || !eventId) return;

    const POLL_MS = 1750;
    const id = setInterval(async () => {
      try {
        const data = await membershipsApi.listMemberships(eventId);
        setMemberships(prev => {
          // Only update if the membership list actually changed (new items, status changes)
          const prevJson = JSON.stringify(prev);
          const newJson = JSON.stringify(data);
          if (prevJson !== newJson) {
            return Array.isArray(data) ? data : [];
          }
          return prev;
        });
      } catch (err) {
        // Silently fail on polling errors
        console.error("Membership list poll failed:", err);
      }
    }, POLL_MS);

    return () => clearInterval(id);
  }, [open, eventId]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setMemberships([]);
      setSelectedIds(new Set());
      setError("");
    }
  }, [open]);

  // 개별 승인
  const handleApprove = useCallback(
    async (membershipId) => {
      if (!eventId || !membershipId) return;

      setLoading(true);
      setError("");

      try {
        await membershipsApi.approveMembership(eventId, membershipId);
        // 목록 새로고침
        const data = await membershipsApi.listMemberships(eventId);
        setMemberships(Array.isArray(data) ? data : []);
        onSuccess?.();
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [eventId, onSuccess]
  );

  // 개별 거부
  const handleReject = useCallback(
    async (membershipId) => {
      if (!eventId || !membershipId) return;

      setLoading(true);
      setError("");

      try {
        await membershipsApi.rejectMembership(eventId, membershipId);
        // 목록 새로고침
        const data = await membershipsApi.listMemberships(eventId);
        setMemberships(Array.isArray(data) ? data : []);
        onSuccess?.();
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [eventId, onSuccess]
  );

  // 일괄 승인
  const handleBulkApprove = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError("");

    try {
      await membershipsApi.bulkApproveMemberships(eventId);
      // 목록 새로고침
      const data = await membershipsApi.listMemberships(eventId);
      setMemberships(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, onSuccess]);

  // 일괄 거부
  const handleBulkReject = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError("");

    try {
      await membershipsApi.bulkRejectMemberships(eventId);
      // 목록 새로고침
      const data = await membershipsApi.listMemberships(eventId);
      setMemberships(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, onSuccess]);

  // 선택 토글
  const toggleSelection = useCallback((membershipId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(membershipId)) {
        next.delete(membershipId);
      } else {
        next.add(membershipId);
      }
      return next;
    });
  }, []);

  // PENDING 상태인 멤버십만 필터링
  const pendingMemberships = memberships.filter((m) => m.status === "PENDING");
  const hasPending = pendingMemberships.length > 0;

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("ko-KR");
    } catch {
      return dateString;
    }
  };

  if (!open) return null;

  return (
    <ModalShell open={open} title="멤버십 관리" onClose={onClose}>
      <div className="membership-modal-content" style={{marginTop: "-15px"}}>
        {loadingData && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <LoadingSpinner message="멤버십 정보를 불러오는 중..." />
          </div>
        )}

        {!loadingData && (
          <>
            {error && <ErrorDisplay message={error} dismissible onDismiss={() => setError("")} />}

            {hasPending && (
              <div className="membership-bulk-actions">
                <button
                  type="button"
                  className="dm-btn dm-btn--success"
                  onClick={handleBulkApprove}
                  disabled={loading}
                >
                  {loading ? "처리 중..." : "전체 승인"}
                </button>
                <button
                  type="button"
                  className="dm-btn dm-btn--danger"
                  onClick={handleBulkReject}
                  disabled={loading}
                >
                  {loading ? "처리 중..." : "전체 거부"}
                </button>
              </div>
            )}

            {!hasPending && (
              <div className="membership-empty">
                승인 대기 중인 멤버십이 없습니다.
              </div>
            )}

            <div className="membership-list">
              {memberships.map((membership) => (
                <div key={membership.membership_id} className="membership-item">
                  <div className="membership-info">
                    <div className="membership-name-row">
                      <span className="membership-name">{membership.name || "-"}</span>
                      <MembershipStatusBadge status={membership.status} />
                      {membership.is_admin && <span className="badge badge-admin">관리자</span>}
                      {membership.is_me && <span className="badge badge-me">나</span>}
                    </div>
                    <div className="membership-email">{membership.email || "-"}</div>
                    <div className="membership-dates">
                      <span>신청: {formatDate(membership.created_at)}</span>
                      {membership.joined_at && <span>승인: {formatDate(membership.joined_at)}</span>}
                    </div>
                  </div>

                  {membership.status === "PENDING" && (
                    <div className="membership-actions">
                      <button
                        type="button"
                        className="dm-btn dm-btn--sm dm-btn--success"
                        onClick={() => handleApprove(membership.membership_id)}
                        disabled={loading}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="dm-btn dm-btn--sm dm-btn--danger"
                        onClick={() => handleReject(membership.membership_id)}
                        disabled={loading}
                      >
                        거부
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="membership-modal-actions">
              <button type="button" className="dm-btn dm-btn--outline" onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
