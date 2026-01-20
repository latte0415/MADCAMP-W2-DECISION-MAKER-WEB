import React, { useEffect, useState, useCallback, useRef } from "react";
import * as eventsApi from "../api/events";
import EventErrorBanner from "../components/EventErrorBanner";

import "../styles/votemodal.css";

function normalizeCriteria(criteria) {
  const list = Array.isArray(criteria) ? criteria : [];
  return list
    .map((c) => ({ id: c?.id, content: c?.content }))
    .filter((c) => !!c.id);
}

function normalizeOptions(options) {
  const list = Array.isArray(options) ? options : [];
  return list
    .map((o) => ({ id: o?.id, content: o?.content }))
    .filter((o) => !!o.id);
}

function applyOrder(items, idOrder) {
  const order = Array.isArray(idOrder) ? idOrder : [];
  const byId = new Map(items.map((x) => [x.id, x]));
  const used = new Set();

  const ordered = [];
  for (const id of order) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      used.add(id);
    }
  }
  for (const x of items) {
    if (!used.has(x.id)) ordered.push(x);
  }
  return ordered;
}

function getHttpStatus(err) {
  return err?.status ?? err?.response?.status ?? err?.data?.status ?? null;
}

export default function VoteModal({
  open,
  eventId,
  options,
  criteria,
  onClose,
  onSubmitted,
}) {
  // Snapshot inputs ONCE per open so EventPage polling can't reset modal state.
  const [snapOptions, setSnapOptions] = useState([]);
  const [snapCriteria, setSnapCriteria] = useState([]);

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [orderedCriteria, setOrderedCriteria] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [dragId, setDragId] = useState(null);

  const prevOpenRef = useRef(false);
  const dirtyRef = useRef(false);
  const aliveRef = useRef(true);

  // increments once per open -> triggers one-time /votes/me fetch
  const [openNonce, setOpenNonce] = useState(0);

  // Detect "open edge" and initialize ONCE
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (!open) return;

    // Only run on transition false -> true
    if (!wasOpen) {
      const opts = normalizeOptions(options);
      const crit = normalizeCriteria(criteria);

      setSnapOptions(opts);
      setSnapCriteria(crit);

      setSelectedOptionId(null);
      setOrderedCriteria(crit);

      setErrMsg("");
      setLoading(false);
      setSubmitting(false);
      dirtyRef.current = false;

      setOpenNonce((n) => n + 1);
    }
  }, [open, options, criteria]);

  // One-time fetch on open (NO polling)
  useEffect(() => {
    if (!open) return;
    if (!eventId) return;

    let alive = true;
    aliveRef.current = true;

    (async () => {
      setLoading(true);
      setErrMsg("");

      try {
        const me = await eventsApi.getMyVote(eventId);
        if (!alive) return;

        // If user already interacted, don't overwrite UI.
        if (dirtyRef.current) return;

        const nextSelected = me?.option_id ?? null;
        const orderIds = me?.criterion_order ?? [];

        setSelectedOptionId(nextSelected);
        setOrderedCriteria(applyOrder(snapCriteria, orderIds));
      } catch (e) {
        if (!alive) return;

        const status = getHttpStatus(e);
        if (status !== 404) {
          setErrMsg(e?.message || "투표 정보를 불러오지 못했습니다.");
        }
        // 404 => keep initial state
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      aliveRef.current = false;
    };
  }, [openNonce, open, eventId, snapCriteria]);

  const reorder = useCallback((fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;

    dirtyRef.current = true;

    setOrderedCriteria((prev) => {
      const fromIdx = prev.findIndex((x) => x.id === fromId);
      const toIdx = prev.findIndex((x) => x.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const onSubmit = useCallback(async () => {
    if (!eventId) return;

    if (!selectedOptionId) {
      setErrMsg("선택지를 선택하세요.");
      return;
    }

    setSubmitting(true);
    setErrMsg("");

    try {
      const criterion_ids = orderedCriteria.map((c) => c.id);
      await eventsApi.submitVote(eventId, selectedOptionId, criterion_ids);

      onSubmitted?.();
      onClose?.();
    } catch (e) {
      setErrMsg(e?.message || "투표에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [eventId, selectedOptionId, orderedCriteria, onSubmitted, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="vm-card">
        <button className="vm-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="vm-section">
          <div className="vm-title">선택지</div>

          <div className="vm-options">
            {snapOptions.map((o) => {
              const active = o.id === selectedOptionId;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`vm-option ${active ? "vm-option--active" : ""}`}
                  onClick={() => {
                    dirtyRef.current = true;
                    setSelectedOptionId(o.id);
                  }}
                  disabled={loading || submitting}
                >
                  {o.content ?? "-"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="vm-section">
          <div className="vm-title">기준</div>

          <div className="vm-criteria">
            {orderedCriteria.map((c, idx) => (
              <div
                key={c.id}
                className="vm-criterion"
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(dragId, c.id)}
              >
                <div className="vm-criterion-left">
                  <div className="vm-criterion-num">{idx + 1}.</div>
                  <div className="vm-criterion-text">{c.content ?? "-"}</div>
                </div>
                <div className="vm-drag-handle" aria-hidden="true">
                  ≡
                </div>
              </div>
            ))}
          </div>
        </div>

        <EventErrorBanner message={errMsg} onClose={() => setErrMsg("")} />

        <div className="vm-footer">
          <button
            type="button"
            className="dm-btn vm-submit"
            onClick={onSubmit}
            disabled={loading || submitting}
          >
            투표하기
          </button>
        </div>
      </div>
    </div>
  );
}
