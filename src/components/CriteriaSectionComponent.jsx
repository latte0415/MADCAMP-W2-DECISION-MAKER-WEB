import React, { useCallback, useEffect, useState } from "react";
import { ProposalAdminActions } from "./event/ProposalAdminActions";
import * as commentsApi from "../api/comments";

// 코멘트 아이템 컴포넌트 (수정/삭제 기능 포함)
function CommentItem({ comment, eventId, currentUserId, criterionId, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment?.content || "");
  const [deleting, setDeleting] = useState(false);

  const isMyComment = currentUserId && comment?.created_by === currentUserId;

  const handleEdit = async () => {
    if (!eventId || !comment?.id) return;
    if (!editContent.trim()) return;

    setEditing(false);
    try {
      await commentsApi.updateComment(eventId, comment.id, { content: editContent.trim() });
      onUpdate?.(criterionId);
    } catch (err) {
      alert(err?.message || "코멘트 수정에 실패했습니다.");
      setEditContent(comment?.content || "");
    }
  };

  const handleDelete = async () => {
    if (!eventId || !comment?.id) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    setDeleting(true);
    try {
      await commentsApi.deleteComment(eventId, comment.id);
      onUpdate?.(criterionId);
    } catch (err) {
      alert(err?.message || "코멘트 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="cr-comment">
      <div className="cr-comment-head">
        <span className="cr-comment-name">{comment?.creator?.name ?? "-"}</span>
        {isMyComment && !editing && (
          <div className="cr-comment-actions">
            <button
              type="button"
              className="dm-btn dm-btn--xs dm-btn--ghost"
              onClick={() => setEditing(true)}
            >
              수정
            </button>
            <button
              type="button"
              className="dm-btn dm-btn--xs dm-btn--ghost"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="cr-comment-edit">
          <textarea
            className="cr-comment-edit-input"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
          <div className="cr-comment-edit-actions">
            <button
              type="button"
              className="dm-btn dm-btn--xs dm-btn--primary"
              onClick={handleEdit}
            >
              저장
            </button>
            <button
              type="button"
              className="dm-btn dm-btn--xs dm-btn--outline"
              onClick={() => {
                setEditing(false);
                setEditContent(comment?.content || "");
              }}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="cr-comment-content">{comment?.content ?? ""}</div>
      )}
    </div>
  );
}

export default function CriteriaSection({
  criteria,
  creationProposals,
  participantCount,
  onToggleVote,
  isVoting,
  onToggleConclusionVote,
  isConclusionVoting,
  onOpenComposer,
  commentsByCriterionId,
  setOpenCriteriaIds,
  isAdmin = false,
  eventId,
  eventStatus,
  onProposalStatusChange,
  currentUserId,
  onCommentUpdate,
}) {
  const list = Array.isArray(criteria) ? criteria : [];
  const creates = Array.isArray(creationProposals) ? creationProposals : [];
  const commentsMap = commentsByCriterionId || {};

  // UI state only
  const [openComments, setOpenComments] = useState(() => new Set());

  // keep EventPage polling list in sync
  useEffect(() => {
    setOpenCriteriaIds?.(Array.from(openComments));
  }, [openComments, setOpenCriteriaIds]);

  const proposalTag = useCallback((p) => {
    if (p?.proposal_category === "MODIFICATION") return "수정";
    if (p?.proposal_category === "DELETION") return "삭제";
    if (p?.proposal_category === "CREATION") return "추가";
    return "제안";
  }, []);

  const toggleComments = useCallback((criterionId) => {
    if (!criterionId) return;
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(criterionId)) next.delete(criterionId);
      else next.add(criterionId);
      return next;
    });
  }, []);

function renderVoteArea(p) {
  const voteCount = p?.vote_info?.vote_count ?? 0;
  const hasVoted = !!p?.vote_info?.has_voted;

  return (
    <div className="ass-vote" onClick={(e) => e.stopPropagation()}>
      <div className="ass-vote-count">
        {voteCount}/{participantCount}
      </div>
      <button
        type="button"
        className="dm-btn dm-btn--outline dm-btn--xs"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVote?.(p);
        }}
        disabled={isVoting?.(p?.id) || eventStatus !== "IN_PROGRESS"}
      >
        {hasVoted ? "철회" : "동의"}
      </button>
    </div>
  );
}

function renderConclusionVote(p) {
  const voteCount = p?.vote_info?.vote_count ?? 0;
  const hasVoted = !!p?.vote_info?.has_voted;

  return (
    <div className="ass-vote" onClick={(e) => e.stopPropagation()}>
      <div className="ass-vote-count">
        {voteCount}/{participantCount || "-"}
      </div>
      <button
        type="button"
        className="dm-btn dm-btn--outline dm-btn--xs"
        onClick={(e) => {
          e.stopPropagation();
          onToggleConclusionVote?.(p);
        }}
        disabled={isConclusionVoting?.(p?.id) || eventStatus !== "IN_PROGRESS"}
      >
        {hasVoted ? "철회" : "동의"}
      </button>
    </div>
  );
}

  function conclusionStatusLabel(status) {
    if (status === "PENDING") return "투표중";
    if (status === "ACCEPTED") return "채택됨";
    return null;
  }

  return (
    <div className="ass-list">
      {list.map((c, idx) => {
        const cid = c?.id;
        const pending = (c?.proposals || []).filter((p) => p?.proposal_status === "PENDING");

        const commentsOpen = openComments.has(cid);
        const comments = commentsMap[cid] || [];

        const conclusions = Array.isArray(c?.conclusion_proposals)
          ? c.conclusion_proposals.filter(
              (p) => p?.proposal_status === "PENDING" || p?.proposal_status === "ACCEPTED"
            )
          : [];

        return (
          <div key={cid ?? idx}>
            {/* 1) Main criterion box */}
            <div className="ass-card">
              <div className="ass-num">{idx + 1}</div>

              <div
                onClick={(e) => {
                  // If the click came from any interactive control inside the card, do nothing.
                  if (
                    e.target.closest(
                      "button, a, input, select, textarea, .ass-vote, .ass-actions, .cr-comments-toggle"
                    )
                  ) {
                    return;
                  }

                  onOpenComposer?.({
                    scope: "criteria",
                    action: "comment",
                    targetIndex: idx,
                    targetId: cid,
                  });
                }}
                role="button"
                tabIndex={0}
              >
                <div className="ass-title">{c?.content ?? "-"}</div>

                {pending.length > 0 && (
                  <div className="ass-proposals"  onClick={(e) => e.stopPropagation()}>
                    {pending.map((p) => (
                      <div key={p?.id} className="ass-proposal-row">
                        <div className="ass-tag">{proposalTag(p)}</div>

                        <div className="ass-proposal-text">
                          {p?.proposal_category === "MODIFICATION" ? (
                            <>
                              <div className="ass-proposal-content">{p?.proposal_content ?? "-"}</div>
                              <div className="ass-proposal-reason">{p?.reason ?? "-"}</div>
                            </>
                          ) : (
                            <div className="ass-proposal-reason">{p?.reason ?? "-"}</div>
                          )}
                        </div>

                        {renderVoteArea(p)}
                        {isAdmin && (
                          <ProposalAdminActions
                            eventId={eventId}
                            proposalId={p?.id}
                            proposalType="criteria"
                            currentStatus={p?.proposal_status}
                            eventStatus={eventStatus}
                            onStatusChange={onProposalStatusChange}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="ass-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="dm-btn dm-btn--sm dm-btn--outline"
                  onClick={() =>
                    onOpenComposer?.({
                      scope: "criteria",
                      action: "conclusion",
                      targetIndex: idx,
                      targetId: cid,
                    })
                  }
                  disabled={eventStatus !== "IN_PROGRESS"}
                >
                  결론 제안
                </button>

                <button
                  type="button"
                  className="dm-btn dm-btn--sm dm-btn--outline"
                  onClick={() =>
                    onOpenComposer?.({
                      scope: "criteria",
                      action: "modify",
                      targetIndex: idx,
                      targetId: cid,
                    })
                  }
                  disabled={eventStatus !== "IN_PROGRESS"}
                >
                  수정 제안
                </button>

                <button
                  type="button"
                  className="dm-btn dm-btn--sm dm-btn--outline"
                  onClick={() =>
                    onOpenComposer?.({
                      scope: "criteria",
                      action: "delete",
                      targetIndex: idx,
                      targetId: cid,
                    })
                  }
                  disabled={eventStatus !== "IN_PROGRESS"}
                >
                  삭제 제안
                </button>
              </div>
            </div>

            {/* 2) Comments box */}
            <div className="cr-comments-box">
              <button
                type="button"
                className="cr-comments-toggle"
                onClick={() => toggleComments(cid)}
                aria-expanded={commentsOpen}
              >
                <span className="cr-caret">{commentsOpen ? "▼" : "▶"}</span>
                <span className="ass-title">코멘트</span>
                <span className="cr-comments-count">{comments.length > 0 ? `(${comments.length})` : ""}</span>
              </button>

              {commentsOpen && (
                <div className="cr-comments-body">
                  {comments.length === 0 ? (
                    <div className="event-muted">코멘트가 없습니다.</div>
                  ) : (
                    <div className="cr-comments-list">
                      {comments.map((cm) => (
                        <CommentItem
                          key={cm?.id ?? cm?.created_at}
                          comment={cm}
                          eventId={eventId}
                          currentUserId={currentUserId}
                          criterionId={cid}
                          onUpdate={onCommentUpdate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3) Each conclusion as its own box */}
            {conclusions.map((p) => {
              const status = p?.proposal_status;
              const statusLabel = conclusionStatusLabel(status);

              // accepted -> green box
              const boxClass =
                status === "ACCEPTED"
                  ? "cr-conclusion-box cr-conclusion-box--accepted"
                  : "cr-conclusion-box";

              return (
                <div key={p?.id} className={boxClass}>
                  <div className="ass-proposal-row ass-proposal-row--plain conc-row">
                    <div className="ass-tag--conc"> 결론 | {statusLabel} </div>


                    <div className="ass-proposal-text conc-text">
                      <div className="ass-proposal-content">{p?.proposal_content ?? "-"}</div>
                    </div>

                    {status === "PENDING" ? renderConclusionVote(p) : null}
                    {isAdmin && status === "PENDING" && (
                      <ProposalAdminActions
                        eventId={eventId}
                        proposalId={p?.id}
                        proposalType="conclusion"
                        currentStatus={p?.proposal_status}
                        eventStatus={eventStatus}
                        onStatusChange={onProposalStatusChange}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* 4) Criteria creation proposals */}
      {creates
        .filter((p) => p?.proposal_status === "PENDING" && p?.proposal_category === "CREATION")
        .map((p, i) => (
          <div key={p?.id ?? `cr-create-${i}`} className="ass-card ass-card--create">
            <div className="ass-num">-</div>

            <div className="ass-body">
              <div className="ass-title">제안된 기준입니다.</div>
              <div className="ass-proposals">
                <div className="ass-proposal-row">
                  <div className="ass-tag">추가</div>

                  <div className="ass-proposal-text">
                    <div className="ass-proposal-content">{p?.proposal_content ?? "-"}</div>
                    <div className="ass-proposal-reason">{p?.reason ?? "-"}</div>
                  </div>

                { renderVoteArea(p) }
                {isAdmin && (
                  <ProposalAdminActions
                    eventId={eventId}
                    proposalId={p?.id}
                    proposalType="criteria"
                    eventStatus={eventStatus}
                    currentStatus={p?.proposal_status}
                    onStatusChange={onProposalStatusChange}
                  />
                )}
                </div>
              </div>
            </div>

            <div className="ass-actions" />
          </div>
        ))}
    </div>
  );
}
