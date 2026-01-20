import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AssumptionsSection from "../components/AssumptionSectionComponent";
import { VOTE_TARGETS } from "../utils/voteTargets";
import { useOptimisticVoteToggle } from "../hooks/useOptimisticVoteToggle";
import * as eventsApi from "../api/events";
import ProposalComposer from "../components/ProposalComposer";
import CriteriaSection from "../components/CriteriaSectionComponent";


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

  const [composer, setComposer] = useState(null); // null | { scope, action, targetIndex, targetId }
  const [draftContent, setDraftContent] = useState("");
  const [draftReason, setDraftReason] = useState("");
  const [composerErr, setComposerErr] = useState("");
  const [composerSubmitting, setComposerSubmitting] = useState(false);

const [commentRefresh, setCommentRefresh] = useState(null); // { criterionId, nonce }

const bumpCommentRefresh = useCallback((criterionId) => {
  setCommentRefresh({ criterionId, nonce: Date.now() });
}, []);

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


  const openComposer = useCallback((cfg) => {
    setComposerErr("");
    setComposer(cfg);
    setDraftContent("");
    setDraftReason("");
  }, []);

  const onAssumptionCreate = useCallback(() => {
    openComposer({ scope: "assumption", action: "create", targetIndex: null, targetId: null });
  }, [openComposer]);

  const onAssumptionModify = useCallback((assumption, idx) => {
    openComposer({ scope: "assumption", action: "modify", targetIndex: idx, targetId: assumption?.id });
  }, [openComposer]);

  const onAssumptionDelete = useCallback((assumption, idx) => {
    openComposer({ scope: "assumption", action: "delete", targetIndex: idx, targetId: assumption?.id });
  }, [openComposer]);

  const closeComposer = useCallback(() => {
    setComposer(null);
    setComposerErr("");
    setComposerSubmitting(false);
    setDraftContent("");
    setDraftReason("");
  }, []);

  const submitComposer = useCallback(async () => {
    if (!composer || !eventId) return;

    setComposerErr("");

    const content = draftContent.trim();
    const reason = draftReason.trim();

    // Validation
    if (composer.action === "comment" || composer.action === "conclusion") {
      if (!content) return setComposerErr("내용을 입력하세요.");
    } else if (composer.action === "delete") {
      if (!reason) return setComposerErr("이유를 입력하세요.");
    } else {
      if (!content) return setComposerErr("작성할 내용을 입력하세요.");
      if (!reason) return setComposerErr("이유를 입력하세요.");
    }

    setComposerSubmitting(true);

    try {
      // 1) Criteria comment
      if (composer.scope === "criteria" && composer.action === "comment") {
        await eventsApi.createCriteriaComment(eventId, composer.targetId, { content });
        bumpCommentRefresh(composer.targetId);
        // comments are not in detail; we'll trigger comment refresh below (Step 5)
      }

      // 2) Criteria conclusion proposal
      else if (composer.scope === "criteria" && composer.action === "conclusion") {
        await eventsApi.createConclusionProposal(eventId, composer.targetId, { proposal_content: content });
        await fetchDetail(); // conclusion proposals are in detail -> refresh immediately
      }

      // 3) Normal proposals: assumption/criteria create/modify/delete
      else {
        const actionToCategory = { create: "CREATION", modify: "MODIFICATION", delete: "DELETION" };
        const proposal_category = actionToCategory[composer.action];

        const proposal_content = composer.action === "delete" ? null : content;

        if (composer.scope === "assumption") {
          await eventsApi.createAssumptionProposal(eventId, {
            proposal_category,
            assumption_id: composer.action === "create" ? null : composer.targetId,
            proposal_content,
            reason,
          });
        } else if (composer.scope === "criteria") {
          await eventsApi.createCriteriaProposal(eventId, {
            proposal_category,
            criteria_id: composer.action === "create" ? null : composer.targetId,
            proposal_content,
            reason,
          });
        } else {
          throw new Error("Unknown proposal scope");
        }

        await fetchDetail(); // proposals live in detail
      }

      closeComposer();
    } catch (err) {
      setComposerErr(err?.message || "제안에 실패했습니다.");
    } finally {
      setComposerSubmitting(false);
    }
  }, [composer, eventId, draftContent, draftReason, fetchDetail, closeComposer]);



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

  // polling every 3 seconds
  useEffect(() => {
    if (!eventId) return;

    const POLL_MS = 1500;
    const id = setInterval(() => {
      fetchDetail();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [eventId, fetchDetail]);

  const st = useMemo(() => statusMeta(detail?.event_status), [detail]);

  const subject = detail?.decision_subject ?? "";
  const options = Array.isArray(detail?.options) ? detail.options : [];
  const assumptionAutoByVotes = !!setting?.assumption_is_auto_approved_by_votes;
  const assumptionMinVotes = Number.isFinite(setting?.assumption_min_votes_required)
    ? setting.assumption_min_votes_required
    : 0;
  const criteriaAutoByVotes = !!setting?.criteria_is_auto_approved_by_votes;
  const criteriaMinVotes = Number.isFinite(setting?.criteria_min_votes_required)
    ? setting.criteria_min_votes_required
    : 0;

  const participantCount = Number.isFinite(detail?.participant_count) ? detail.participant_count : 0;

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
            <button className="dm-btn dm-btn--sm" type="button" onClick={onAssumptionCreate}>
              추가하기
            </button>
          </div>


          <AssumptionsSection
            assumptions={detail?.assumptions}
            creationProposals={detail?.assumption_creation_proposals}
            autoByVotes={assumptionAutoByVotes}
            minVotes={assumptionMinVotes}
            onToggleVote={toggleAssumptionVote}
            isVoting={isAssumptionVoting}
            onProposeModify={onAssumptionModify}
            onProposeDelete={onAssumptionDelete}
          />
        </section>
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
            eventId={eventId}
            criteria={detail?.criteria}
            creationProposals={detail?.criteria_creation_proposals}
            autoByVotes={criteriaAutoByVotes}
            minVotes={criteriaMinVotes}
            participantCount={participantCount}
            onToggleVote={toggleCriteriaVote}
            isVoting={isCriteriaVoting}
            onToggleConclusionVote={toggleConclusionVote}
            isConclusionVoting={isConclusionVoting}
            onOpenComposer={openComposer}
            commentRefresh={commentRefresh}
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
          <pre className="modal-pre">{JSON.stringify(detail, null, 2)}</pre>
        </div>
      </ModalShell>
    </div>
  );
}
