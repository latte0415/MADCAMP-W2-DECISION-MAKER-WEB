import React, { useEffect, useMemo, useState } from "react";
import * as eventsApi from "../api/events";

const MAX_OPTIONS = 5;
const MAX_ASSUMPTIONS = 10;
const MAX_CRITERIA = 10;

function toUpperAlnum6(raw) {
  return (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

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

function ListEditor({ label, items, setItems, max, placeholder, min = 0 }) {
  const canAdd = items.length < max;

  function updateAt(i, v) {
    const next = items.slice();
    next[i] = v;
    setItems(next);
  }

  function addOne() {
    if (!canAdd) return;
    setItems([...items, ""]);
  }

  function removeAt(i) {
    // enforce minimum length
    if (items.length <= min) return;

    const next = items.slice();
    next.splice(i, 1);
    setItems(next);
  }

  return (
    <FieldRow label={label}>
      <div className="ec-list">
        {items.map((v, i) => {
          const canDelete = items.length > min;
          return (
            <div key={i} className="ec-list-row">
              <input
                className="ec-input"
                value={v}
                placeholder={placeholder}
                onChange={(e) => updateAt(i, e.target.value)}
              />
              {canDelete && i >= min && (
                <button
                type="button"
                className="dm-btn dm-btn--ghost"
                onClick={() => removeAt(i)}
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

        <button
          type="button"
          className={`dm-btn dm-btn--outline dm-btn--submit ${
            !canAdd ? "dm-btn--disabledlike" : ""
          }`}
          onClick={addOne}
          disabled={!canAdd}
        >
          추가하기
        </button>

        <div className="ec-hint">
          {items.length}/{max}
        </div>
      </div>
    </FieldRow>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

export default function EventCreationModal({ open, onClose, onCreated }) {

  const [subject, setSubject] = useState("");

  const [options, setOptions] = useState(["", ""]); // start with 2
  const [assumptions, setAssumptions] = useState([""]);
  const [criteria, setCriteria] = useState([""]);

  const [maxMembership, setMaxMembership] = useState(10);

  // Vote policies
  const [assumptionAutoByVotes, setAssumptionAutoByVotes] = useState(true);
  const [assumptionMinVotes, setAssumptionMinVotes] = useState(3);

  const [criteriaAutoByVotes, setCriteriaAutoByVotes] = useState(true);
  const [criteriaMinVotes, setCriteriaMinVotes] = useState(3);

  const [conclusionApprovalPercent, setConclusionApprovalPercent] = useState(50);

  // Entrance policies
  const [membershipAutoApproved, setMembershipAutoApproved] = useState(true);

  const [entranceCode, setEntranceCode] = useState("");
  const [codeCheck, setCodeCheck] = useState(null); // null | { is_available: bool }
  const [codeCheckMsg, setCodeCheckMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const entranceCodeValid = useMemo(() => /^[A-Z0-9]{6}$/.test(entranceCode), [entranceCode]);

  const canCreate = useMemo(() => {
    const o = trimNonEmpty(options);
    const subjectOk = subject.trim().length > 0;
    const maxOk = Number.isInteger(maxMembership) && maxMembership >= 1;
    const percentOk =
      Number.isInteger(conclusionApprovalPercent) &&
      conclusionApprovalPercent >= 1 &&
      conclusionApprovalPercent <= 100;

    const minVotesOk =
      (!assumptionAutoByVotes || (Number.isInteger(assumptionMinVotes) && assumptionMinVotes >= 1)) &&
      (!criteriaAutoByVotes || (Number.isInteger(criteriaMinVotes) && criteriaMinVotes >= 1));

    // Common sense: need at least 2 non-empty options
    const optionsOk = o.length >= 2 && o.length <= MAX_OPTIONS;

    return (
      !loading &&
      subjectOk &&
      entranceCodeValid &&
      optionsOk &&
      maxOk &&
      percentOk &&
      minVotesOk
    );
  }, [
    subject,
    entranceCodeValid,
    options,
    maxMembership,
    conclusionApprovalPercent,
    assumptionAutoByVotes,
    assumptionMinVotes,
    criteriaAutoByVotes,
    criteriaMinVotes,
    loading,
  ]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  async function onGenerateCode() {
    setErrorMsg("");
    setCodeCheck(null);
    setCodeCheckMsg("");
    try {
      const data = await eventsApi.generateEntranceCode();
      const code = toUpperAlnum6(data?.code || "");
      setEntranceCode(code);
      console.log("generated:", data);
    } catch (err) {
      setErrorMsg(err?.message || "코드 생성에 실패했습니다.");
    }
  }

  async function onCheckCode() {
    setErrorMsg("");
    setCodeCheck(null);
    setCodeCheckMsg("");
    if (!entranceCodeValid) {
      setCodeCheckMsg("코드는 6자리 대문자/숫자여야 합니다.");
      return;
    }
    try {
      const data = await eventsApi.checkEntranceCode(entranceCode);
      setCodeCheck({ is_available: !!data?.is_available });
      setCodeCheckMsg(data?.is_available ? "사용 가능한 코드입니다." : "이미 사용 중인 코드입니다.");
    } catch (err) {
      setErrorMsg(err?.message || "중복 확인에 실패했습니다.");
    }
  }

  async function onCreate() {
    setErrorMsg("");
    setLoading(true);
    try {
      const payload = {
        decision_subject: subject.trim(),
        entrance_code: entranceCode,
        assumption_is_auto_approved_by_votes: assumptionAutoByVotes,
        criteria_is_auto_approved_by_votes: criteriaAutoByVotes,
        membership_is_auto_approved: membershipAutoApproved,
        conclusion_is_auto_approved_by_votes: true, // UI에서 토글 없음 -> 기본 true
        assumption_min_votes_required: assumptionAutoByVotes ? assumptionMinVotes : 1,
        criteria_min_votes_required: criteriaAutoByVotes ? criteriaMinVotes : 1,
        conclusion_approval_threshold_percent: conclusionApprovalPercent,
        max_membership: maxMembership,
        options: trimNonEmpty(options).slice(0, MAX_OPTIONS).map((content) => ({ content })),
        assumptions: trimNonEmpty(assumptions).slice(0, MAX_ASSUMPTIONS).map((content) => ({ content })),
        criteria: trimNonEmpty(criteria).slice(0, MAX_CRITERIA).map((content) => ({ content })),
      };

      const created = await eventsApi.createEvent(payload);
      onCreated?.(created);
    } catch (err) {
      setErrorMsg(err?.message || "이벤트 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div 
      className="modal-backdrop" 
      role="dialog" 
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="ec-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="ec-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="ec-modal-body">
          {errorMsg && <div className="ec-error">{errorMsg}</div>}
          <div className="ec-section">
            <div className="ec-section-title">기본 정보</div>
            <FieldRow label="주제">
              <input className="ec-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </FieldRow>
            <div className="ec-spacer" />
            <ListEditor
              label="선택지"
              items={options}
              setItems={setOptions}
              min={2}
              max={MAX_OPTIONS}
              placeholder=""
            />
            <div className="ec-spacer" />
            <ListEditor
              label="전제"
              items={assumptions}
              setItems={setAssumptions}
              min={1}
              max={MAX_ASSUMPTIONS}
              placeholder=""
            />
            <div className="ec-spacer" />
            <ListEditor
              label="기준"
              items={criteria}
              setItems={setCriteria}
              min={1}
              max={MAX_CRITERIA}
              placeholder=""
            />
            <div className="ec-spacer" />
            <FieldRow label="최대 인원">
              <input
                className="ec-input ec-input--small"
                type="number"
                min={1}
                value={maxMembership}
                onChange={(e) => setMaxMembership(parseInt(e.target.value || "0", 10))}
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
                <Toggle checked={assumptionAutoByVotes} onChange={setAssumptionAutoByVotes} />
                <span className="ec-spacer-inline" />
                <div className="ec-inline-label">허용하는 최소 투표수</div>
                <input
                  className="ec-input ec-input--small"
                  type="number"
                  min={1}
                  disabled={!assumptionAutoByVotes}
                  value={assumptionMinVotes}
                  onChange={(e) => setAssumptionMinVotes(parseInt(e.target.value || "0", 10))}
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
                <Toggle checked={criteriaAutoByVotes} onChange={setCriteriaAutoByVotes} />
                <span className="ec-spacer-inline" />
                <div className="ec-inline-label">허용하는 최소 투표수</div>
                <input
                  className="ec-input ec-input--small"
                  type="number"
                  min={1}
                  disabled={!criteriaAutoByVotes}
                  value={criteriaMinVotes}
                  onChange={(e) => setCriteriaMinVotes(parseInt(e.target.value || "0", 10))}
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
                className="ec-input ec-input--small"
                type="number"
                min={1}
                max={100}
                value={conclusionApprovalPercent}
                onChange={(e) => setConclusionApprovalPercent(parseInt(e.target.value || "0", 10))}
              />
            </FieldRow>
          </div>
          <div className="homepage-divider"/>
          <div className="ec-section ec-section--entry">
            <div className="ec-section-title">입장 정책</div>
            <FieldRow label="입장 코드">
              <div className="ec-inline">
                <input
                  className="ec-input ec-input--code"
                  value={entranceCode}
                  onChange={(e) => {
                    setEntranceCode(toUpperAlnum6(e.target.value));
                    setCodeCheck(null);
                    setCodeCheckMsg("");
                  }}
                  placeholder="ABC123"
                />
                <button type="button" className="dm-btn dm-btn--sm" onClick={onGenerateCode}>
                  랜덤 생성
                </button>
                <button type="button" className="dm-btn dm-btn--sm" onClick={onCheckCode}>
                  중복 확인
                </button>
              </div>
              {(codeCheckMsg || codeCheck) && (
                <div className={`ec-code-msg ${codeCheck?.is_available ? "ok" : "bad"}`}>
                  {codeCheckMsg}
                </div>
              )}
            </FieldRow>
            <FieldRow label="가입 자동 승인">
              <Toggle checked={membershipAutoApproved} onChange={setMembershipAutoApproved} />
            </FieldRow>
            <div className="ec-footer">
              <button className="dm-btn ec-create-btn" onClick={onCreate} disabled={!canCreate}>
                {loading ? "생성 중..." : "생성하기"}
              </button>
            </div>
            <div className="ec-constraints">
              <div>입장 코드는 6자리 대문자/숫자입니다.</div>
              <div>승인되는 동의 최소 퍼센티지는 1과 100 사이여아 합니다.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
