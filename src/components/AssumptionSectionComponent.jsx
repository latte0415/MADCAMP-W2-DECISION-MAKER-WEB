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
  onProposalStatusChange,
}) {
  const list = Array.isArray(assumptions) ? assumptions : [];
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
          disabled={isVoting?.(p?.id)}
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
          <div key={a?.id ?? idx} className="ass-card">
            <div className="ass-num">{idx + 1}</div>

            <div className="ass-body">
              <div className="ass-title">{a?.content ?? "-"}</div>

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
                          onStatusChange={onProposalStatusChange}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ass-actions">
              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--outline"
                onClick={() => onOpenComposer?.({ scope: "assumption", action: "modify", targetIndex: idx, targetId: a.id })}
              >
                수정 제안
              </button>
              <button
                type="button"
                className="dm-btn dm-btn--sm dm-btn--outline"
                onClick={() =>  onOpenComposer?.({ scope: "assumption", action: "delete", targetIndex: idx, targetId: a.id })}
              >
                삭제 제안
              </button>
            </div>
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
                <div className="ass-title">{"제안된 전제입니다."}</div>
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
