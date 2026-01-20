import React, { useMemo, useCallback } from "react";
import EventErrorBanner from "../components/EventErrorBanner";

function actionLabel(action) {
  switch (action) {
    case "create":
      return "추가";
    case "modify":
      return "수정";
    case "delete":
      return "삭제";
    case "comment":
      return "코멘트";
    case "conclusion":
      return "결론";
    default:
      return "-";
  }
}

function scopeLabel(scope) {
  switch (scope) {
    case "assumption":
      return "전제";
    case "criteria":
      return "기준";
    default:
      return "-";
  }
}

export default function ProposalComposer({
  open,
  config, // { scope, action, targetIndex, targetId }
  content,
  reason,
  setContent,
  setReason,
  submitting,
  errorMsg,
  onClose,
  onSubmit,

  // NEW (optional): lets the banner close button clear the error
  onClearError,
}) {
  if (!open || !config) return null;

  const showContent = config.action !== "delete"; // delete hides content
  const showReason =
    config.action === "create" ||
    config.action === "modify" ||
    config.action === "delete";

  const contentPlaceholder =
    config.action === "comment"
      ? "코멘트를 입력하세요."
      : config.action === "conclusion"
      ? "결론을 입력하세요."
      : "작성할 내용을 입력하세요.";

  const reasonPlaceholder = "이유를 입력하세요.";

  const pills = useMemo(() => {
    const p1 = scopeLabel(config.scope);
    const p2 = config.action === "create" ? "-" : String((config.targetIndex ?? 0) + 1);
    const p3 = actionLabel(config.action);
    return [p1, p2, p3];
  }, [config]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;

    if (config.action === "comment" || config.action === "conclusion") {
      return content.trim().length > 0;
    }

    if (config.action === "delete") {
      return reason.trim().length > 0;
    }

    // create/modify
    return content.trim().length > 0 && reason.trim().length > 0;
  }, [submitting, config.action, content, reason]);

  const clearError = useCallback(() => {
    onClearError?.();
  }, [onClearError]);

  const handleClose = useCallback(() => {
    // close should also clear any existing error, to match “login” behavior
    clearError();
    onClose?.();
  }, [clearError, onClose]);

  return (
    <>
      {/* Login-style popup error banner */}
      <EventErrorBanner message={errorMsg} onClose={clearError} />

      <div className="pc-wrap" role="region" aria-label="Proposal Composer">
        <div className="pc-top">
          <button
            type="button"
            className="dm-btn dm-btn--ghost pc-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>

          <div className="pc-pills">
            {pills.map((p, i) => (
              <span key={i} className="pc-pill">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="pc-body">
          <div className="pc-inputs">
            {showContent && (
              <textarea
                className="pc-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={contentPlaceholder}
                rows={2}
              />
            )}

            {showReason && (
              <textarea
                className="pc-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={2}
              />
            )}
          </div>

          <div className="pc-actions">
            <button
              type="button"
              className="dm-btn pc-submit"
              disabled={!canSubmit}
              onClick={onSubmit}
            >
              {submitting ? "제안 중..." : "제안"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
