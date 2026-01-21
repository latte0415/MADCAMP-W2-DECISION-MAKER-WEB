import React, { useCallback, useEffect, useState } from "react";

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
  isAdmin,
  onAdminCriteriaDecision,
  onAdminConclusionDecision,
  criteriaStatusBusyById,
  conclusionStatusBusyById
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

  function renderAdminDecisionButtons(p) {
    if (!isAdmin) return null;
    if (p?.proposal_status !== "PENDING") return null;

    const busy = !!criteriaStatusBusyById?.[p?.id];

    return (
      <div className="admin-decision">
        <button
          type="button"
          className="dm-btn dm-btn--outline dm-btn--xs"
          onClick={() => onAdminCriteriaDecision?.(p, "ACCEPTED")}
          disabled={busy}
        >
          승인
        </button>
        <button
          type="button"
          className="dm-btn dm-btn--outline dm-btn--xs"
          onClick={() => onAdminCriteriaDecision?.(p, "REJECTED")}
          disabled={busy}
        >
          거부
        </button>
      </div>
    );
  }
  function renderConclusionAdminButtons(p) {
    if (!isAdmin) return null;
    if (p?.proposal_status !== "PENDING") return null;

    const busy = !!conclusionStatusBusyById?.[p?.id];

    return (
      <div className="admin-decision">
        <button
          type="button"
          className="dm-btn dm-btn--outline dm-btn--xs"
          onClick={() => onAdminConclusionDecision?.(p, "ACCEPTED")}
          disabled={busy}
        >
          승인
        </button>
        <button
          type="button"
          className="dm-btn dm-btn--outline dm-btn--xs"
          onClick={() => onAdminConclusionDecision?.(p, "REJECTED")}
          disabled={busy}
        >
          거부
        </button>
      </div>
    );
  }


  function renderVoteArea(p) {

    const voteCount = p?.vote_info?.vote_count ?? 0;
    const hasVoted = !!p?.vote_info?.has_voted;

    return (
      <div className="ass-vote">
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
          disabled={isVoting?.(p?.id)}
        >
          {hasVoted ? "철회" : "동의"}
        </button>
      </div>
    );
  }

  // conclusion votes: vote_count / participantCount (vote UI only for PENDING)
  function renderConclusionVote(p) {
    const voteCount = p?.vote_info?.vote_count ?? 0;
    const hasVoted = !!p?.vote_info?.has_voted;

    return (
      <div className="ass-vote">
        <div className="ass-vote-count">
          {voteCount}/{participantCount || "-"}
        </div>
        <button
          type="button"
          className="dm-btn dm-btn--outline dm-btn--xs"
          onClick={() => onToggleConclusionVote?.(p)}
          disabled={isConclusionVoting?.(p?.id)}
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
                className="ass-body"
                onClick={() =>
                  onOpenComposer?.({
                    scope: "criteria",
                    action: "comment",
                    targetIndex: idx,
                    targetId: cid,
                  })
                }
                role="button"
                tabIndex={0}
              >
                <div className="ass-title">{c?.content ?? "-"}</div>

                {pending.length > 0 && (
                  <div className="ass-proposals">
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

                        <div className="vote-and-admin">
                          {renderVoteArea(p)}
                          {renderAdminDecisionButtons(p)}
                        </div>
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
              >
                <span className="cr-caret">{commentsOpen ? "v" : ">"}</span>
                <span className="ass-title">코멘트</span>
                <span className="cr-comments-count"></span>
              </button>

              {commentsOpen && (
                <div className="cr-comments-body">
                  {comments.length === 0 ? (
                    <div className="event-muted">코멘트가 없습니다.</div>
                  ) : (
                    <div className="cr-comments-list">
                      {comments.map((cm) => (
                        <div key={cm?.id ?? cm?.created_at} className="cr-comment">
                          <div className="cr-comment-head">
                            <span className="cr-comment-name">{cm?.creator?.name ?? "-"}</span>
                          </div>
                          <div className="cr-comment-content">{cm?.content ?? ""}</div>
                        </div>
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

                    {status === "PENDING" 
                    ? <div className="vote-and-admin">
                        {renderConclusionVote(p)}
                        {renderConclusionAdminButtons(p)}
                      </div>
                    : null}
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
          <div
            key={p?.id ?? `cr-create-${i}`}
            className="ass-card ass-card--proposal"
          >
            <div className="ass-num ass-num--proposal">제안</div>

            <div className="ass-body">
              <div className="ass-title">{p?.proposal_content ?? "-"}</div>
              <div className="ass-subtitle">{p?.reason ?? "-"}</div>
            </div>

            <div className="ass-actions ass-actions--proposal">
              <div className="vote-and-admin">
                {renderVoteArea(p)}
                {renderAdminDecisionButtons(p)}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
