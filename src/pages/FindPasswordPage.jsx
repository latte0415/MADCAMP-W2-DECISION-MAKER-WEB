import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function FindPasswordPage() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerType, setBannerType] = useState("error"); // "success" | "error"

  const canSubmit = useMemo(() => email.trim() && !loading, [email, loading]);

  async function onSubmit(e) {
    e.preventDefault();
    setBannerMsg("");
    setLoading(true);

    try {
      const data = await requestPasswordReset(email.trim());
      setBannerType("success");
      setBannerMsg(data?.message || "메일이 발송되었습니다.");
    } catch (err) {
      setBannerType("error");
      setBannerMsg(err?.message || "메일 전송에 실패했습니다.");
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
          <h1 className="login-title">Decision Maker</h1>

          <form onSubmit={onSubmit} className="login-form">
            <input
              className="login-input"
              type="email"
              placeholder="E-mail:"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />

            <button className="login-primary-btn" type="submit" disabled={!canSubmit}>
              {loading ? "전송 중..." : "메일 전송"}
            </button>

            <div className="login-links-row">
              <Link className="login-link" to="/login">
                로그인으로 돌아가기
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
