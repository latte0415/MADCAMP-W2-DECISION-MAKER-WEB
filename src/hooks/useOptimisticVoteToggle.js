// src/hooks/useOptimisticVoteToggle.js
import { useCallback, useRef } from "react";
import { setVoteInfoInDetail } from "../utils/optimisticVote";

export function useOptimisticVoteToggle({
  eventId,
  targets,
  setDetail,
  setErrMsg,          // optional
  castVoteApi,        // (eventId, proposalId) => Promise
  retrieveVoteApi,    // (eventId, proposalId) => Promise
}) {
  const inFlightRef = useRef(new Set());

  const toggleVote = useCallback(
    async (proposal) => {
      const proposalId = proposal?.id;
      if (!eventId || !proposalId) return;

      // prevent double-click races
      if (inFlightRef.current.has(proposalId)) return;
      inFlightRef.current.add(proposalId);

      const beforeCount = Number.isFinite(proposal?.vote_info?.vote_count)
        ? proposal.vote_info.vote_count
        : 0;

      const beforeHas = !!proposal?.vote_info?.has_voted;

      const afterHas = !beforeHas;
      const afterCount = Math.max(0, beforeCount + (afterHas ? 1 : -1));

      // 1) optimistic apply
      setDetail((prev) =>
        setVoteInfoInDetail(prev, proposalId, { has_voted: afterHas, vote_count: afterCount }, targets)
      );

      try {
        // 2) call correct API
        if (!beforeHas) await castVoteApi(eventId, proposalId);
        else await retrieveVoteApi(eventId, proposalId);
      } catch (err) {
        // 3) rollback to exact previous state
        setDetail((prev) =>
          setVoteInfoInDetail(prev, proposalId, { has_voted: beforeHas, vote_count: beforeCount }, targets)
        );
        setErrMsg?.(err?.message || "투표 처리에 실패했습니다.");
      } finally {
        inFlightRef.current.delete(proposalId);
      }
    },
    [eventId, targets, setDetail, setErrMsg, castVoteApi, retrieveVoteApi]
  );

  const isVoting = useCallback((proposalId) => inFlightRef.current.has(proposalId), []);

  return { toggleVote, isVoting };
}
