import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AssumptionsSection from "../components/AssumptionSectionComponent";
import { VOTE_TARGETS } from "../utils/voteTargets";
import { useOptimisticVoteToggle } from "../hooks/useOptimisticVoteToggle";
import * as eventsApi from "../api/events";
import * as votesApi from "../api/votes";
import * as commentsApi from "../api/comments";
import ProposalComposer from "../components/ProposalComposer";
import CriteriaSection from "../components/CriteriaSectionComponent";
import VoteModal from "../components/event/VoteModal";
import EventSettingModal from "../components/event/EventSettingModal";
import MembershipManagementModal from "../components/event/MembershipManagementModal";
import VoteResultDisplay from "../components/event/VoteResultDisplay";
import { useProposalComposer } from "../hooks/useProposalComposer";

import "../styles/eventpage.css";
import "../styles/global.css";
import "../styles/proposalcomposer.css";
import "../styles/homepage.css"; 

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

export default function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [openCriteriaIds, setOpenCriteriaIds] = useState([]); // array of criterionId
  const [commentsByCriterionId, setCommentsByCriterionId] = useState({}); // { [id]: Comment[] }

  const [voteOpen, setVoteOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // 모달이 열릴 때 다른 모달을 닫는 함수들
  const handleOpenVote = () => {
    setSettingOpen(false);
    setMembershipOpen(false);
    closeComposer(); // ProposalComposer도 닫기
    setVoteOpen(true);
  };

  const handleOpenSetting = () => {
    setVoteOpen(false);
    setMembershipOpen(false);
    closeComposer(); // ProposalComposer도 닫기
    setSettingOpen(true);
  };

  const handleOpenMembership = () => {
    setVoteOpen(false);
    setSettingOpen(false);
    closeComposer(); // ProposalComposer도 닫기
    setMembershipOpen(true);
  };

  const inFlightRef = useRef(false);

  const fetchDetail = useCallback(async () => {
    if (!eventId) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setErrMsg("");

    try {
      const data = await eventsApi.getEventDetail(eventId);
      setDetail(data);
    } catch (err) {
      setErrMsg(err?.message || "이벤트 정보를 불러오지 못했습니다.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [eventId]);

    const {
    composer, draftContent, draftReason,
    composerErr, composerSubmitting,
    openComposer, closeComposer, submitComposer,
    setDraftContent, setDraftReason,
  } = useProposalComposer({ eventId, fetchDetail });


  const commentsInFlightRef = useRef(new Set());

  const fetchCommentsForCriterion = useCallback(
    async (criterionId) => {
      if (!eventId || !criterionId) return;
      if (commentsInFlightRef.current.has(criterionId)) return;

      commentsInFlightRef.current.add(criterionId);
      try {
        const data = await commentsApi.listCriteriaComments(eventId, criterionId); 
        // data should be an array; normalize defensively
        setCommentsByCriterionId((prev) => ({
          ...prev,
          [criterionId]: Array.isArray(data) ? data : [],
        }));
      } finally {
        commentsInFlightRef.current.delete(criterionId);
      }
    },
    [eventId]
  );


  const { toggleVote: toggleAssumptionVote, isVoting: isAssumptionVoting } = useOptimisticVoteToggle({
    eventId,
    targets: VOTE_TARGETS.assumption,
    setDetail,
    setErrMsg,
    castVoteApi: votesApi.castAssumptionVote,
    retrieveVoteApi: votesApi.retrieveAssumptionVote,
  });

  const { toggleVote: toggleCriteriaVote, isVoting: isCriteriaVoting } = useOptimisticVoteToggle({
    eventId,
    targets: VOTE_TARGETS.criteria,
    setDetail,
    setErrMsg,
    castVoteApi: votesApi.castCriteriaVote,
    retrieveVoteApi: votesApi.retrieveCriteriaVote,
  });

  const { toggleVote: toggleConclusionVote, isVoting: isConclusionVoting } = useOptimisticVoteToggle({
    eventId,
    targets: VOTE_TARGETS.conclusion,
    setDetail,
    setErrMsg,
    castVoteApi: votesApi.castConclusionVote,
    retrieveVoteApi: votesApi.retrieveConclusionVote,
  });


  // initial fetch on mount / eventId change
  useEffect(() => {
    setLoading(true);
    setDetail(null);
    fetchDetail();
  }, [eventId, fetchDetail]);

  // polling every 1.75 seconds (but skip when voting modal is open to avoid flickering)
  useEffect(() => {
    if (!eventId || voteOpen) return;

    const POLL_MS = 1750;
    const id = setInterval(() => {
      fetchDetail();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [eventId, voteOpen, fetchDetail]);

  // comment polling.
  useEffect(() => {
    if (!eventId) return;
    if (!openCriteriaIds || openCriteriaIds.length === 0) return;

    // initial immediate fetch (so it doesn’t wait 1.5s)
    openCriteriaIds.forEach((id) => fetchCommentsForCriterion(id));

    const POLL_MS = 1750;
    const id = setInterval(() => {
      openCriteriaIds.forEach((id) => fetchCommentsForCriterion(id));
    }, POLL_MS);

    return () => clearInterval(id);
  }, [eventId, openCriteriaIds, fetchCommentsForCriterion]);


  const st = useMemo(() => statusMeta(detail?.event_status), [detail]);
  const subject = detail?.decision_subject ?? "";
  const options = Array.isArray(detail?.options) ? detail.options : [];
  const participantCount = Number.isFinite(detail?.current_participants_count) ? detail.current_participants_count : 0;
  const isAdmin = detail?.is_admin ?? false;
  const eventStatus = detail?.event_status;

  // 이벤트 상태 변경 핸들러
  const handleStatusChange = useCallback(
    async (newStatus) => {
      if (!eventId || !newStatus) return;

      setStatusChanging(true);
      setErrMsg("");

      try {
        await eventsApi.updateEventStatus(eventId, { status: newStatus });
        await fetchDetail();
      } catch (err) {
        setErrMsg(err?.message || "상태 변경에 실패했습니다.");
      } finally {
        setStatusChanging(false);
      }
    },
    [eventId, fetchDetail]
  );

  // 상태 변경 가능한 옵션들
  const statusOptions = useMemo(() => {
    if (!eventStatus) return [];
    const options = [];
    switch (eventStatus) {
      case "NOT_STARTED":
        options.push({ value: "IN_PROGRESS", label: "진행 중" });
        break;
      case "IN_PROGRESS":
        options.push({ value: "PAUSED", label: "일시정지" });
        options.push({ value: "FINISHED", label: "종료" });
        break;
      case "PAUSED":
        options.push({ value: "IN_PROGRESS", label: "재개" });
        options.push({ value: "FINISHED", label: "종료" });
        break;
      case "FINISHED":
        // FINISHED는 변경 불가
        break;
    }
    return options;
  }, [eventStatus]);

  return (
    <div className="event-root">
      <header className="event-topbar">
        <div className="event-brand">Decision Maker</div>

        <div className="event-actions">
          {isAdmin && statusOptions.length > 0 && (
            <select
              className="dm-select"
              value={eventStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusChanging}
            >
              <option value={eventStatus}>{st.label}</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {!isAdmin && <div className={st.className}>{st.label}</div>}

          {isAdmin && (
            <>
              <button className="dm-btn" type="button" onClick={handleOpenSetting}>
                설정
              </button>
              <button className="dm-btn" type="button" onClick={handleOpenMembership}>
                멤버십 관리
              </button>
            </>
          )}

          <button className="dm-btn" type="button" onClick={() => navigate("/home")}>
            나가기
          </button>

          {eventStatus === "IN_PROGRESS" && (
            <button className="dm-btn" type="button" onClick={handleOpenVote}>
              투표하기
            </button>
          )}
        </div>
      </header>

      <main className="event-main">
        {errMsg && <div className="event-error">{errMsg}</div>}

        <section className="event-section">
          <h2 className="event-section-title">기본 정보</h2>

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
            <h2 className="event-section-title">전제</h2>
            <button className="dm-btn dm-btn--sm" type="button" onClick={() => { openComposer({ scope: "assumption", action: "create", targetIndex: null, targetId: null }); }} disabled={eventStatus !== "IN_PROGRESS"}>
              추가하기
            </button>
          </div>


          <AssumptionsSection
            assumptions={detail?.assumptions}
            creationProposals={detail?.assumption_creation_proposals}
            participantCount={participantCount}
            onToggleVote={toggleAssumptionVote}
            isVoting={isAssumptionVoting}
            onOpenComposer={openComposer}
            isAdmin={detail?.is_admin}
            eventId={eventId}
            eventStatus={eventStatus}
            onProposalStatusChange={fetchDetail}
          />
        </section>
        <div className='ep-divider--long'/>
        <section className="event-section">
          <div className="event-section-head">
            <h2 className="event-section-title">기준</h2>
            <button
              className="dm-btn dm-btn--sm"
              type="button"
              onClick={() => openComposer({ scope: "criteria", action: "create", targetIndex: null, targetId: null })}
              disabled={eventStatus !== "IN_PROGRESS"}
            >
              추가하기
            </button>
          </div>

          <CriteriaSection
            criteria={detail?.criteria}
            creationProposals={detail?.criteria_creation_proposals}
            participantCount={participantCount}
            onToggleVote={toggleCriteriaVote}
            isVoting={isCriteriaVoting}
            onToggleConclusionVote={toggleConclusionVote}
            isConclusionVoting={isConclusionVoting}
            onOpenComposer={openComposer}
            commentsByCriterionId={commentsByCriterionId}
            setOpenCriteriaIds={setOpenCriteriaIds}
            isAdmin={detail?.is_admin}
            eventId={eventId}
            eventStatus={eventStatus}
            onProposalStatusChange={fetchDetail}
            currentUserId={user?.id}
            onCommentUpdate={fetchCommentsForCriterion}
          />
        </section>

        <VoteResultDisplay eventId={eventId} eventStatus={eventStatus} />

        <ProposalComposer
          open={!!composer}
          config={composer}
          content={draftContent}
          reason={draftReason}
          setContent={setDraftContent}
          setReason={setDraftReason}
          submitting={composerSubmitting}
          errorMsg={composerErr}
          onClose={closeComposer}
          onSubmit={submitComposer}
        />
      </main>

      <VoteModal
        open={voteOpen}
        eventId={eventId}
        options={options}
        criteria={detail?.criteria || []}
        onClose={() => setVoteOpen(false)}
        onSuccess={() => {
          // 투표 성공 시 이벤트 상세 정보 새로고침
          fetchDetail();
        }}
      />

      {isAdmin && (
        <>
          <EventSettingModal
            open={settingOpen}
            eventId={eventId}
            eventStatus={eventStatus}
            onClose={() => setSettingOpen(false)}
            onSuccess={() => {
              fetchDetail();
            }}
          />

          <MembershipManagementModal
            open={membershipOpen}
            eventId={eventId}
            onClose={() => setMembershipOpen(false)}
            onSuccess={() => {
              fetchDetail();
            }}
          />
        </>
      )}
    </div>
  );
}
