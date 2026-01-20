/**
 * 이벤트 설정 모달 컴포넌트 (관리자용)
 * EventCreationModal과 유사하지만 기존 데이터를 수정하는 형태
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay, getErrorMessage } from "../common/ErrorDisplay";
import * as eventsApi from "../../api/events";

const MAX_OPTIONS = 5;
const MAX_ASSUMPTIONS = 10;
const MAX_CRITERIA = 10;

function trimNonEmpty(list) {
  return list.map((s) => s.trim()).filter((s) => s.length > 0);
}

function FieldRow({ label, children }) {
  return (
    <div className="ec-row">
      <div className="ec-label">{label}</div>
      <div className="ec-control">{children}</div>
    </div>
  );
}

function ListEditor({ label, items, setItems, max, placeholder, min = 0, canEdit = true }) {
  const canAdd = items.length < max && canEdit;

  function updateAt(i, v) {
    const next = items.slice();
    next[i] = v;
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
        {items
          .filter((item) => item.content !== null)
          .map((item, i) => {
            const canDelete = items.filter((it) => it.content !== null).length > min && canEdit;
            return (
              <div key={item.id || `new-${i}`} className="ec-list-row">
                <input
                  className="ec-input"
                  value={item.content || ""}
                  placeholder={placeholder}
                  onChange={(e) => updateAt(i, { ...item, content: e.target.value })}
                  disabled={!canEdit}
                />
                {canDelete && canEdit && (
                  <button
                    type="button"
                    className="dm-btn dm-btn--ghost"
                    onClick={() => removeAt(i)}
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
            className="dm-btn dm-btn--outline dm-btn--submit"
            onClick={addOne}
          >
            추가하기
          </button>
        )}

        <div className="ec-hint">
          {items.filter((item) => item.content !== null).length}/{max}
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

  // 기본 정보
  const [subject, setSubject] = useState("");
  const [options, setOptions] = useState([]);
  const [assumptions, setAssumptions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [maxMembership, setMaxMembership] = useState(10);

  // 투표 허용 정책
  const [assumptionAutoByVotes, setAssumptionAutoByVotes] = useState(true);
  const [assumptionMinVotes, setAssumptionMinVotes] = useState(3);
  const [criteriaAutoByVotes, setCriteriaAutoByVotes] = useState(true);
  const [criteriaMinVotes, setCriteriaMinVotes] = useState(3);
  const [conclusionApprovalPercent, setConclusionApprovalPercent] = useState(50);

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
          setAssumptionAutoByVotes(data.assumption_is_auto_approved_by_votes ?? true);
          setAssumptionMinVotes(data.assumption_min_votes_required || 3);
          setCriteriaAutoByVotes(data.criteria_is_auto_approved_by_votes ?? true);
          setCriteriaMinVotes(data.criteria_min_votes_required || 3);
          setConclusionApprovalPercent(data.conclusion_approval_threshold_percent || 50);
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
      setAssumptionAutoByVotes(true);
      setAssumptionMinVotes(3);
      setCriteriaAutoByVotes(true);
      setCriteriaMinVotes(3);
      setConclusionApprovalPercent(50);
      setMembershipAutoApproved(true);
      setEntranceCode("");
      setErrorMsg("");
    }
  }, [open]);

  // 설정 수정 제출
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

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
      onSuccess?.();
      onClose();
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
      <div className="ec-modal-content">
        {loadingData && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <LoadingSpinner message="설정 정보를 불러오는 중..." />
          </div>
        )}

        {!loadingData && (
          <>
            {errorMsg && <ErrorDisplay message={errorMsg} dismissible onDismiss={() => setErrorMsg("")} />}

            {!canEditBasicInfo && (
              <div className="ec-warning">
                기본 정보는 이벤트가 시작되기 전(NOT_STARTED)에만 수정할 수 있습니다.
              </div>
            )}

            {eventStatus === "FINISHED" && (
              <div className="ec-warning">
                이벤트가 종료되어 일부 설정은 수정할 수 없습니다.
              </div>
            )}

            <div className="ec-section">
              <h3 className="ec-section-title">기본 정보</h3>

              <FieldRow label="주제">
                <input
                  className="ec-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!canEditBasicInfo}
                  placeholder="의사결정 주제"
                />
              </FieldRow>

              <ListEditor
                label="선택지"
                items={options}
                setItems={setOptions}
                max={MAX_OPTIONS}
                placeholder="선택지 내용"
                min={1}
                canEdit={canEditBasicInfo}
              />

              <ListEditor
                label="전제"
                items={assumptions}
                setItems={setAssumptions}
                max={MAX_ASSUMPTIONS}
                placeholder="전제 내용"
                min={0}
                canEdit={canEditBasicInfo}
              />

              <ListEditor
                label="기준"
                items={criteria}
                setItems={setCriteria}
                max={MAX_CRITERIA}
                placeholder="기준 내용"
                min={0}
                canEdit={canEditBasicInfo}
              />

              <FieldRow label="최대 인원">
                <input
                  type="number"
                  className="ec-input"
                  value={maxMembership}
                  onChange={(e) => setMaxMembership(parseInt(e.target.value, 10) || 1)}
                  disabled={!canEditMaxMembership}
                  min={1}
                />
              </FieldRow>
            </div>

            <div className="ec-section">
              <h3 className="ec-section-title">투표 허용 정책</h3>

              <FieldRow label="투표로 전제 제안/편집 허용하기">
                <Toggle
                  checked={assumptionAutoByVotes}
                  onChange={setAssumptionAutoByVotes}
                  disabled={!canEditPolicies}
                />
              </FieldRow>

              {assumptionAutoByVotes && (
                <FieldRow label="전제 제안/편집 허용하는 최소 투표 수">
                  <input
                    type="number"
                    className="ec-input"
                    value={assumptionMinVotes}
                    onChange={(e) => setAssumptionMinVotes(parseInt(e.target.value, 10) || 1)}
                    disabled={!canEditPolicies}
                    min={1}
                  />
                </FieldRow>
              )}

              <FieldRow label="투표로 기준 제안/편집 허용하기">
                <Toggle
                  checked={criteriaAutoByVotes}
                  onChange={setCriteriaAutoByVotes}
                  disabled={!canEditPolicies}
                />
              </FieldRow>

              {criteriaAutoByVotes && (
                <FieldRow label="기준 제안/편집 허용하는 최소 투표 수">
                  <input
                    type="number"
                    className="ec-input"
                    value={criteriaMinVotes}
                    onChange={(e) => setCriteriaMinVotes(parseInt(e.target.value, 10) || 1)}
                    disabled={!canEditPolicies}
                    min={1}
                  />
                </FieldRow>
              )}

              <FieldRow label="결론이 승인되는 최소 동의 투표 퍼센티지">
                <input
                  type="number"
                  className="ec-input"
                  value={conclusionApprovalPercent}
                  onChange={(e) => setConclusionApprovalPercent(parseInt(e.target.value, 10) || 1)}
                  disabled={!canEditPolicies}
                  min={1}
                  max={100}
                />
                <span className="ec-hint">%</span>
              </FieldRow>
            </div>

            <div className="ec-section">
              <h3 className="ec-section-title">입장 정책</h3>

              <FieldRow label="가입 승인 자동 여부">
                <Toggle
                  checked={membershipAutoApproved}
                  onChange={setMembershipAutoApproved}
                  disabled={!canEditPolicies}
                />
              </FieldRow>

              <FieldRow label="입장 코드">
                <input
                  className="ec-input"
                  value={entranceCode}
                  disabled
                  style={{ background: "#f5f5f5", color: "#999" }}
                />
                <span className="ec-hint">입장 코드는 수정할 수 없습니다.</span>
              </FieldRow>
            </div>

            <div className="ec-modal-actions">
              <button type="button" className="dm-btn dm-btn--outline" onClick={onClose}>
                취소
              </button>
              <button
                type="button"
                className="dm-btn dm-btn--primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "수정 중..." : "수정하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
