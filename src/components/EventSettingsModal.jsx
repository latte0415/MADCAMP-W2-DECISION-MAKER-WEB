import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as eventsApi from "../api/events";
import EventErrorBanner from "./EventErrorBanner";

const MAX_OPTIONS = 5;


function normalizeIdContentList(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .map((x) => ({ id: x?.id ?? null, content: (x?.content ?? "").toString() }))
    .filter((x) => !!x.content.trim() || !!x.id);
}

function FieldRow({ label, children }) {
  return (
    <div className="ec-row">
      <div className="ec-label">{label}</div>
      <div className="ec-control">{children}</div>
    </div>
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

/**
 * Options editor that preserves {id, content}.
 * - min=2
 * - max=5
 * - add creates {id:null, content:""}
 * - remove deletes row
 */
function OptionsEditor({ items, setItems, min = 2, max = MAX_OPTIONS }) {
  const canAdd = items.length < max;

  function updateAt(i, v) {
    const next = items.slice();
    next[i] = { ...next[i], content: v };
    setItems(next);
  }

  function addOne() {
    if (!canAdd) return;
    setItems([...items, { id: null, content: "" }]);
  }

  function removeAt(i) {
    if (items.length <= min) return;
    const next = items.slice();
    next.splice(i, 1);
    setItems(next);
  }

  return (
    <FieldRow label="선택지">
      <div className="ec-list">
        {items.map((opt, i) => {
          const canDelete = items.length > min && i >= min; // same feel as creation modal (protect first min rows)
          return (
            <div key={opt?.id ?? `opt-${i}`} className="ec-list-row">
              <input
                className="ec-input"
                value={opt?.content ?? ""}
                placeholder=""
                onChange={(e) => updateAt(i, e.target.value)}
              />
              {canDelete && (
                <button
                  type="button"
                  className="dm-btn dm-btn--ghost"
                  onClick={() => removeAt(i)}
                  aria-label={`선택지 ${i + 1} 삭제`}
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
          className={`dm-btn dm-btn--outline dm-btn--submit ${!canAdd ? "dm-btn--disabledlike" : ""}`}
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

export default function EventSettingsModal({
  open,
  eventId,
  onClose,

  // from EventPage detail (per your requirement)
  detailAssumptions,
  detailCriteria,

  // optional: call after successful patch
  onPatched,
}) {
  const [subject, setSubject] = useState("");
  const [options, setOptions] = useState([{ id: null, content: "" }, { id: null, content: "" }]);

  const [maxMembership, setMaxMembership] = useState(10);

  const [assumptionAutoByVotes, setAssumptionAutoByVotes] = useState(true);
  const [assumptionMinVotes, setAssumptionMinVotes] = useState(3);

  const [criteriaAutoByVotes, setCriteriaAutoByVotes] = useState(true);
  const [criteriaMinVotes, setCriteriaMinVotes] = useState(3);

  const [conclusionApprovalPercent, setConclusionApprovalPercent] = useState(50);

  const [membershipAutoApproved, setMembershipAutoApproved] = useState(true);

  // read-only display (comes from setting GET; PATCH spec did not include it)
  const [entranceCode, setEntranceCode] = useState("");

  // memberships
  const [pendingMemberships, setPendingMemberships] = useState([]);
  const [membershipBusyById, setMembershipBusyById] = useState({});
  const [bulkBusy, setBulkBusy] = useState(false);

  // banners
  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVariant, setBannerVariant] = useState("error"); // "error" | "success"

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const hydratedRef = useRef(false);
  const membershipsInFlightRef = useRef(false);

  const showBanner = useCallback((msg, variant = "error") => {
    setBannerMsg(msg || "");
    setBannerVariant(variant);
  }, []);

  const clearBanner = useCallback(() => {
    setBannerMsg("");
  }, []);

  const refreshMemberships = useCallback(async () => {
    if (!eventId) return;
    if (membershipsInFlightRef.current) return;

    membershipsInFlightRef.current = true;
    try {
      const data = await eventsApi.listEventMemberships(eventId); // keep your function name
      const pend = Array.isArray(data) ? data.filter((m) => m?.status === "PENDING") : [];

      // update list
      setPendingMemberships(pend);

      // OPTIONAL: prune busy states for memberships that are no longer pending
      setMembershipBusyById((prev) => {
        const keep = new Set(pend.map((m) => m?.membership_id).filter(Boolean));
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          if (!keep.has(id)) delete next[id];
        });
        return next;
      });
    } finally {
      membershipsInFlightRef.current = false;
    }
  }, [eventId]);

  // hydrate from GET /v1/events/{eventId}/setting once per open
  useEffect(() => {
    if (!open) return;
    if (!eventId) return;

    // reset visual state for this open
    clearBanner();
    setSaving(false);
    setBulkBusy(false);
    setMembershipBusyById({});
    hydratedRef.current = false;

    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const s = await eventsApi.getEventSetting(eventId);
        if (!alive) return;

        setSubject((s?.decision_subject ?? "").toString());

        const opts = Array.isArray(s?.options) ? s.options : [];
        if (opts.length >= 2) {
          setOptions(opts.map((o) => ({ id: o?.id ?? null, content: (o?.content ?? "").toString() })));
        } else {
          // enforce 2 rows minimum in UI
          const normalized = opts.map((o) => ({ id: o?.id ?? null, content: (o?.content ?? "").toString() }));
          while (normalized.length < 2) normalized.push({ id: null, content: "" });
          setOptions(normalized);
        }

        setMaxMembership(Number.isFinite(s?.max_membership) ? s.max_membership : 10);

        setAssumptionAutoByVotes(!!s?.assumption_is_auto_approved_by_votes);
        setAssumptionMinVotes(Number.isFinite(s?.assumption_min_votes_required) ? s.assumption_min_votes_required : 1);

        setCriteriaAutoByVotes(!!s?.criteria_is_auto_approved_by_votes);
        setCriteriaMinVotes(Number.isFinite(s?.criteria_min_votes_required) ? s.criteria_min_votes_required : 1);

        setConclusionApprovalPercent(
          Number.isFinite(s?.conclusion_approval_threshold_percent) ? s.conclusion_approval_threshold_percent : 50
        );

        setMembershipAutoApproved(!!s?.membership_is_auto_approved);

        setEntranceCode((s?.entrance_code ?? "").toString());

        hydratedRef.current = true;

        // memberships (pending list)
        await refreshMemberships();
      } catch (e) {
        showBanner(e?.message || "설정 정보를 불러오지 못했습니다.", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, eventId, refreshMemberships, showBanner, clearBanner]);

  useEffect(() => {
    if (!open) return;
    if (!eventId) return;

    // initial fetch immediately
    refreshMemberships();

    const POLL_MS = 1500;
    const id = setInterval(() => {
      refreshMemberships();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [open, eventId, refreshMemberships]);


  const canSave = useMemo(() => {
    if (loading || saving) return false;

    const subjOk = subject.trim().length > 0;

    const optContents = options.map((o) => (o?.content ?? "").trim());
    const nonEmpty = optContents.filter((x) => x.length > 0);

    const optionsOk = nonEmpty.length >= 2 && nonEmpty.length <= MAX_OPTIONS;

    const maxOk = Number.isInteger(maxMembership) && maxMembership >= 1;

    const percentOk =
      Number.isInteger(conclusionApprovalPercent) &&
      conclusionApprovalPercent >= 1 &&
      conclusionApprovalPercent <= 100;

    const minVotesOk =
      (!assumptionAutoByVotes || (Number.isInteger(assumptionMinVotes) && assumptionMinVotes >= 1)) &&
      (!criteriaAutoByVotes || (Number.isInteger(criteriaMinVotes) && criteriaMinVotes >= 1));

    return subjOk && optionsOk && maxOk && percentOk && minVotesOk;
  }, [
    loading,
    saving,
    subject,
    options,
    maxMembership,
    conclusionApprovalPercent,
    assumptionAutoByVotes,
    assumptionMinVotes,
    criteriaAutoByVotes,
    criteriaMinVotes,
  ]);

  const onPatch = useCallback(async () => {
    if (!eventId) return;
    if (!canSave) return;

    clearBanner();
    setSaving(true);

    try {
      // options payload: preserve id if present; allow new option without id
      const optionPayload = options
        .map((o) => ({ id: o?.id ?? null, content: (o?.content ?? "").trim() }))
        .filter((o) => o.content.length > 0)
        .slice(0, MAX_OPTIONS)
        .map((o) => (o.id ? { id: o.id, content: o.content } : { content: o.content }));

      // assumptions/criteria MUST come from event detail (your requirement)
      const assumptionsPayload = normalizeIdContentList(detailAssumptions)
        .filter((x) => x.id && x.content.trim().length > 0)
        .map((x) => ({ id: x.id, content: x.content.trim() }));

      const criteriaPayload = normalizeIdContentList(detailCriteria)
        .filter((x) => x.id && x.content.trim().length > 0)
        .map((x) => ({ id: x.id, content: x.content.trim() }));

      const payload = {
        decision_subject: subject.trim(),
        options: optionPayload,
        assumptions: assumptionsPayload,
        criteria: criteriaPayload,
        max_membership: maxMembership,

        assumption_is_auto_approved_by_votes: assumptionAutoByVotes,
        assumption_min_votes_required: assumptionAutoByVotes ? assumptionMinVotes : 1,

        criteria_is_auto_approved_by_votes: criteriaAutoByVotes,
        criteria_min_votes_required: criteriaAutoByVotes ? criteriaMinVotes : 1,

        conclusion_approval_threshold_percent: conclusionApprovalPercent,
        membership_is_auto_approved: membershipAutoApproved,
      };

      // You may need to rename this to match your api/events export.
      // Expected: PATCH /v1/events/{event_id}
      await eventsApi.patchEvent(eventId, payload);

      showBanner("수정이 완료되었습니다.", "success");
      onPatched?.();
      // do NOT close
    } catch (e) {
      showBanner(e?.message || "수정에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }, [
    eventId,
    canSave,
    options,
    subject,
    maxMembership,
    assumptionAutoByVotes,
    assumptionMinVotes,
    criteriaAutoByVotes,
    criteriaMinVotes,
    conclusionApprovalPercent,
    membershipAutoApproved,
    detailAssumptions,
    detailCriteria,
    onPatched,
    clearBanner,
    showBanner,
  ]);

  const setBusy = (setter, id, on) => {
    setter((m) => {
      const next = { ...m };
      if (on) next[id] = true;
      else delete next[id];
      return next;
    });
  };

  const onApproveOne = useCallback(
    async (membership) => {
      const mid = membership?.membership_id;
      if (!eventId || !mid) return;
      if (membershipBusyById[mid]) return;

      setBusy(setMembershipBusyById, mid, true);

      // optimistic remove
      setPendingMemberships((prev) => prev.filter((m) => m?.membership_id !== mid));

      try {
        await eventsApi.approveMembership(eventId, mid);
        await refreshMemberships(); // reconcile with server
      } catch (e) {
        showBanner(e?.message || "승인에 실패했습니다.", "error");
        await refreshMemberships(); // revert by server truth
      } finally {
        setBusy(setMembershipBusyById, mid, false);
      }
    },
    [eventId, membershipBusyById, showBanner, refreshMemberships]
  );

  const onRejectOne = useCallback(
    async (membership) => {
      const mid = membership?.membership_id;
      if (!eventId || !mid) return;
      if (membershipBusyById[mid]) return;

      setBusy(setMembershipBusyById, mid, true);

      // optimistic remove
      setPendingMemberships((prev) => prev.filter((m) => m?.membership_id !== mid));

      try {
        await eventsApi.rejectMembership(eventId, mid);
        await refreshMemberships();
      } catch (e) {
        showBanner(e?.message || "거부에 실패했습니다.", "error");
        await refreshMemberships();
      } finally {
        setBusy(setMembershipBusyById, mid, false);
      }
    },
    [eventId, membershipBusyById, showBanner, refreshMemberships]
  );

  const onBulkApprove = useCallback(async () => {
    if (!eventId) return;
    if (bulkBusy) return;

    setBulkBusy(true);

    // optimistic clear
    setPendingMemberships([]);

    try {
      await eventsApi.bulkApproveMemberships(eventId);
      showBanner("전체 승인이 완료되었습니다.", "success");
      await refreshMemberships();
    } catch (e) {
      showBanner(e?.message || "전체 승인에 실패했습니다.", "error");
      await refreshMemberships(); // revert by server truth
    } finally {
      setBulkBusy(false);
    }
  }, [eventId, bulkBusy, showBanner, refreshMemberships]);

  const onBulkReject = useCallback(async () => {
    if (!eventId) return;
    if (bulkBusy) return;

    setBulkBusy(true);

    // optimistic clear
    setPendingMemberships([]);

    try {
      await eventsApi.bulkRejectMemberships(eventId);
      showBanner("전체 거부가 완료되었습니다.", "success");
      await refreshMemberships();
    } catch (e) {
      showBanner(e?.message || "전체 거부에 실패했습니다.", "error");
      await refreshMemberships();
    } finally {
      setBulkBusy(false);
    }
  }, [eventId, bulkBusy, showBanner, refreshMemberships]);
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      {/* Banner (same visual system as login) */}
      <EventErrorBanner message={bannerMsg} variant={bannerVariant} onClose={clearBanner} />

      <div className="ec-modal-card">
        <button className="ec-close" onClick={onClose} aria-label="Close" type="button">
          ×
        </button>

        <div className="ec-modal-body">
          {/* 기본 정보 */}
          <div className="ec-section">
            <div className="ec-section-title">기본 정보</div>

            <FieldRow label="주제">
              <input
                className="ec-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading || saving}
              />
            </FieldRow>

            <div style={{ marginTop: 30 }} />

            <OptionsEditor items={options} setItems={setOptions} min={2} max={MAX_OPTIONS} />



          </div>

          <div className="homepage-divider" />

          {/* 투표 허용 정책 */}
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
                <span style={{ display: "inline-block", width: "18px" }} />
                <div className="ec-inline-label">허용하는 최소 투표수</div>
                <input
                  className="ec-input ec-input--small"
                  type="number"
                  min={1}
                  disabled={!assumptionAutoByVotes || loading || saving}
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
                <span style={{ display: "inline-block", width: "18px" }} />
                <div className="ec-inline-label">허용하는 최소 투표수</div>
                <input
                  className="ec-input ec-input--small"
                  type="number"
                  min={1}
                  disabled={!criteriaAutoByVotes || loading || saving}
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
                disabled={loading || saving}
                value={conclusionApprovalPercent}
                onChange={(e) => setConclusionApprovalPercent(parseInt(e.target.value || "0", 10))}
              />
            </FieldRow>
          </div>

          <div className="homepage-divider" />

          {/* 입장 정책 */}
          <div className="ec-section ec-section--entry">
            <div className="ec-section-title">입장 정책</div>

            <FieldRow label="최대 인원">
              <input
                className="ec-input ec-input--small"
                type="number"
                min={1}
                disabled={loading || saving}
                value={maxMembership}
                onChange={(e) => setMaxMembership(parseInt(e.target.value || "0", 10))}
              />
            </FieldRow>
            <FieldRow label="입장 코드">
              <input className="ec-input ec-input--code" value={entranceCode} disabled />
            </FieldRow>

            <FieldRow label="가입 자동 승인">
              <Toggle checked={membershipAutoApproved} onChange={setMembershipAutoApproved} />
            </FieldRow>

            <div className="ec-footer" style={{marginTop: -30, marginBottom: -10}}>
              <button className="dm-btn ec-create-btn" onClick={onPatch} disabled={!canSave}>
                {saving ? "수정 중..." : "수정하기"}
              </button>
            </div>
          </div>

          <div className="homepage-divider--thick" />

          {/* 신청자 관리 */}
          <div className="ec-section" style={{marginTop: -15, marginBottom: 0}}>
            <div className="ec-section-title">신청자 관리</div>

            {pendingMemberships.length === 0 ? (
              <div className="event-muted">대기 중인 신청자가 없습니다.</div>
            ) : (
              <div className="ec-list">
                {pendingMemberships.map((m, idx) => {
                  const mid = m?.membership_id;
                  const busy = !!membershipBusyById[mid];
                  return (
                    <div key={mid ?? `m-${idx}`} className="ec-list-row">
                      <input className="ec-input ec-member-input" value={m?.user_id ?? "-"} disabled />
                      <button
                        type="button"
                        className="dm-btn dm-btn--outline dm-btn--sm"
                        onClick={() => onApproveOne(m)}
                        disabled={busy || bulkBusy}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="dm-btn dm-btn--outline dm-btn--sm"
                        onClick={() => onRejectOne(m)}
                        disabled={busy || bulkBusy}
                      >
                        거부
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "start" }}>
              <button
                type="button"
                className="dm-btn ec-create-btn"
                onClick={onBulkApprove}
                disabled={bulkBusy || pendingMemberships.length === 0}
              >
                전체 승인
              </button>
              <button
                type="button"
                className="dm-btn ec-create-btn"
                onClick={onBulkReject}
                disabled={bulkBusy || pendingMemberships.length === 0}
              >
                전체 거부
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
