import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import EventCreationModal from "../components/EventCreationModal";
import JoinEventModal from "../components/JoinEventModal";
import EventOverviewModal from "../components/EventOverviewModal";
import * as eventsApi from "../api/events";


import "../styles/homepage.css";
import "../styles/eventcreationmodal.css";
import "../styles/joinmodal.css";
import "../styles/global.css";
import "../styles/eventoverview.css"

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



export default function HomePage() {
  const navigate = useNavigate();
  const { bootstrapping, logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [overviewEventId, setOverviewEventId] = useState(null); 
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErr, setOverviewErr] = useState("");

  function closeOverview() {
    setOverviewEventId(null);
    setOverview(null);
    setOverviewErr("");
  }

  function enterEvent() {
    if (!overviewEventId) return;
    closeOverview();
    navigate(`/event/${overviewEventId}`, { replace: true });
  }

  const [createOpen, setCreateOpen] = useState(false); 
  const [joinOpen, setJoinOpen] = useState(false);

  // 모달이 열릴 때 다른 모달을 닫는 함수들
  const handleOpenCreate = () => {
    setJoinOpen(false);
    setOverviewEventId(null);
    setCreateOpen(true);
  };

  const handleOpenJoin = () => {
    setCreateOpen(false);
    setOverviewEventId(null);
    setJoinOpen(true);
  };

  const handleOpenOverview = (eventId) => {
    setCreateOpen(false);
    setJoinOpen(false);
    setOverviewEventId(eventId);
  }; 

  const fetchEvents = useCallback(async () => {
    setErrMsg("");
    try {
      const data = await eventsApi.listParticipatedEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err?.status === 401) {
        return;
      }
      setErrMsg(err?.message || "이벤트 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bootstrapping) return;
    setLoading(true);
    fetchEvents();
  }, [bootstrapping, fetchEvents]);

  useEffect(() => {
    if (bootstrapping) return;

    const POLL_MS = 3000;
    const id = setInterval(fetchEvents, POLL_MS);
    return () => clearInterval(id);
  }, [bootstrapping, fetchEvents]);

  useEffect(() => {
    if (!overviewEventId) return;

    let alive = true;
    setOverviewLoading(true);
    setOverviewErr("");
    setOverview(null);

    (async () => {
      try {
        const data = await eventsApi.getEventOverview(overviewEventId);
        if (alive) setOverview(data);
      } catch (err) {
        if (alive) setOverviewErr(err?.message || "이벤트 오버뷰를 불러오지 못했습니다.");
      } finally {
        if (alive) setOverviewLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [overviewEventId]);


  const emptyState = useMemo(() => !loading && !errMsg && events.length === 0, [loading, errMsg, events]);

  return (
    <div className="home-root">
      <header className="home-topbar">
        <div className="home-brand">Decision Maker</div>

        <div className="home-actions">
          <button className="dm-btn dm-btn--outline" onClick={logout}>
            로그아웃
          </button>
          <button className="dm-btn" onClick={handleOpenJoin}>
            참여하기
          </button>
          <button className="dm-btn" onClick={handleOpenCreate}>
            생성하기
          </button>
        </div>
      </header>

      <main className="home-main">
        <div className="home-header-section">
          <h1 className="home-header-title">내 이벤트</h1>
          <p className="home-header-subtitle">참가 중인 의사결정 이벤트를 확인하고 관리하세요</p>
        </div>

        {errMsg && <div className="home-error">{errMsg}</div>}

        {emptyState && (
          <div className="home-empty">
            <p>참가한 이벤트가 없습니다.</p>
            <p style={{ marginTop: 'var(--spacing-4)', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-text-tertiary)' }}>
              위의 "참여하기" 또는 "생성하기" 버튼을 사용하여 시작하세요.
            </p>
          </div>
        )}

        {!emptyState && (
          <div className="event-list">
            {events.map((ev) => {
              const adminBadge = adminBadgeMeta(ev.is_admin);
              const membershipBadge = membershipBadgeMeta(ev.membership_status);
              const st = statusMeta(ev.event_status);

              return (
                <button
                  key={ev.id}
                  className="event-card"
                  onClick={() => handleOpenOverview(ev.id)}
                  type="button"
                >
                  <div className="event-left">
                    <div className="event-title-row">
                      {adminBadge && <span className={adminBadge.className}>{adminBadge.label}</span>}
                      {membershipBadge && (
                        <span className={membershipBadge.className}>{membershipBadge.label}</span>
                      )}
                      <h3 className="event-title">{ev.decision_subject}</h3>
                    </div>

                    <div className="event-sub">
                      <div>참가 인원: {ev.participant_count}명</div>
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
        )}
      </main>

      <EventOverviewModal
        open={!!overviewEventId}
        overview={overview}
        loading={overviewLoading}
        errorMsg={overviewErr}
        onClose={closeOverview}
        onEnter={enterEvent}
      />

      <EventCreationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setCreateOpen(false);
          // optionally refresh list later; for now just navigate
          navigate(`/event/${created.id}`, { replace: true });
        }}
      />

      <JoinEventModal
        open={joinOpen}
        onClose={() => {
          setJoinOpen(false);
        }}
        onJoined={(res) => {
          // res: { message, event_id }
          setJoinOpen(false);
          
          // 다른 모달을 먼저 닫고, 약간의 지연 후 overview 모달 열기
          if (res?.event_id) {
            // 상태 업데이트를 다음 틱으로 지연시켜 모달이 겹치지 않도록 함
            setTimeout(() => {
              handleOpenOverview(res.event_id);
            }, 100);
          }
        }}
      />
    </div>
  );
}
