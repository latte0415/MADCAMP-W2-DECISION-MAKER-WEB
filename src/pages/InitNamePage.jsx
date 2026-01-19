import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function InitNamePage() {
  const navigate = useNavigate();
  const { bootstrapping, user, setName } = useAuth();

  const [name, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If user already has a name, don't keep them here
  useEffect(() => {
    if (!bootstrapping && user?.name) {
      navigate("/home", { replace: true });
    }
  }, [bootstrapping, user, navigate]);

  const canSubmit = useMemo(() => {
    return name.trim() && !loading && !bootstrapping;
  }, [name, loading, bootstrapping]);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await setName(name.trim());
      navigate("/home", { replace: true });
    } catch (err) {
      setErrorMsg(err?.message || "이름 설정에 실패했습니다.");
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
            >
              ×
            </button>
            <div className="login-error-text">{errorMsg}</div>
          </div>
        )}

        <div className="login-stack" style={{ alignItems: "center" }}>
          <h1 className="login-title">Decision Maker</h1>

          <div style={{ textAlign: "center", marginTop: 6, marginBottom: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 500 }}>이름을 입력해주세요.</div>
            <div style={{ fontSize: 18, color: "rgba(0,0,0,0.45)", marginTop: 6 }}>
              이름은 나중에 설정 탭에서 변경 가능합니다.
            </div>
          </div>

          <form onSubmit={onSubmit} className="login-form" style={{ width: "100%" }}>
            <input
              className="login-input"
              type="text"
              placeholder="Name:"
              value={name}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={loading || bootstrapping}
            />

            <button className="login-primary-btn" type="submit" disabled={!canSubmit}>
              {loading ? "저장 중..." : "시작하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
