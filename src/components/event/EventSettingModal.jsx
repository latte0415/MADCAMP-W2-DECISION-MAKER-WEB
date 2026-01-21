/**
 * 이벤트 설정 모달 컴포넌트 (관리자용)
 * EventCreationModal과 유사하지만 기존 데이터를 수정하는 형태
 */
import React, { useCallback, useEffect, useState } from "react";
import ModalShell from "../ModalShell";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay, getErrorMessage } from "../common/ErrorDisplay";
import { SuccessDisplay } from "../common/SuccessDisplay";
import * as eventsApi from "../../api/events";

const MAX_OPTIONS = 5;
const MAX_ASSUMPTIONS = 10;
const MAX_CRITERIA = 10;


function FieldRow({ label, children }) {
  return (
    <div className="ec-row">
      <div className="ec-label">{label}</div>
      <div className="ec-control">{children}</div>
    </div>
  );
}

function ListEditor({ label, items, setItems, max, placeholder, min = 0, canEdit = true }) {
  const filteredItems = items.filter((item) => item.content !== null);
  const canAdd = filteredItems.length < max && canEdit;

  function updateAt(filteredIdx, newContent) {
    let currentIdx = 0;
    const next = items.map((item) => {
      if (item.content === null) return item;
      if (currentIdx === filteredIdx) {
        currentIdx++;
        return { ...item, content: newContent };
      }
      currentIdx++;
      return item;
    });
    setItems(next);
  }

  function addOne() {
    if (!canAdd) return;
    setItems([...items, { id: null, content: "" }]);
  }

  function removeAt(i) {
    if (items.length <= min) return;
    const next = items.slice();
    const item = next[i];
    if (item.id) {
      // 기존 항목은 삭제 표시 (content를 null로)
      next[i] = { ...item, content: null };
    } else {
      // 새 항목은 배열에서 제거
      next.splice(i, 1);
    }
    setItems(next);
  }

  return (
    <FieldRow label={label}>
      <div className="ec-list">
        {filteredItems.map((item, i) => {
          const canDelete = filteredItems.length > min && canEdit;
          return (
            <div key={item.id || `new-${i}`} className="ec-list-row">
              <input
                className="ec-input"
                value={item.content || ""}
                placeholder={placeholder}
                onChange={(e) => updateAt(i, e.target.value)}
                disabled={!canEdit}
              />
              {canDelete && canEdit && (
                <button
                  type="button"
                  className="ec-btn-delete"
                  onClick={() => {
                    let currentIdx = 0;
                    const targetItem = items.find((it) => {
                      if (it.content === null) return false;
                      if (currentIdx === i) return true;
                      currentIdx++;
                      return false;
                    });
                    if (targetItem) {
                      const actualIdx = items.indexOf(targetItem);
                      if (actualIdx !== -1) {
                        const next = items.slice();
                        if (next[actualIdx].id) {
                          next[actualIdx] = { ...next[actualIdx], content: null };
                        } else {
                          next.splice(actualIdx, 1);
                        }
                        setItems(next);
                      }
                    }
                  }}
                  disabled={!canDelete}
                  aria-label={`${label} ${i + 1} 삭제`}
                  title="삭제"
                >
                  삭제
                </button>
              )}
            </div>
          );
        })}

        {canAdd && (
          <button
            type="button"
            className="ec-btn-add"
            onClick={addOne}
          >
            추가하기
          </button>
        )}

        <div className="ec-hint">
          {filteredItems.length}/{max}
        </div>
      </div>
    </FieldRow>
  );
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="toggle-slider" />
    </label>
  );
}

/**
 * 이벤트 설정 모달
 * @param {boolean} open - 모달 열림 여부
 * @param {string} eventId - 이벤트 ID
 * @param {string} eventStatus - 이벤트 상태
 * @param {Function} onClose - 모달 닫기 핸들러
 * @param {Function} onSuccess - 설정 수정 성공 핸들러
 */
export default function EventSettingModal({ open, eventId, eventStatus, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  // 기본 정보
  const [subject, setSubject] = useState("");
  const [options, setOptions] = useState([]);
  const [assumptions, setAssumptions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [maxMembership, setMaxMembership] = useState(10);
  const [maxMembershipInput, setMaxMembershipInput] = useState("10");

  // 투표 허용 정책
  const [assumptionAutoByVotes, setAssumptionAutoByVotes] = useState(true);
  const [assumptionMinVotes, setAssumptionMinVotes] = useState(3);
  const [assumptionMinVotesInput, setAssumptionMinVotesInput] = useState("3");
  const [criteriaAutoByVotes, setCriteriaAutoByVotes] = useState(true);
  const [criteriaMinVotes, setCriteriaMinVotes] = useState(3);
  const [criteriaMinVotesInput, setCriteriaMinVotesInput] = useState("3");
  const [conclusionApprovalPercent, setConclusionApprovalPercent] = useState(50);
  const [conclusionApprovalPercentInput, setConclusionApprovalPercentInput] = useState("50");

  // 입장 정책
  const [membershipAutoApproved, setMembershipAutoApproved] = useState(true);
  const [entranceCode, setEntranceCode] = useState("");

  // 수정 가능 여부
  const canEditBasicInfo = eventStatus === "NOT_STARTED";
  const canEditMaxMembership = eventStatus !== "FINISHED";
  const canEditPolicies = eventStatus !== "FINISHED";

  // 설정 데이터 불러오기
  useEffect(() => {
    if (!open || !eventId) return;

    let alive = true;
    setLoadingData(true);
    setErrorMsg("");

    (async () => {
      try {
        const data = await eventsApi.getEventSetting(eventId);
        if (alive) {
          setSubject(data.decision_subject || "");
          setOptions(
            (data.options || []).map((opt) => ({
              id: opt.id,
              content: opt.content,
            }))
          );
          setAssumptions(
            (data.assumptions || []).map((ass) => ({
              id: ass.id,
              content: ass.content,
            }))
          );
          setCriteria(
            (data.criteria || []).map((crit) => ({
              id: crit.id,
              content: crit.content,
            }))
          );
          setMaxMembership(data.max_membership || 10);
          setMaxMembershipInput(String(data.max_membership || 10));
          setAssumptionAutoByVotes(data.assumption_is_auto_approved_by_votes ?? true);
          setAssumptionMinVotes(data.assumption_min_votes_required || 3);
          setAssumptionMinVotesInput(String(data.assumption_min_votes_required || 3));
          setCriteriaAutoByVotes(data.criteria_is_auto_approved_by_votes ?? true);
          setCriteriaMinVotes(data.criteria_min_votes_required || 3);
          setCriteriaMinVotesInput(String(data.criteria_min_votes_required || 3));
          setConclusionApprovalPercent(data.conclusion_approval_threshold_percent || 50);
          setConclusionApprovalPercentInput(String(data.conclusion_approval_threshold_percent || 50));
          setMembershipAutoApproved(data.membership_is_auto_approved ?? true);
          setEntranceCode(data.entrance_code || "");
        }
      } catch (err) {
        if (alive) setErrorMsg(getErrorMessage(err));
      } finally {
        if (alive) setLoadingData(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, eventId]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSubject("");
      setOptions([]);
      setAssumptions([]);
      setCriteria([]);
      setMaxMembership(10);
      setMaxMembershipInput("10");
      setAssumptionAutoByVotes(true);
      setAssumptionMinVotes(3);
      setAssumptionMinVotesInput("3");
      setCriteriaAutoByVotes(true);
      setCriteriaMinVotes(3);
      setCriteriaMinVotesInput("3");
      setConclusionApprovalPercent(50);
      setConclusionApprovalPercentInput("50");
      setMembershipAutoApproved(true);
      setEntranceCode("");
      setErrorMsg("");
    }
  }, [open]);

  // 설정 수정 제출
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {};

      // 기본 정보 (NOT_STARTED일 때만 수정 가능)
      if (canEditBasicInfo) {
        if (subject.trim()) payload.decision_subject = subject.trim();
        payload.options = options.filter((opt) => opt.content !== null);
        payload.assumptions = assumptions.filter((ass) => ass.content !== null);
        payload.criteria = criteria.filter((crit) => crit.content !== null);
      }

      // 최대 인원 (FINISHED가 아닐 때 수정 가능)
      if (canEditMaxMembership) {
        payload.max_membership = maxMembership;
      }

      // 투표 허용 정책 및 입장 정책 (FINISHED가 아닐 때 수정 가능)
      if (canEditPolicies) {
        payload.assumption_is_auto_approved_by_votes = assumptionAutoByVotes;
        if (assumptionAutoByVotes) {
          payload.assumption_min_votes_required = assumptionMinVotes;
        }
        payload.criteria_is_auto_approved_by_votes = criteriaAutoByVotes;
        if (criteriaAutoByVotes) {
          payload.criteria_min_votes_required = criteriaMinVotes;
        }
        payload.conclusion_approval_threshold_percent = conclusionApprovalPercent;
        payload.membership_is_auto_approved = membershipAutoApproved;
      }

      await eventsApi.updateEvent(eventId, payload);
      setSuccessMsg("수정이 완료되었습니다.");
      onSuccess?.();
      // Don't close the modal - let user continue editing if needed
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    eventId,
    canEditBasicInfo,
    canEditMaxMembership,
    canEditPolicies,
    subject,
    options,
    assumptions,
    criteria,
    maxMembership,
    assumptionAutoByVotes,
    assumptionMinVotes,
    criteriaAutoByVotes,
    criteriaMinVotes,
    conclusionApprovalPercent,
    membershipAutoApproved,
    onClose,
    onSuccess,
  ]);

  if (!open) return null;

  return (
    <ModalShell open={open} title="이벤트 설정" onClose={onClose}>
      <div className="ec-modal-body" style={{ padding: "var(--spacing-6) var(--spacing-6)" }}>
        {loadingData && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <LoadingSpinner message="설정 정보를 불러오는 중..." />
          </div>
        )}

        {!loadingData && (
          <>
            {successMsg && <SuccessDisplay message={successMsg} onDismiss={() => setSuccessMsg("")} />}
            {errorMsg && <div className="ec-error">{errorMsg}</div>}

            {!canEditBasicInfo && (
              <div className="ec-error" style={{ background: "rgba(245, 158, 11, 0.1)", borderLeftColor: "var(--color-warning)" }}>
                기본 정보는 이벤트가 시작되기 전(NOT_STARTED)에만 수정할 수 있습니다.
              </div>
            )}

            {eventStatus === "FINISHED" && (
              <div className="ec-error" style={{ background: "rgba(245, 158, 11, 0.1)", borderLeftColor: "var(--color-warning)" }}>
                이벤트가 종료되어 일부 설정은 수정할 수 없습니다.
              </div>
            )}

            <div className="ec-section">
              <div className="ec-section-title">기본 정보</div>

              <FieldRow label="주제">
                <input
                  className="ec-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!canEditBasicInfo}
                />
              </FieldRow>
              <div className="ec-spacer" />

              <ListEditor
                label="선택지"
                items={options}
                setItems={setOptions}
                max={MAX_OPTIONS}
                placeholder=""
                min={1}
                canEdit={canEditBasicInfo}
              />
              <div className="ec-spacer" />

              <ListEditor
                label="전제"
                items={assumptions}
                setItems={setAssumptions}
                max={MAX_ASSUMPTIONS}
                placeholder=""
                min={0}
                canEdit={canEditBasicInfo}
              />
              <div className="ec-spacer" />

              <ListEditor
                label="기준"
                items={criteria}
                setItems={setCriteria}
                max={MAX_CRITERIA}
                placeholder=""
                min={0}
                canEdit={canEditBasicInfo}
              />
              <div className="ec-spacer" />

              <FieldRow label="최대 인원">
                <input
                  className={`ec-input ec-input--small ${
                    maxMembershipInput === ""
                      ? ""
                      : /^\d+$/.test(maxMembershipInput) && parseInt(maxMembershipInput, 10) >= 1
                      ? "ec-input--valid"
                      : "ec-input--invalid"
                  }`}
                  type="text"
                  value={maxMembershipInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMaxMembershipInput(val);
                    if (/^\d+$/.test(val)) {
                      const num = parseInt(val, 10);
                      if (num >= 1) {
                        setMaxMembership(num);
                      }
                    }
                  }}
                  disabled={!canEditMaxMembership}
                />
              </FieldRow>
            </div>

            <div className="homepage-divider"/>
            <div className="ec-section ec-section--vote">
              <div className="ec-section-title">투표 허용 정책</div>

              <FieldRow 
                label={
                  <>
                    전제 <span className="ec-label-sep">|</span> 투표로 제안/편집 허용하기
                  </>
                }
              >
                <div className="ec-inline">
                  <Toggle 
                    checked={assumptionAutoByVotes} 
                    onChange={setAssumptionAutoByVotes}
                    disabled={!canEditPolicies}
                  />
                  <span className="ec-spacer-inline" />
                  <div className="ec-inline-label">허용하는 최소 투표수</div>
                  <input
                    className={`ec-input ec-input--small ${
                      assumptionMinVotesInput === ""
                        ? ""
                        : /^\d+$/.test(assumptionMinVotesInput) && parseInt(assumptionMinVotesInput, 10) >= 1
                        ? "ec-input--valid"
                        : "ec-input--invalid"
                    }`}
                    type="text"
                    disabled={!assumptionAutoByVotes || !canEditPolicies}
                    value={assumptionMinVotesInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssumptionMinVotesInput(val);
                      if (/^\d+$/.test(val)) {
                        const num = parseInt(val, 10);
                        if (num >= 1) {
                          setAssumptionMinVotes(num);
                        }
                      }
                    }}
                  />
                </div>
              </FieldRow>

              <FieldRow 
                label={
                  <>
                    기준 <span className="ec-label-sep">|</span> 투표로 제안/편집 허용하기
                  </>
                }
              >
                <div className="ec-inline">
                  <Toggle 
                    checked={criteriaAutoByVotes} 
                    onChange={setCriteriaAutoByVotes}
                    disabled={!canEditPolicies}
                  />
                  <span className="ec-spacer-inline" />
                  <div className="ec-inline-label">허용하는 최소 투표수</div>
                  <input
                    className={`ec-input ec-input--small ${
                      criteriaMinVotesInput === ""
                        ? ""
                        : /^\d+$/.test(criteriaMinVotesInput) && parseInt(criteriaMinVotesInput, 10) >= 1
                        ? "ec-input--valid"
                        : "ec-input--invalid"
                    }`}
                    type="text"
                    disabled={!criteriaAutoByVotes || !canEditPolicies}
                    value={criteriaMinVotesInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCriteriaMinVotesInput(val);
                      if (/^\d+$/.test(val)) {
                        const num = parseInt(val, 10);
                        if (num >= 1) {
                          setCriteriaMinVotes(num);
                        }
                      }
                    }}
                  />
                </div>
              </FieldRow>

              <FieldRow 
                label={
                  <>
                    결론 <span className="ec-label-sep">|</span> 승인되는 동의 최소 퍼센티지
                  </>
                }
              >
                <input
                  className={`ec-input ec-input--small ${
                    conclusionApprovalPercentInput === ""
                      ? ""
                      : /^\d+$/.test(conclusionApprovalPercentInput) && parseInt(conclusionApprovalPercentInput, 10) >= 1 && parseInt(conclusionApprovalPercentInput, 10) <= 100
                      ? "ec-input--valid"
                      : "ec-input--invalid"
                  }`}
                  type="text"
                  disabled={!canEditPolicies}
                  value={conclusionApprovalPercentInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConclusionApprovalPercentInput(val);
                    if (/^\d+$/.test(val)) {
                      const num = parseInt(val, 10);
                      if (num >= 1 && num <= 100) {
                        setConclusionApprovalPercent(num);
                      }
                    }
                  }}
                />
              </FieldRow>
            </div>

            <div className="homepage-divider"/>
            <div className="ec-section ec-section--entry">
              <div className="ec-section-title">입장 정책</div>

              <FieldRow label="가입 자동 승인">
                <Toggle
                  checked={membershipAutoApproved}
                  onChange={setMembershipAutoApproved}
                  disabled={!canEditPolicies}
                />
              </FieldRow>

              <FieldRow label="입장 코드">
                <div 
                  className="ec-input ec-input--code"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!entranceCode) return;
                    try {
                      await navigator.clipboard.writeText(entranceCode);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 2000);
                    } catch (err) {
                      console.error('복사 실패:', err);
                    }
                  }}
                  title="클릭하여 복사"
                  style={{ 
                    cursor: entranceCode ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    userSelect: 'none'
                  }}
                >
                  {entranceCode}
                  {entranceCode && (
                    <svg 
                      className="event-code-icon" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </div>
              </FieldRow>
            </div>

            <div className="ec-footer">
              <button type="button" className="dm-btn dm-btn--outline" onClick={onClose}>
                취소
              </button>
              <button
                type="button"
                className="dm-btn ec-create-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "수정 중..." : "수정하기"}
              </button>
            </div>
          </>
        )}
      </div>

      {showToast && (
        <div className="toast-message">
          복사되었습니다.
        </div>
      )}
    </ModalShell>
  );
}
