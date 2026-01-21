import React, { useMemo } from "react";

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
  collapsed = false,
  onToggleCollapse,
  config, // { scope, action, targetIndex, targetId }
  content,
  reason,
  setContent,
  setReason,
  submitting,
  errorMsg,
  onClose,
  onSubmit,
  onConfigChange, // config 변경 핸들러
  assumptions = [], // 전제 목록
  criteria = [], // 기준 목록
}) {
  if (!open) return null;
  
  // config가 없으면 기본값 사용
  const effectiveConfig = config || { scope: "assumption", action: "create", targetIndex: null, targetId: null };

  const showContent = effectiveConfig.action !== "delete";     // delete hides content
  const showReason  = effectiveConfig.action === "create" || effectiveConfig.action === "modify" || effectiveConfig.action === "delete";

  
const contentPlaceholder =
  effectiveConfig.action === "comment"
    ? "코멘트를 입력하세요."
    : effectiveConfig.action === "conclusion"
    ? "결론을 입력하세요."
    : "작성할 내용을 입력하세요.";

const reasonPlaceholder = "이유를 입력하세요.";

  // 드롭다운 옵션 생성
  const scopeOptions = [
    { value: "assumption", label: "전제" },
    { value: "criteria", label: "기준" },
  ];

  const actionOptions = useMemo(() => {
    const baseActions = [
      { value: "create", label: "추가" },
      { value: "modify", label: "수정" },
      { value: "delete", label: "삭제" },
    ];
    
    if (effectiveConfig.scope === "criteria") {
      return [
        ...baseActions,
        { value: "comment", label: "코멘트" },
        { value: "conclusion", label: "결론" },
      ];
    }
    
    return baseActions;
  }, [effectiveConfig.scope]);

  const targetOptions = useMemo(() => {
    const items = effectiveConfig.scope === "assumption" ? assumptions : criteria;
    return items.map((item, index) => ({
      value: index,
      label: `${index + 1}번`,
      id: item.id,
    }));
  }, [effectiveConfig.scope, assumptions, criteria]);

  const handleScopeChange = (e) => {
    const newScope = e.target.value;
    onConfigChange?.({
      ...effectiveConfig,
      scope: newScope,
      targetIndex: null,
      targetId: null,
    });
  };

  const handleActionChange = (e) => {
    const newAction = e.target.value;
    const items = effectiveConfig.scope === "assumption" ? assumptions : criteria;
    const firstItemId = items.length > 0 ? items[0].id : null;
    
    onConfigChange?.({
      ...effectiveConfig,
      action: newAction,
      targetIndex: newAction === "create" ? null : (effectiveConfig.targetIndex ?? 0),
      targetId: newAction === "create" ? null : (effectiveConfig.targetId ?? firstItemId),
    });
  };

  const handleTargetChange = (e) => {
    const selectedIndex = parseInt(e.target.value);
    const selectedTarget = targetOptions[selectedIndex];
    onConfigChange?.({
      ...effectiveConfig,
      targetIndex: selectedIndex,
      targetId: selectedTarget?.id || null,
    });
  };

  const canSubmit = useMemo(() => {
    if (submitting) return false;

    if (effectiveConfig.action === "comment" || effectiveConfig.action === "conclusion") {
      return content.trim().length > 0;
    }

    if (effectiveConfig.action === "delete") {
      return reason.trim().length > 0;
    }

    // create/modify
    return content.trim().length > 0 && reason.trim().length > 0;
  }, [submitting, effectiveConfig.action, content, reason]);

  return (
    <div className={`pc-wrap ${collapsed ? 'pc-wrap--collapsed' : ''}`} role="region" aria-label="Proposal Composer">
      <div className="pc-top">
        <button 
          type="button" 
          className={`dm-btn dm-btn--ghost pc-toggle ${collapsed ? 'pc-toggle--collapsed' : ''}`}
          onClick={onToggleCollapse} 
          aria-label={collapsed ? "펼치기" : "접기"}
        >
          ▶
        </button>

        <div className="pc-selects">
          <select
            className="pc-select"
            value={effectiveConfig.scope}
            onChange={handleScopeChange}
            disabled={submitting}
          >
            {scopeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="pc-select"
            value={effectiveConfig.action}
            onChange={handleActionChange}
            disabled={submitting}
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="pc-select"
            value={effectiveConfig.action === "create" ? "" : (effectiveConfig.targetIndex ?? 0)}
            onChange={handleTargetChange}
            disabled={submitting || effectiveConfig.action === "create"}
          >
            {effectiveConfig.action === "create" && <option value="">-</option>}
            {targetOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!collapsed && (
        <>
          {errorMsg && <div className="pc-error">{errorMsg}</div>}

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
              <button type="button" className="dm-btn pc-submit" disabled={!canSubmit} onClick={onSubmit}>
                {submitting ? "제안 중..." : "제안"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
