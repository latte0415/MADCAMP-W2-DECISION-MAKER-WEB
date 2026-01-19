import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import EventCreationModal from "../components/EventCreationModal";
import * as eventsApi from "../api/events";
import "../styles/homepage.css";
import "../styles/global.css";

function statusMeta(event_status) {
  switch (event_status) {
    case "NOT_STARTED":
      return { label: "대기", className: "status-pill status-waiting" };
    case "IN_PROGRESS":
      return { label: "진행 중", className: "status-pill status-progress" };
    case "PAUSED":
      return { label: "일시정지", className: "status-pill status-paused" };
    case "FINISHED":
      return { label: "완료", className: "status-pill status-finished" };
    default:
      return { label: event_status ?? "알 수 없음", className: "status-pill status-default" };
  }
}

function membershipBadgeMeta(membership_status) {
  switch (membership_status) {
    case "PENDING":
      return { label: "승인 대기 중", className: "badge badge-pending" };
    case "REJECTED":
      return { label: "거절됨", className: "badge badge-rejected" };
    default:
      return null; // ACCEPTED or others -> no badge
  }
}

function adminBadgeMeta(is_admin) {
  return is_admin ? { label: "관리자", className: "badge badge-admin" } : null;
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

export default function HomePage() {
  const navigate = useNavigate();
  const { accessToken, logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null); // for overview popup
  const [createOpen, setCreateOpen] = useState(false); // create popup placeholder
  const [joinOpen, setJoinOpen] = useState(false); // join popup placeholder

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return;
    setErrMsg("");
    try {
      const data = await eventsApi.listParticipatedEvents(accessToken);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrMsg(err?.message || "이벤트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // initial fetch
  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  // polling
  useEffect(() => {
    if (!accessToken) return;

    const POLL_MS = 4000; // adjust as needed
    const id = setInterval(() => {
      fetchEvents();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [accessToken, fetchEvents]);

  const emptyState = useMemo(() => !loading && !errMsg && events.length === 0, [loading, errMsg, events]);

  return (
    <div className="home-root">
      <header className="home-topbar">
        <div className="home-brand">Decision Maker</div>

        <div className="home-actions">
          <button className="dm-btn" onClick={logout}>
            로그아웃
          </button>
          <button className="dm-btn" onClick={() => setJoinOpen(true)}>
            참여하기
          </button>
          <button className="dm-btn" onClick={() => setCreateOpen(true)}>
            생성하기
          </button>
        </div>
      </header>

      <main className="home-main">
        {errMsg && <div className="home-error">{errMsg}</div>}
        {loading && <div className="home-loading">불러오는 중...</div>}

        {emptyState && <div className="home-empty">참가한 이벤트가 없습니다.</div>}

        <div className="event-list">
          {events.map((ev) => {
            const adminBadge = adminBadgeMeta(ev.is_admin);
            const membershipBadge = membershipBadgeMeta(ev.membership_status);
            const st = statusMeta(ev.event_status);

            return (
              <button
                key={ev.id}
                className="event-card"
                onClick={() => setSelectedEvent(ev)}
                type="button"
              >
                <div className="event-left">
                  <div className="event-title-row">
                    {adminBadge && <span className={adminBadge.className}>{adminBadge.label}</span>}
                    {membershipBadge && (
                      <span className={membershipBadge.className}>{membershipBadge.label}</span>
                    )}
                    <div className="event-title">{ev.decision_subject}</div>
                  </div>

                  <div className="event-sub">
                    <div>현재 참가 인원: {ev.participant_count}명</div>
                    <div>관리자: {ev.admin_name}</div>
                  </div>
                </div>

                <div className="event-right">
                  <div className={st.className}>{st.label}</div>
                  <div className="event-code">{ev.entrance_code}</div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Event overview placeholder */}
      <ModalShell
        open={!!selectedEvent}
        title="이벤트 상세 (Placeholder)"
        onClose={() => setSelectedEvent(null)}
      >
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
          <div style={{ marginBottom: 12 }}>
            여기에는 “이벤트 개요/참여자/상태/입장 코드” 등의 상세 UI가 들어갑니다.
          </div>
          <pre className="modal-pre">{JSON.stringify(selectedEvent, null, 2)}</pre>
        </div>
      </ModalShell>

      <EventCreationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false);
          // optionally refresh list later; for now just navigate
          navigate(`/event/${created.id}`, { replace: true });
        }}
      />

      {/* Join event placeholder */}
      <ModalShell open={joinOpen} title="이벤트 참여 (Placeholder)" onClose={() => setJoinOpen(false)}>
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
          입장 코드 입력/참여 요청 UI는 이후 구현. (현재는 UI 자리만 잡음)
        </div>
      </ModalShell>
    </div>
  );
}
