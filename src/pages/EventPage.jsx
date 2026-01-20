import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AssumptionsSection from "../components/AssumptionSectionComponent";
import { VOTE_TARGETS } from "../utils/voteTargets";
import { useOptimisticVoteToggle } from "../hooks/useOptimisticVoteToggle";
import * as eventsApi from "../api/events";
import ProposalComposer from "../components/ProposalComposer";
import CriteriaSection from "../components/CriteriaSectionComponent";
import ModalShell from "../components/ModalShell";
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

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [openCriteriaIds, setOpenCriteriaIds] = useState([]); // array of criterionId
  const [commentsByCriterionId, setCommentsByCriterionId] = useState({}); // { [id]: Comment[] }

  const [voteOpen, setVoteOpen] = useState(false);

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
    commentRefresh,
  } = useProposalComposer({ eventId, fetchDetail });


  const commentsInFlightRef = useRef(new Set());

  const fetchCommentsForCriterion = useCallback(
    async (criterionId) => {
      if (!eventId || !criterionId) return;
      if (commentsInFlightRef.current.has(criterionId)) return;

      commentsInFlightRef.current.add(criterionId);
      try {
        const data = await eventsApi.listCriteriaComments(eventId, criterionId); 
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
    castVoteApi: eventsApi.castAssumptionVote,
    retrieveVoteApi: eventsApi.retrieveAssumptionVote,
  });

  const { toggleVote: toggleCriteriaVote, isVoting: isCriteriaVoting } = useOptimisticVoteToggle({
    eventId,
    targets: VOTE_TARGETS.criteria,
    setDetail,
    setErrMsg,
    castVoteApi: eventsApi.castCriteriaVote,
    retrieveVoteApi: eventsApi.retrieveCriteriaVote,
  });

  const { toggleVote: toggleConclusionVote, isVoting: isConclusionVoting } = useOptimisticVoteToggle({
    eventId,
    targets: VOTE_TARGETS.conclusion,
    setDetail,
    setErrMsg,
    castVoteApi: eventsApi.castConclusionVote,
    retrieveVoteApi: eventsApi.retrieveConclusionVote,
  });


  // initial fetch on mount / eventId change
  useEffect(() => {
    setLoading(true);
    setDetail(null);
    fetchDetail();
  }, [fetchDetail]);

  // polling every 1.5 seconds
  useEffect(() => {
    if (!eventId) return;

    const POLL_MS = 1500;
    const id = setInterval(() => {
      fetchDetail();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [eventId, fetchDetail]);

  // comment polling.
  useEffect(() => {
    if (!eventId) return;
    if (!openCriteriaIds || openCriteriaIds.length === 0) return;

    // initial immediate fetch (so it doesn’t wait 1.5s)
    openCriteriaIds.forEach((id) => fetchCommentsForCriterion(id));

    const POLL_MS = 1500;
    const id = setInterval(() => {
      openCriteriaIds.forEach((id) => fetchCommentsForCriterion(id));
    }, POLL_MS);

    return () => clearInterval(id);
  }, [eventId, openCriteriaIds, fetchCommentsForCriterion]);


  const st = useMemo(() => statusMeta(detail?.event_status), [detail]);
  const subject = detail?.decision_subject ?? "";
  const options = Array.isArray(detail?.options) ? detail.options : [];
  const participantCount = Number.isFinite(detail?.current_participants_count) ? detail.current_participants_count : 0;

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
            <button className="dm-btn dm-btn--sm" type="button" onClick={() => { openComposer({ scope: "assumption", action: "create", targetIndex: null, targetId: null }); }}>
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
          />
        </section>
        <div className='ep-divider--long'/>
        <section className="event-section">
          <div className="event-section-head">
            <div className="event-section-title">기준</div>
            <button
              className="dm-btn dm-btn--sm"
              type="button"
              onClick={() => openComposer({ scope: "criteria", action: "create", targetIndex: null, targetId: null })}
            >
              추가하기
            </button>
          </div>

          <CriteriaSection
            criteria={detail?.criteria}
            creationProposals={detail?.criteria_creation_proposals}
            participantCount={participantCount}
            onToggleCriteriaVote={toggleCriteriaVote}
            isCriteriaVoting={isCriteriaVoting}
            onToggleConclusionVote={toggleConclusionVote}
            isConclusionVoting={isConclusionVoting}
            onOpenComposer={openComposer}
            commentRefresh={commentRefresh}
            commentsByCriterionId={commentsByCriterionId}
            setOpenCriteriaIds={setOpenCriteriaIds}
          />
        </section>

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

      {/* Vote placeholder modal */}
      <ModalShell open={voteOpen} title="투표하기 (Placeholder)" onClose={() => setVoteOpen(false)}>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          여기에는 “투표하기” UI가 들어갑니다. (임시 Placeholder)
          <div style={{ marginTop: 10 }} />
        </div>
      </ModalShell>
    </div>
  );
}
