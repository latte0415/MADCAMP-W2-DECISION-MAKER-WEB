// src/utils/voteTargets.js

export const VOTE_TARGETS = {
  assumption: [
    { kind: "nested", key: "assumptions", proposalsKey: "proposals" },
    { kind: "flat", key: "assumption_creation_proposals" },
  ],

  criteria: [
    { kind: "nested", key: "criteria", proposalsKey: "proposals" },
    { kind: "flat", key: "criteria_creation_proposals" },
  ],

  conclusion: [
    { kind: "nested", key: "criteria", proposalsKey: "conclusion_proposals" },
  ],
};
