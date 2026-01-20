import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as eventsApi from "../api/events";

export default function CriteriaSection({
  eventId,
  criteria,
  creationProposals,
  autoByVotes,
  minVotes,
  participantCount,

  onToggleVote,
  isVoting,

  onToggleConclusionVote,
  isConclusionVoting,

  onOpenComposer,        // single entry: openComposer(cfg)
  commentRefresh,        // { criterionId, nonce } or null
}) {
  const list = Array.isArray(criteria) ? criteria : [];
  const creates = Array.isArray(creationProposals) ? creationProposals : [];

  const [openComments, setOpenComments] = useState(() => new Set());
  const [commentsById, setCommentsById] = useState({});      // criterionId -> comments[]
  const [loadingById, setLoadingById] = useState({});        // criterionId -> bool
  const [errorById, setErrorById] = useState({});            // criterionId -> string

  const toggleComments = useCallback(async (criterionId) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(criterionId)) next.delete(criterionId);
      else next.add(criterionId);
      return next;
    });

    // fetch on open if not present
    if (!commentsById[criterionId]) {
      setLoadingById((m) => ({ ...m, [criterionId]: true }));
      setErrorById((m) => ({ ...m, [criterionId]: "" }));
      try {
        const data = await eventsApi.listCriteriaComments(eventId, criterionId);
        setCommentsById((m) => ({ ...m, [criterionId]: Array.isArray(data) ? data : [] }));
      } catch (e) {
        setErrorById((m) => ({ ...m, [criterionId]: e?.message || "코멘트를 불러오지 못했습니다." }));
      } finally {
        setLoadingById((m) => ({ ...m, [criterionId]: false }));
      }
    }
  }, [eventId, commentsById]);

  // refresh comments for a criterion after comment submit
  useEffect(() => {
    const cid = commentRefresh?.criterionId;
    if (!cid) return;
    if (!openComments.has(cid)) return; // only refresh if open

    (async () => {
      setLoadingById((m) => ({ ...m, [cid]: true }));
      setErrorById((m) => ({ ...m, [cid]: "" }));
      try {
        const data = await eventsApi.listCriteriaComments(eventId, cid);
        setCommentsById((m) => ({ ...m, [cid]: Array.isArray(data) ? data : [] }));
      } catch (e) {
        setErrorById((m) => ({ ...m, [cid]: e?.message || "코멘트를 불러오지 못했습니다." }));
      } finally {
        setLoadingById((m) => ({ ...m, [cid]: false }));
      }
    })();
  }, [commentRefresh, eventId, openComments]);

  function isPending(p) {
    return p?.proposal_status === "PENDING";
  }

  function proposalTag(p) {
    if (p?.proposal_category === "MODIFICATION") return "수정";
    if (p?.proposal_category === "DELETION") return "삭제";
    if (p?.proposal_category === "CREATION") return "추가";
    return "제안";
  }

  function renderVoteArea(p) {
    if (!autoByVotes) return null;
    const voteCount = p?.vote_info?.vote_count ?? 0;
    const hasVoted = !!p?.vote_info?.has_voted;
    return (
      <div className="ass-vote">
        <div className="ass-vote-count">{voteCount}/{minVotes}</div>
        <button
          type="button"
          className="dm-btn dm-btn--outline dm-btn--xs"
          onClick={() => onToggleVote?.(p)}
          disabled={isVoting?.(p?.id)}
        >
          {hasVoted ? "철회" : "동의"}
        </button>
      </div>
    );
  }

  // Conclusion votes always on: display vote_count / participantCount
  function renderConclusionVote(p) {
    const voteCount = p?.vote_info?.vote_count ?? 0;
    const hasVoted = !!p?.vote_info?.has_voted;
    return (
      <div className="ass-vote">
        <div className="ass-vote-count">{voteCount}/{participantCount || "-"}</div>
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

  return (
    <div className="ass-list">
      {list.map((c, idx) => {
        const pending = (c?.proposals || []).filter(isPending);
        const cid = c?.id;
        const commentsOpen = openComments.has(cid);
        const comments = commentsById[cid] || [];
        const commentsLoading = !!loadingById[cid];
        const commentsErr = errorById[cid] || "";

        const conclusionPending = (c?.conclusion_proposals || []).filter(isPending);

        return (
          <div key={cid ?? idx} className="ass-card">
            <div className="ass-num">{idx + 1}</div>

            {/* Clicking the card opens comment composer */}
            <div
              className="ass-body"
              onClick={() => onOpenComposer?.({ scope: "criteria", action: "comment", targetIndex: idx, targetId: cid })}
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
                      {renderVoteArea(p)}
                    </div>
                  ))}
                </div>
              )}

              {/* Dropdown bar */}
              <div
                className="cr-comments-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComments(cid);
                }}
              >
                {commentsOpen ? "v" : ">"} 코멘트 ({comments.length})
              </div>

              {/* Dropdown body */}
              {commentsOpen && (
                <div className="cr-comments-body" onClick={(e) => e.stopPropagation()}>
                  {commentsErr && <div className="event-error">{commentsErr}</div>}
                  {commentsLoading ? (
                    <div className="event-muted">불러오는 중...</div>
                  ) : comments.length === 0 ? (
                    <div className="event-muted">-</div>
                  ) : (
                    <div className="cr-comments-list">
                      {comments.map((cm) => (
                        <div key={cm?.id ?? cm?.created_at} className="cr-comment">
                          <div className="cr-comment-head">
                            <span className="cr-comment-name">{cm?.creator_name ?? "-"}</span>
                            <span className="cr-comment-date">{cm?.created_at ?? ""}</span>
                          </div>
                          <div className="cr-comment-content">{cm?.content ?? ""}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conclusion proposals shown under comments dropdown */}
                  {conclusionPending.length > 0 && (
                    <div className="cr-conclusion-wrap">
                      {conclusionPending.map((p) => (
                        <div key={p?.id} className="ass-proposal-row">
                          <div className="ass-tag">결론</div>
                          <div className="ass-proposal-text">
                            <div className="ass-proposal-content">{p?.proposal_content ?? "-"}</div>
                          </div>
                          {renderConclusionVote(p)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="ass-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--outline"
                onClick={() => onOpenComposer?.({ scope: "criteria", action: "conclusion", targetIndex: idx, targetId: cid })}
              >
                결론 제안
              </button>

              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--outline"
                onClick={() => onOpenComposer?.({ scope: "criteria", action: "modify", targetIndex: idx, targetId: cid })}
              >
                수정 제안
              </button>

              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--outline"
                onClick={() => onOpenComposer?.({ scope: "criteria", action: "delete", targetIndex: idx, targetId: cid })}
              >
                삭제 제안
              </button>
            </div>
          </div>
        );
      })}

      <div className="ep-divider--long" />

      {/* Criteria creation proposals */}
      {creates
        .filter((p) => p?.proposal_status === "PENDING" && p?.proposal_category === "CREATION")
        .map((p, i) => (
          <div key={p?.id ?? `cr-create-${i}`} className="ass-card ass-card--create">
            <div className="ass-num">-</div>
            <div className="ass-body">
              <div className="ass-title">{"제안된 기준입니다."}</div>
              <div className="ass-proposals">
                <div className="ass-proposal-row">
                  <div className="ass-tag">추가</div>
                  <div className="ass-proposal-text">
                    <div className="ass-proposal-content">{p?.proposal_content ?? "-"}</div>
                    <div className="ass-proposal-reason">{p?.reason ?? "-"}</div>
                  </div>
                  {/* criteria proposal votes depend on criteria settings */}
                  {/* use renderVoteArea(p) if you want voting on creation proposals too */}
                  {autoByVotes ? renderVoteArea(p) : null}
                </div>
              </div>
            </div>
            <div className="ass-actions" />
          </div>
        ))}
    </div>
  );
}
