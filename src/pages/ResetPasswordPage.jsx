import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ResetPasswordPage() {
  const { confirmPasswordReset } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerType, setBannerType] = useState("error");

  const pwTooShort = pw.trim().length > 0 && pw.trim().length < 8;
  const pwTooLong = pw.trim().length > 20;
  const pwMismatch = pw.trim() && pw2.trim() && pw !== pw2;

const canSubmit = useMemo(() => {
  return token && pw.trim() && pw2.trim() && !pwTooShort && !pwTooLong && !pwMismatch && !loading;
}, [token, pw, pw2, pwTooShort, pwTooLong, pwMismatch, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    setBannerMsg("");

    if (!token) {
      setBannerType("error");
      setBannerMsg("유효하지 않은 비밀번호 재설정 링크입니다. (token 없음)");
      return;
    }
    if (pw !== pw2) {
      setBannerType("error");
      setBannerMsg("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const data = await confirmPasswordReset(token, pw);
      setBannerType("success");
      setBannerMsg(data?.message || "비밀번호를 재설정하였습니다.");
    } catch (err) {
      setBannerType("error");
      setBannerMsg(err?.message || "비밀번호 재설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        {bannerMsg && (
          <div
            className={`login-error-banner ${
              bannerType === "success" ? "login-banner-success" : "login-banner-error"
            }`}
            role="alert"
            aria-live="polite"
          >
            <button
              className="login-error-close"
              onClick={() => setBannerMsg("")}
              aria-label="Close banner"
            >
              ×
            </button>
            <div className="login-error-text">{bannerMsg}</div>
          </div>
        )}

        <div className="login-stack">
          <h1 className="login-title">Decision Maker - 비밀번호 재설정</h1>

          <form onSubmit={onSubmit} className="login-form">
            <input
              className="login-input"
              type="password"
              placeholder="PW:"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />

            <input
              className="login-input"
              type="password"
              placeholder="Confirm PW:"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            
            {(!token || pwTooShort || pwTooLong || pwMismatch) && (
              <div style={{ width: "min(92%, 460px)", fontSize: 12, color: "#c0392b" }}>
                {!token && <div>링크가 올바르지 않습니다. 이메일의 링크를 다시 확인해주세요.</div>}
                {pwTooShort && <div>비밀번호는 8자 이상이어야 합니다.</div>}
                {pwTooLong && <div>비밀번호는 20자 이하로 입력해 주세요.</div>}
                {pwMismatch && <div>비밀번호 확인이 일치하지 않습니다.</div>}
              </div>
            )}

            <button className="login-primary-btn" type="submit" disabled={!canSubmit}>
              {loading ? "재설정 중..." : "비밀번호 재설정"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
