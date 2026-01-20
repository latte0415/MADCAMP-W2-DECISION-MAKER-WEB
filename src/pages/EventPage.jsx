import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as eventsApi from "../api/events";
import AssumptionsSection from "../components/AssumptionSectionComponent";
import "../styles/eventpage.css";
import "../styles/global.css";
import "../styles/homepage.css"; // reuse dm-btn, modal-backdrop, status-pill classes

function statusMeta(event_status) {
  switch (event_status) {
    case "NOT_STARTED":
      return { label: "대기 중", className: "status-pill--long status-waiting" };
    case "IN_PROGRESS":
      return { label: "진행 중", className: "status-pill--long status-progress" };
    case "PAUSED":
      return { label: "일시정지", className: "status-pill--long status-paused" };
    case "FINISHED":
      return { label: "완료", className: "status-pill--long status-finished" };
    default:
      return { label: event_status ?? "알 수 없음", className: "status-pill--long status-default" };
  }
}


function ModalShell({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="dm-btn dm-btn--ghost" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [voteOpen, setVoteOpen] = useState(false);


  // Prevent overlapping polls
  const inFlightRef = useRef(false);

  const fetchDetail = useCallback(async () => {
    if (!eventId) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setErrMsg("");

    try {
      const data = await eventsApi.getEventDetail(eventId);
      const setting = await eventsApi.getEventSetting(eventId);
      setDetail(data);
      setSetting(setting);
    } catch (err) {
      setErrMsg(err?.message || "이벤트 정보를 불러오지 못했습니다.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [eventId]);

  // initial fetch on mount / eventId change
  useEffect(() => {
    setLoading(true);
    setDetail(null);
    fetchDetail();
  }, [fetchDetail]);

  // polling every 3 seconds
  useEffect(() => {
    if (!eventId) return;

    const POLL_MS = 3000;
    const id = setInterval(() => {
      fetchDetail();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [eventId, fetchDetail]);

  const st = useMemo(() => statusMeta(detail?.event_status), [detail]);

  const subject = detail?.decision_subject ?? "";
  const options = Array.isArray(detail?.options) ? detail.options : [];
  const autoByVotes = !!setting?.assumption_is_auto_approved_by_votes;
  const minVotes = Number.isFinite(setting?.assumption_min_votes_required)
    ? setting.assumption_min_votes_required
    : 0;

  return (
    <div className="event-root">
      <header className="event-topbar">
        <div className="event-brand">Decision Maker</div>

        <div className="event-actions">
          <div className={st.className}>{st.label}</div>

          <button className="dm-btn" type="button" onClick={() => navigate("/home")}>
            나가기
          </button>

          <button className="dm-btn" type="button" onClick={() => setVoteOpen(true)}>
            투표하기
          </button>
        </div>
      </header>

      <main className="event-main">
        {errMsg && <div className="event-error">{errMsg}</div>}

        <section className="event-section">
          <div className="event-section-title">기본 정보</div>

          <div className="event-info-card">
            <div className="event-info-row">
              <div className="event-info-label">주제</div>
              <div className="event-info-value">
                {loading ? <span className="event-muted">불러오는 중...</span> : (subject || "-")}
              </div>
            </div>
            <div className="ep-divider"/>

            <div className="event-info-row">
              <div className="event-info-label">선택지</div>
              <div className="event-info-value">
                {loading ? (
                  <span className="event-muted">불러오는 중...</span>
                ) : options.length === 0 ? (
                  <span className="event-muted">-</span>
                ) : (
                  <ol className="event-options">
                    {options.map((opt, i) => (
                      <li key={opt.id ?? i} className="event-option">
                        <span>{opt.content}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="event-section">
          <div className="event-section-head">
            <div className="event-section-title">전제</div>
            <button className="dm-btn dm-btn--sm" type="button" onClick={() => { /* TODO */ }}>
              추가하기
            </button>
          </div>


          <AssumptionsSection
            assumptions={detail?.assumptions}
            creationProposals={detail?.assumption_creation_proposals}
            autoByVotes={autoByVotes}
            minVotes={minVotes}
          />
        </section>
      </main>

      {/* Vote placeholder modal */}
      <ModalShell open={voteOpen} title="투표하기 (Placeholder)" onClose={() => setVoteOpen(false)}>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          여기에는 “투표하기” UI가 들어갑니다. (임시 Placeholder)
          <div style={{ marginTop: 10 }} />
          <pre className="modal-pre">{JSON.stringify(detail, null, 2)}</pre>
        </div>
      </ModalShell>
    </div>
  );
}
