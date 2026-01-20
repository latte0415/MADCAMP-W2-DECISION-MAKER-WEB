import { useCallback, useState } from "react";
import * as proposalsApi from "../api/proposals";
import * as commentsApi from "../api/comments";

export function useProposalComposer({ eventId, fetchDetail }) {
  const [composer, setComposer] = useState(null);
  const [draftContent, setDraftContent] = useState("");
  const [draftReason, setDraftReason] = useState("");
  const [composerErr, setComposerErr] = useState("");
  const [composerSubmitting, setComposerSubmitting] = useState(false);

  const [commentRefresh, setCommentRefresh] = useState(null);
  const bumpCommentRefresh = useCallback((criterionId) => {
    setCommentRefresh({ criterionId, nonce: Date.now() });
  }, []);

  const openComposer = useCallback((cfg) => {
    setComposerErr("");
    setComposer(cfg);
    setDraftContent("");
    setDraftReason("");
  }, []);

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
      if (composer.scope === "criteria" && composer.action === "comment") {
        await commentsApi.createCriteriaComment(eventId, composer.targetId, { content });
        bumpCommentRefresh(composer.targetId);
      } else if (composer.scope === "criteria" && composer.action === "conclusion") {
        await proposalsApi.createConclusionProposal(eventId, composer.targetId, { proposal_content: content });
        await fetchDetail();
      } else {
        const actionToCategory = { create: "CREATION", modify: "MODIFICATION", delete: "DELETION" };
        const proposal_category = actionToCategory[composer.action];
        const proposal_content = composer.action === "delete" ? null : content;

        if (composer.scope === "assumption") {
          await proposalsApi.createAssumptionProposal(eventId, {
            proposal_category,
            assumption_id: composer.action === "create" ? null : composer.targetId,
            proposal_content,
            reason,
          });
        } else if (composer.scope === "criteria") {
          await proposalsApi.createCriteriaProposal(eventId, {
            proposal_category,
            criteria_id: composer.action === "create" ? null : composer.targetId,
            proposal_content,
            reason,
          });
        } else {
          throw new Error("Unknown proposal scope");
        }

        await fetchDetail();
      }

      closeComposer();
    } catch (err) {
      setComposerErr(err?.message || "제안에 실패했습니다.");
    } finally {
      setComposerSubmitting(false);
    }
  }, [composer, eventId, draftContent, draftReason, fetchDetail, bumpCommentRefresh, closeComposer]);

  return {
    composer,
    draftContent,
    draftReason,
    composerErr,
    composerSubmitting,
    openComposer,
    closeComposer,
    submitComposer,
    setDraftContent,
    setDraftReason,
    commentRefresh,
  };
}
