import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { me } from "../api/auth";

export default function HomePage() {
  const { accessToken, user, setUser, logout } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If user wasn't returned on refresh/login, fetch it
        if (!user && accessToken) {
          const u = await me(accessToken);
          if (mounted) setUser(u);
        }
      } catch (e) {
        if (mounted) setErrorMsg(e?.message || "Failed to load /me");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [accessToken, user, setUser]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Home (3-0-0)</h1>
      {errorMsg && <div style={{ color: "crimson" }}>{errorMsg}</div>}
      <pre style={{ background: "#f5f5f5", padding: 12 }}>
        {JSON.stringify(user, null, 2)}
      </pre>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
