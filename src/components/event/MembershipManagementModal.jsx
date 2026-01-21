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
  const [sortField, setSortField] = useState(null); // 'status' | 'created_at' | 'joined_at'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

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
      setSortField(null);
      setSortDirection('asc');
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
        const status = err?.status;
        const message = err?.message || err?.data?.detail || err?.data?.message || "";
        const messageLower = message.toLowerCase();
        
        // 최대 인원 초과 에러 처리 (400 에러이고 관련 키워드가 있으면)
        if (status === 400 && (messageLower.includes("최대 인원") || messageLower.includes("max") || messageLower.includes("capacity") || messageLower.includes("full") || messageLower.includes("member") || messageLower.includes("exceed") || messageLower.includes("limit"))) {
          setError("최대 인원을 초과하여 승인할 수 없습니다.");
        } else if (status === 400) {
          // 400 에러인데 메시지가 없거나 일반적인 경우
          setError("승인할 수 없습니다. 최대 인원을 확인해주세요.");
        } else {
          setError(getErrorMessage(err));
        }
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
      const result = await membershipsApi.bulkApproveMemberships(eventId);
      // 목록 새로고침
      const data = await membershipsApi.listMemberships(eventId);
      setMemberships(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
      
      // 실패한 승인이 있는 경우 알림 표시
      if (result?.failed_count && result.failed_count > 0) {
        const approvedCount = result?.approved_count || 0;
        const failedCount = result.failed_count;
        setError(`${approvedCount}명이 승인되었습니다. ${failedCount}명은 최대 인원 초과로 승인되지 못했습니다.`);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      const status = err?.status;
      const message = err?.message || err?.data?.detail || err?.data?.message || "";
      const messageLower = message.toLowerCase();
      
      // 최대 인원 초과 에러 처리 (400 에러이고 관련 키워드가 있으면)
      if (status === 400 && (messageLower.includes("최대 인원") || messageLower.includes("max") || messageLower.includes("capacity") || messageLower.includes("full") || messageLower.includes("member") || messageLower.includes("exceed") || messageLower.includes("limit"))) {
        setError("최대 인원을 초과하여 일괄 승인할 수 없습니다.");
      } else if (status === 400) {
        // 400 에러인데 메시지가 없거나 일반적인 경우
        setError("일괄 승인할 수 없습니다. 최대 인원을 확인해주세요.");
      } else {
        setError(getErrorMessage(err));
      }
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
      const result = await membershipsApi.bulkRejectMemberships(eventId);
      // 목록 새로고침
      const data = await membershipsApi.listMemberships(eventId);
      setMemberships(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
      
      // 실패한 거부가 있는 경우 알림 표시 (API 스펙에 failed_count가 있으면)
      if (result?.failed_count && result.failed_count > 0) {
        const rejectedCount = result?.rejected_count || 0;
        const failedCount = result.failed_count;
        setError(`${rejectedCount}명이 거부되었습니다. ${failedCount}명은 거부되지 못했습니다.`);
      } else {
        onSuccess?.();
      }
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

  // 정렬 함수
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 멤버십 목록
  const sortedMemberships = [...memberships].sort((a, b) => {
    if (!sortField) return 0;
    
    let aVal, bVal;
    switch (sortField) {
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      case 'created_at':
        aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
        bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      case 'joined_at':
        aVal = a.joined_at ? new Date(a.joined_at).getTime() : 0;
        bVal = b.joined_at ? new Date(b.joined_at).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (sortField === 'status') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  // PENDING 상태인 멤버십만 필터링
  const pendingMemberships = memberships.filter((m) => m.status === "PENDING");
  const hasPending = pendingMemberships.length > 0;

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const formatted = new Date(dateString).toLocaleString("ko-KR");
      // "오전" 또는 "오후" 앞에서 줄바꿈
      return formatted.replace(/\s(오전|오후)/, '\n$1');
    } catch {
      return dateString;
    }
  };

  if (!open) return null;

  return (
    <ModalShell 
      open={open} 
      title="멤버십 관리" 
      onClose={onClose}
      headerActions={
        hasPending ? (
          <>
            <button
              type="button"
              className="dm-btn dm-btn--sm dm-btn--success"
              onClick={handleBulkApprove}
              disabled={loading}
            >
              {loading ? "처리 중..." : "일괄 승인"}
            </button>
            <button
              type="button"
              className="dm-btn dm-btn--sm dm-btn--danger"
              onClick={handleBulkReject}
              disabled={loading}
            >
              {loading ? "처리 중..." : "일괄 거부"}
            </button>
          </>
        ) : null
      }
    >
      <div className="membership-modal-content" style={{marginTop: "-15px"}}>
        {loadingData && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <LoadingSpinner message="멤버십 정보를 불러오는 중..." />
          </div>
        )}

        {!loadingData && (
          <>
            {error && <ErrorDisplay message={error} dismissible onDismiss={() => setError("")} />}

            {!hasPending && memberships.length === 0 && (
              <div className="membership-empty">
                멤버십이 없습니다.
              </div>
            )}

            {memberships.length > 0 && (
              <>
                <div className="membership-table-header">
                  <div className="membership-table-col membership-table-col--name">이름</div>
                  <div 
                    className="membership-table-col membership-table-col--status sortable"
                    onClick={() => handleSort('status')}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    상태
                    {sortField === 'status' && (
                      <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                  <div 
                    className="membership-table-col membership-table-col--date sortable"
                    onClick={() => handleSort('created_at')}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    신청 일자
                    {sortField === 'created_at' && (
                      <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                  <div 
                    className="membership-table-col membership-table-col--date sortable"
                    onClick={() => handleSort('joined_at')}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    승인 일자
                    {sortField === 'joined_at' && (
                      <span className="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                  <div className="membership-table-col membership-table-col--actions">작업</div>
                </div>

                <div className="membership-list">
                  {sortedMemberships.map((membership) => (
                    <div key={membership.membership_id} className="membership-item">
                      <div className="membership-table-col membership-table-col--name">
                        <div className="membership-name-row">
                          {membership.is_admin && <span className="badge badge-admin">관리자</span>}
                          {membership.is_me && <span className="badge badge-me">나</span>}
                          <span className="membership-name">{membership.name || "-"}</span>
                        </div>
                        <div className="membership-email">{membership.email || "-"}</div>
                      </div>
                      <div className="membership-table-col membership-table-col--status">
                        <MembershipStatusBadge status={membership.status} />
                      </div>
                      <div className="membership-table-col membership-table-col--date">
                        {formatDate(membership.created_at)}
                      </div>
                      <div className="membership-table-col membership-table-col--date">
                        {membership.joined_at ? formatDate(membership.joined_at) : "-"}
                      </div>
                      <div className="membership-table-col membership-table-col--actions">
                        {membership.status === "PENDING" && (
                          <div className="membership-actions">
                            <button
                              type="button"
                              className="dm-btn dm-btn--xs dm-btn--success"
                              onClick={() => handleApprove(membership.membership_id)}
                              disabled={loading}
                            >
                              승인
                            </button>
                            <button
                              type="button"
                              className="dm-btn dm-btn--xs dm-btn--danger"
                              onClick={() => handleReject(membership.membership_id)}
                              disabled={loading}
                            >
                              거부
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}
