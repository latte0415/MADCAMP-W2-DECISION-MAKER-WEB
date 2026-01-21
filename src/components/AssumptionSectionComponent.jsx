import { ProposalAdminActions } from "./event/ProposalAdminActions";

export default function AssumptionsSection({
  assumptions,
  creationProposals,
  participantCount,
  onToggleVote,
  isVoting,
  onOpenComposer,
  isAdmin = false,
  eventId,
  eventStatus,
  onProposalStatusChange,
}) {
  const list = Array.isArray(assumptions) ? assumptions.filter((a) => !a?.is_deleted) : [];
  const creates = Array.isArray(creationProposals) ? creationProposals : [];

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
          onClick={() => onToggleVote?.(p)}
          disabled={isVoting?.(p?.id) || eventStatus !== "IN_PROGRESS"}
        >
          {hasVoted ? "철회" : "동의"}
        </button>
      </div>
    );
  }

  return (
    <div className="ass-list">
      {list.map((a, idx) => {
        const pending = (a?.proposals || []).filter(isPending);

        return (
          <div key={a?.id ?? idx} id={`assumption-${idx}`} className={`ass-card ${pending.length > 0 ? 'ass-card--has-proposals' : ''}`}>
            <div className="ass-num">{idx + 1}</div>

            <div className="ass-body">
              <div className="ass-title-row">
                <div className="ass-title">{a?.content ?? "-"}</div>
                {pending.length > 0 && (
                  <div className="ass-actions">
                    <div className="ass-actions-row">
                      <button
                        type="button"
                        className="ass-action-icon"
                        onClick={() => onOpenComposer?.({ scope: "assumption", action: "modify", targetIndex: idx, targetId: a.id })}
                        disabled={eventStatus !== "IN_PROGRESS"}
                        title="수정 제안"
                        aria-label="수정 제안"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="ass-action-icon ass-action-icon--delete"
                        onClick={() =>  onOpenComposer?.({ scope: "assumption", action: "delete", targetIndex: idx, targetId: a.id })}
                        disabled={eventStatus !== "IN_PROGRESS"}
                        title="삭제 제안"
                        aria-label="삭제 제안"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                          // DELETION (content is null by design)
                          <div className="ass-proposal-reason">{p?.reason ?? "-"}</div>
                        )}
                      </div>

                      {renderVoteArea(p)}
                      {isAdmin && (
                        <ProposalAdminActions
                          eventId={eventId}
                          proposalId={p?.id}
                          proposalType="assumption"
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

            {pending.length === 0 && (
              <div className="ass-actions">
                <div className="ass-actions-row">
                  <button
                    type="button"
                    className="ass-action-icon"
                    onClick={() => onOpenComposer?.({ scope: "assumption", action: "modify", targetIndex: idx, targetId: a.id })}
                    disabled={eventStatus !== "IN_PROGRESS"}
                    title="수정 제안"
                    aria-label="수정 제안"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="ass-action-icon ass-action-icon--delete"
                    onClick={() =>  onOpenComposer?.({ scope: "assumption", action: "delete", targetIndex: idx, targetId: a.id })}
                    disabled={eventStatus !== "IN_PROGRESS"}
                    title="삭제 제안"
                    aria-label="삭제 제안"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Creation proposals appended after assumptions */}
      {creates
        .filter((p) => p?.proposal_status === "PENDING" && p?.proposal_category === "CREATION")
        .map((p, i) => {
          return (
            <div key={p?.id ?? `create-${i}`} className="ass-card ass-card--create">
              <div className="ass-num">{"-"}</div>

            <div className="ass-body">
              <div className="ass-proposals">
                  <div className="ass-proposal-row">
                    <div className="ass-tag">추가</div>

                    <div className="ass-proposal-text">
                      <div className="ass-proposal-content">{p?.proposal_content ?? "-"}</div>
                      <div className="ass-proposal-reason">{p?.reason ?? "-"}</div>
                    </div>

                    {renderVoteArea(p)}
                    {isAdmin && (
                      <ProposalAdminActions
                        eventId={eventId}
                        proposalId={p?.id}
                        proposalType="assumption"
                        currentStatus={p?.proposal_status}
                        eventStatus={eventStatus}
                        onStatusChange={onProposalStatusChange}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="ass-actions" />
            </div>
          );
        })}
    </div>
  );
}
