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
      return { label: "대기 중", className: "status-pill status-waiting" };
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
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [composerCollapsed, setComposerCollapsed] = useState(false);

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
      // 이벤트가 삭제된 경우 (404) 홈으로 리디렉션
      if (err?.status === 404) {
        navigate("/home");
        return;
      }
      setErrMsg(err?.message || "이벤트 정보를 불러오지 못했습니다.");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [eventId, navigate]);

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
    async (newStatus, requiresConfirmation = false, confirmMessage = "") => {
      if (!eventId || !newStatus) return;

      // 확인이 필요한 경우 확인 다이얼로그 표시
      if (requiresConfirmation) {
        setConfirmDialog({
          message: confirmMessage || "이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?",
          onConfirm: async () => {
            setConfirmDialog(null);
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
        });
        return;
      }

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

  // 상태 변경 버튼 정보
  const statusButtonConfig = useMemo(() => {
    if (!eventStatus) return null;
    switch (eventStatus) {
      case "NOT_STARTED":
        return { 
          text: "시작", 
          nextStatus: "IN_PROGRESS", 
          color: "green",
          requiresConfirmation: true,
          confirmMessage: "이벤트를 시작하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        };
      case "IN_PROGRESS":
        // IN_PROGRESS에서는 두 개의 버튼이 필요하므로 특별 처리
        return null;
      case "PAUSED":
        return { 
          text: "재개", 
          nextStatus: "IN_PROGRESS", 
          color: "green",
          requiresConfirmation: false
        };
      case "FINISHED":
        return null;
      default:
        return null;
    }
  }, [eventStatus]);

  // IN_PROGRESS 상태일 때의 버튼들
  const inProgressButtons = useMemo(() => {
    if (eventStatus !== "IN_PROGRESS") return [];
    return [
      { 
        text: "일시 정지", 
        nextStatus: "PAUSED", 
        color: "red",
        requiresConfirmation: false
      },
      { 
        text: "종료", 
        nextStatus: "FINISHED", 
        color: "green",
        requiresConfirmation: true,
        confirmMessage: "이벤트를 종료하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      }
    ];
  }, [eventStatus]);

  return (
    <div className="event-root">
      <header className="event-topbar">
        <button className="event-brand" type="button" onClick={() => navigate("/home")}>
          Decision Maker
        </button>

        <div className="event-actions">
          {isAdmin && eventStatus === "IN_PROGRESS" && (
            <>
              {inProgressButtons.map((btn) => (
                <button
                  key={btn.nextStatus}
                  className={`dm-btn dm-btn--status dm-btn--${btn.color}`}
                  type="button"
                  onClick={() => handleStatusChange(btn.nextStatus, btn.requiresConfirmation, btn.confirmMessage)}
                  disabled={statusChanging}
                >
                  {btn.text}
                </button>
              ))}
            </>
          )}
          {isAdmin && statusButtonConfig && (
            <button
              className={`dm-btn dm-btn--status dm-btn--${statusButtonConfig.color}`}
              type="button"
              onClick={() => handleStatusChange(
                statusButtonConfig.nextStatus, 
                statusButtonConfig.requiresConfirmation, 
                statusButtonConfig.confirmMessage
              )}
              disabled={statusChanging}
            >
              {statusButtonConfig.text}
            </button>
          )}
          <button className="event-nav-link" type="button" onClick={handleOpenSetting}>
            설정
          </button>
          {isAdmin && (
            <button className="event-nav-link" type="button" onClick={handleOpenMembership}>
              멤버십 관리
            </button>
          )}

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
          <div className="event-section-head">
            <span className={st.className}>{st.label}</span>
          </div>

          <div className="basic-info-list">
            <div className="basic-info-card">
              <div className="basic-info-label">주제</div>
              <div className="basic-info-content">
                {loading ? <span className="event-muted">불러오는 중...</span> : (subject || "-")}
              </div>
            </div>

            <div className="basic-info-card">
              <div className="basic-info-label">선택지</div>
              <div className="basic-info-content">
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

        <section id="assumption-section" className="event-section">
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
        <section id="criteria-section" className="event-section">
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
      </main>

      {/* 플로팅 입력창 */}
      {eventStatus === "IN_PROGRESS" && (
        <ProposalComposer
          open={true}
          collapsed={composerCollapsed}
          onToggleCollapse={() => setComposerCollapsed(!composerCollapsed)}
          config={composer || { scope: "assumption", action: "create", targetIndex: null, targetId: null }}
          content={draftContent}
          reason={draftReason}
          setContent={setDraftContent}
          setReason={setDraftReason}
          submitting={composerSubmitting}
          errorMsg={composerErr}
          onClose={composer ? closeComposer : () => {
            setDraftContent("");
            setDraftReason("");
          }}
          onConfigChange={(newConfig) => {
            openComposer(newConfig);
            
            // 특정 컴포넌트를 참조하는 경우 해당 섹션으로 스크롤 및 강조
            if (newConfig.action !== "create" && newConfig.targetIndex !== null) {
              const sectionId = newConfig.scope === "assumption" ? "assumption-section" : "criteria-section";
              const itemId = newConfig.scope === "assumption" 
                ? `assumption-${newConfig.targetIndex}`
                : `criterion-${newConfig.targetIndex}`;
              
              setTimeout(() => {
                const section = document.getElementById(sectionId);
                const item = document.getElementById(itemId);
                
                if (section) {
                  // 섹션으로 스크롤
                  section.scrollIntoView({ behavior: "smooth", block: "center" });
                  
                  // 섹션 강조
                  section.classList.add("event-section--highlighted");
                  setTimeout(() => {
                    section.classList.remove("event-section--highlighted");
                  }, 2000);
                }
                
                // 특정 항목 강조
                if (item) {
                  item.classList.add("ass-card--highlighted");
                  setTimeout(() => {
                    item.classList.remove("ass-card--highlighted");
                  }, 2000);
                }
              }, 100);
            } else if (newConfig.action === "comment" || newConfig.action === "conclusion") {
              // 코멘트나 결론의 경우 기준 섹션으로 스크롤
              const sectionId = "criteria-section";
              const itemId = `criterion-${newConfig.targetIndex}`;
              
              setTimeout(() => {
                const section = document.getElementById(sectionId);
                const item = document.getElementById(itemId);
                
                if (section) {
                  section.scrollIntoView({ behavior: "smooth", block: "center" });
                  section.classList.add("event-section--highlighted");
                  setTimeout(() => {
                    section.classList.remove("event-section--highlighted");
                  }, 2000);
                }
                
                if (item) {
                  item.classList.add("ass-card--highlighted");
                  setTimeout(() => {
                    item.classList.remove("ass-card--highlighted");
                  }, 2000);
                }
              }, 100);
            }
          }}
          assumptions={detail?.assumptions || []}
          criteria={detail?.criteria || []}
          onSubmit={async () => {
            if (!composer) {
              // composer가 없으면 전제 추가 모드로 열기
              openComposer({ scope: "assumption", action: "create", targetIndex: null, targetId: null });
              // 다음 틱에서 제출
              setTimeout(() => {
                submitComposer();
              }, 0);
            } else {
              submitComposer();
            }
          }}
        />
      )}

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

      <EventSettingModal
        open={settingOpen}
        eventId={eventId}
        eventStatus={eventStatus}
        readOnly={!isAdmin}
        onClose={() => setSettingOpen(false)}
        onSuccess={() => {
          fetchDetail();
        }}
      />

      {isAdmin && (
        <MembershipManagementModal
          open={membershipOpen}
          eventId={eventId}
          onClose={() => setMembershipOpen(false)}
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}

      {/* 확인 다이얼로그 */}
      {confirmDialog && (
        <div className="confirm-dialog-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-message">{confirmDialog.message}</div>
            <div className="confirm-dialog-actions">
              <button
                className="dm-btn dm-btn--outline"
                type="button"
                onClick={() => setConfirmDialog(null)}
              >
                취소
              </button>
              <button
                className="dm-btn dm-btn--danger"
                type="button"
                onClick={confirmDialog.onConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
