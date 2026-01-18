import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {
  const navigate = useNavigate();
  const { bootstrapping, isAuthed, login, loginGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If refresh succeeded during bootstrap, go Home
  useEffect(() => {
    if (!bootstrapping && isAuthed) {
      navigate("/home", { replace: true });
    }
  }, [bootstrapping, isAuthed, navigate]);

  const canSubmit = useMemo(() => {
    return email.trim() && pw.trim() && !loading && !bootstrapping;
  }, [email, pw, loading, bootstrapping]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await login(email.trim(), pw);
      navigate("/home", { replace: true });
    } catch (err) {
      const defaultMsg = "로그인에 실패했습니다.";
      if (err?.status === 422) {
        setErrorMsg(defaultMsg);
      } else {
        setErrorMsg(err?.message || defaultMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleCredential(idToken) {
    setErrorMsg("");
    setLoading(true);
    try {
      await loginGoogle(idToken);
      navigate("/home", { replace: true });
    } catch (err) {
      const defaultMsg = "구글 로그인에 실패했습니다.";
      if (err?.status === 422) {
        setErrorMsg(defaultMsg);
      } else {
        setErrorMsg(err?.message || defaultMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        {errorMsg && (
          <div className="login-error-banner" role="alert" aria-live="polite">
            <button className="login-error-close" onClick={() => setErrorMsg("")} aria-label="Close error">
              ×
            </button>
            <div className="login-error-text">{errorMsg}</div>
          </div>
        )}

        <div className='login-stack'>
          <h1 className="login-title">Decision Maker</h1>
          <form onSubmit={onSubmit} className="login-form">
            <input
              className="login-input"
              type="email"
              placeholder="E-mail:"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading || bootstrapping}
            />
            <input
              className="login-input"
              type="password"
              placeholder="PW:"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              disabled={loading || bootstrapping}
            />
            <button className="login-primary-btn" type="submit" disabled={!canSubmit}>
              {loading ? "로그인 중..." : "시작하기"}
            </button>
            <div className="login-links-row">
              <Link className="login-link" to="/signup">
                회원가입
              </Link>
            </div>
            <div className="login-divider" />

            <GoogleLoginButton
              onCredential={onGoogleCredential}
              onError={(e) => setErrorMsg(e?.message || "구글 로그인 초기화 실패")}
            />

            {bootstrapping && <div className="login-subtle-note">세션 확인 중...</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
