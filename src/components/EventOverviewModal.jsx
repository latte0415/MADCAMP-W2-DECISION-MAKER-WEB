import React, { useEffect, useMemo } from "react";

function statusMeta(event_status) {
  switch (event_status) {
    case "NOT_STARTED":
      return { label: "대기 중", className: "status-pill status-pill--long status-waiting" };
    case "IN_PROGRESS":
      return { label: "진행 중", className: "status-pill status-pill--long status-progress" };
    case "PAUSED":
      return { label: "일시정지", className: "status-pill status-pill--long status-paused" };
    case "FINISHED":
      return { label: "완료", className: "status-pill status-pill--long status-finished" };
    default:
      return { label: event_status ?? "알 수 없음", className: "status-pill status-pill--long status-default" };
  }
}

function membershipMessage(membership_status) {
  switch (membership_status) {
    case "REJECTED":
      return "가입이 거절되었습니다.";
    case "PENDING":
      return "승인 대기 중입니다.";
    case "ACCEPTED":
      return "가입이 승인되었습니다.";
    default:
      return "가입 상태를 확인할 수 없습니다.";
  }
}

function Lines({ items }) {
  if (!items || items.length === 0) return <div className="eo-muted">-</div>;
  return (
    <ol className="eo-list">
      {items.map((s, idx) => (
        <li key={idx} className="eo-list-elt">{s}</li>
      ))}
    </ol>
  );
}

export default function EventOverviewModal({
  open,
  overview,       // response from GET /v1/events/{id}/overview
  loading,
  errorMsg,
  onClose,
  onEnter,
}) {
  if (!open) return null;

  const st = statusMeta(overview?.event?.event_status);
  const optionLines = useMemo(
    () => (overview?.options || []).map((o) => o?.content).filter(Boolean),
    [overview]
  );

  const enterEnabled = !!overview?.can_enter;
  const membershipMsg = membershipMessage(overview?.membership_status);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <div 
      className="modal-backdrop" 
      role="dialog" 
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="eo-card" onClick={(e) => e.stopPropagation()}>
        <button className="eo-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="eo-header-section">
          <h2 className="eo-header-title">이벤트 미리보기</h2>
        </div>

        <div className="eo-top">


          <div className="eo-main">
            <div className="eo-row">
              <div className="eo-label">주제 </div>
              <div className="eo-value">
                {loading ? <span className="eo-muted">불러오는 중...</span> : (overview?.event?.decision_subject ?? "-")}
              </div>
            </div>
            <div className="eo-divider" />
            <div className="eo-row">
              <div className="eo-label">선택지</div>
              <div className="eo-value">
                {loading ? <span className="eo-muted">불러오는 중...</span> : <Lines items={optionLines} />}
              </div>
            </div>
            <div className="eo-divider" />
            <div className="eo-row">
              <div className="eo-label">진행 상태</div>
              <div className="eo-value">
                {loading ? <span className="eo-muted">-</span> : <span className={st.className}>{st.label}</span>}
              </div>
            </div>
            <div className="eo-divider" />
            <div className="eo-row">
              <div className="eo-label">참가 인원</div>
              <div className="eo-value">
                {loading ? <span className="eo-muted">-</span> : `${overview?.participant_count ?? "-"}명`}
              </div>
            </div>
            <div className="eo-divider" />

            <div className="eo-row">
              <div className="eo-label">관리자</div>
              <div className="eo-value">
                {loading ? <span className="eo-muted">-</span> : (overview?.admin?.name ?? "-")}
              </div>
            </div>
            <div className="eo-divider" />

            <div className="eo-row">
              <div className="eo-label">입장 코드</div>
              <div className="eo-value">
                {loading ? <span className="eo-muted">-</span> : (overview?.event?.entrance_code ?? "-")}
              </div>
            </div>
            <div className="eo-divider" />

            <div className="eo-row">
              <div className="eo-label">가입 상태</div>
              <div className="eo-value">
                {loading ? <span className="eo-muted">-</span> : membershipMsg}
              </div>
            </div>
          </div>

          
        </div>

        {errorMsg && <div className="eo-error">{errorMsg}</div>}

        <div className="homepage-divider" />

        <div className="eo-bottom">
          <button
            className="dm-btn eo-enter-btn"
            onClick={onEnter}
            disabled={!enterEnabled}
            type="button"
          >
            입장하기
          </button>
        </div>
      </div>
    </div>
  );
}
