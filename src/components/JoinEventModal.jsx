import React, { useEffect, useMemo, useState } from "react";
import * as eventsApi from "../api/events";

function toUpperAlnum6(raw) {
  return (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export default function JoinEventModal({ open, onClose, onJoined }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const codeValid = useMemo(() => /^[A-Z0-9]{6}$/.test(code), [code]);

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

  async function submit() {
    setErrMsg("");
    setOkMsg("");

    if (!codeValid) {
      setErrMsg("코드는 6자리 대문자/숫자입니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await eventsApi.enterEventByCode(code);

      // API: { message, event_id }
      setOkMsg(res?.message || "참가 신청이 완료되었습니다.");
      onJoined?.(res); // parent can navigate/refresh
    } catch (err) {
      const status = err?.status;

      if (status === 404) setErrMsg("해당 코드의 이벤트가 없습니다.");
      else if (status === 409) setErrMsg("이미 참여 중이거나 참여 신청 중입니다.");
      else setErrMsg(err?.message || "참여 요청에 실패했습니다.");
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
      <div className="join-card" onClick={(e) => e.stopPropagation()}>
        <button className="join-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="join-title">코드로 참여하기</div>

        <input
          className="join-input"
          value={code}
          onChange={(e) => {
            setCode(toUpperAlnum6(e.target.value));
            setErrMsg("");
            setOkMsg("");
          }}
          placeholder="입장 코드를 입력해주세요."
          inputMode="text"
          autoFocus
        />

        {errMsg && <div className="join-msg join-msg--err">{errMsg}</div>}
        {okMsg && <div className="join-msg join-msg--ok">{okMsg}</div>}

        <button className="dm-btn--long join-submit" onClick={submit} disabled={loading}>
          {loading ? "처리 중..." : "참여하기"}
        </button>
      </div>
    </div>
  );
}
