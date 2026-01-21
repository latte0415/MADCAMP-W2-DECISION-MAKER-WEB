import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { checkEmail } from "../api/auth";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signup, loginGoogle, bootstrapping } = useAuth();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const pwTooShort = pw.length > 0 && pw.length < 8;
  const pwTooLong = pw.length > 20;
  const pwMismatch = confirmPw.length > 0 && pw !== confirmPw;

  const canSubmit = useMemo(() => {
    if (loading || bootstrapping) return false;
    if (!email.trim()) return false;
    if (!emailVerified) return false;
    if (!pw) return false;
    if (!confirmPw) return false;
    if (pw.length < 8 || pw.length > 20) return false;
    if (pw !== confirmPw) return false;
    return true;
  }, [email, emailVerified, pw, confirmPw, loading, bootstrapping]);

  async function handleCheckEmail() {
    if (!email.trim()) {
      setErrorMsg("이메일을 입력해주세요.");
      return;
    }

    setCheckingEmail(true);
    setErrorMsg("");
    try {
      const result = await checkEmail(email.trim());
      if (result.exists) {
        setErrorMsg("이미 사용 중인 이메일입니다.");
        setEmailVerified(false);
      } else {
        setEmailVerified(true);
        setErrorMsg("");
      }
    } catch (err) {
      setErrorMsg(err?.message || "이메일 확인에 실패했습니다.");
      setEmailVerified(false);
    } finally {
      setCheckingEmail(false);
    }
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    setEmailVerified(false);
    setErrorMsg("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (pw.length < 8 || pw.length > 20) {
      setErrorMsg("비밀번호는 8자 이상 20자 이하로 입력해 주세요.");
      return;
    }
    if (pw !== confirmPw) {
      setErrorMsg("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), pw);
      navigate("/home", { replace: true });
    } catch (err) {
      const defaultMsg = "회원가입에 실패했습니다.";
      setErrorMsg(err?.status === 422 ? defaultMsg : (err?.message || defaultMsg));
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
      const defaultMsg = "구글 회원가입에 실패했습니다.";
      setErrorMsg(err?.status === 422 ? defaultMsg : (err?.message || defaultMsg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        {errorMsg && (
          <div className="login-error-banner" role="alert" aria-live="polite">
            <button
              className="login-error-close"
              onClick={() => setErrorMsg("")}
              aria-label="Close error"
              type="button"
            >
              ×
            </button>
            <div className="login-error-text">{errorMsg}</div>
          </div>
        )}

        <div className="login-stack">
          <h1 className="login-title">Decision Maker</h1>

          <form onSubmit={onSubmit} className="login-form">
            <label className="signup-label">
              <span className="signup-label-text">E-mail</span>
              <div className="signup-email-container">
                <input
                  className="login-input signup-email-input"
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="email"
                  disabled={loading || bootstrapping}
                />
                <button
                  type="button"
                  className="signup-check-btn"
                  onClick={handleCheckEmail}
                  disabled={checkingEmail || loading || bootstrapping || !email.trim()}
                >
                  {checkingEmail ? "확인 중..." : emailVerified ? "확인 완료" : "중복 확인"}
                </button>
              </div>
            </label>

            <label className="signup-label">
              <span className="signup-label-text">비밀번호</span>
              <input
                className="login-input"
                type="password"
                placeholder="사용하실 비밀번호를 입력해주세요."
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
                disabled={loading || bootstrapping}
              />
            </label>

            <label className="signup-label">
              {/* <span className="signup-label-text">PW 확인</span> */}
              <input
                className="login-input"
                type="password"
                placeholder="비밀번호를 한 번 더 입력해주세요."
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                disabled={loading || bootstrapping}
              />
            </label>

            {/* Optional inline hints, shown only when relevant */}
            {(pwTooShort || pwTooLong || pwMismatch) && (
              <div style={{ width: "min(92%, 460px)", fontSize: 12, color: "#c0392b" }}>
                {pwTooShort && <div>비밀번호는 8자 이상이어야 합니다.</div>}
                {pwTooLong && <div>비밀번호는 20자 이하로 입력해 주세요.</div>}
                {pwMismatch && <div>비밀번호 확인이 일치하지 않습니다.</div>}
              </div>
            )}

            <button className="login-primary-btn" type="submit" disabled={!canSubmit}>
              {loading ? "처리 중..." : "회원가입"}
            </button>

            <div className="login-links-container">
              <Link className="login-link" to="/login">
                로그인으로 돌아가기
              </Link>
            </div>

            <div className="login-divider" />

            <GoogleLoginButton
              onCredential={onGoogleCredential}
              onError={(e) => setErrorMsg(e?.message || "구글 로그인 초기화 실패")}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
