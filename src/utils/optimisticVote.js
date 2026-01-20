// src/utils/optimisticVote.js

function normalizeVoteInfo(vote_info) {
  return {
    vote_count: Number.isFinite(vote_info?.vote_count) ? vote_info.vote_count : 0,
    has_voted: !!vote_info?.has_voted,
  };
}

// Update vote_info for a proposalId across targets in `detail`
export function setVoteInfoInDetail(prevDetail, proposalId, nextVoteInfo, targets) {
  if (!prevDetail) return prevDetail;

  let anyChanged = false;
  const nextDetail = { ...prevDetail };

  for (const t of targets) {
    if (t.kind === "flat") {
      const arr = Array.isArray(prevDetail[t.key]) ? prevDetail[t.key] : [];
      let changed = false;

      const newArr = arr.map((p) => {
        if (!p || p.id !== proposalId) return p;
        changed = true;
        return { ...p, vote_info: { ...normalizeVoteInfo(p.vote_info), ...nextVoteInfo } };
      });

      if (changed) {
        anyChanged = true;
        nextDetail[t.key] = newArr;
      }
    }

    if (t.kind === "nested") {
      const parents = Array.isArray(prevDetail[t.key]) ? prevDetail[t.key] : [];
      let changed = false;

      const newParents = parents.map((parent) => {
        const props = Array.isArray(parent?.[t.proposalsKey]) ? parent[t.proposalsKey] : [];
        let parentChanged = false;

        const newProps = props.map((p) => {
          if (!p || p.id !== proposalId) return p;
          parentChanged = true;
          return { ...p, vote_info: { ...normalizeVoteInfo(p.vote_info), ...nextVoteInfo } };
        });

        if (!parentChanged) return parent;
        changed = true;
        return { ...parent, [t.proposalsKey]: newProps };
      });

      if (changed) {
        anyChanged = true;
        nextDetail[t.key] = newParents;
      }
    }
  }

  return anyChanged ? nextDetail : prevDetail;
}
