import React, { useEffect, useRef, useState } from "react";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

export default function GoogleLoginButton({ onCredential, onError }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) throw new Error("Missing VITE_GOOGLE_CLIENT_ID in .env");

        await loadGoogleScript();
        if (!mounted) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => onCredential?.(resp.credential),
        });

        const el = containerRef.current;
        if (!el) return;

        // Clear old button (important in StrictMode)
        el.innerHTML = "";

        // Size to the container width (the parent decides the width via CSS)
        const w = Math.floor(el.clientWidth);

        window.google.accounts.id.renderButton(el, {
          theme: "filled_black",
          size: "large",
          width: w, // THIS is the key: use actual available width
          text: "continue_with",
        });

        setReady(true);
      } catch (e) {
        onError?.(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onCredential, onError]);

  return (
    <div className="google-wrap">
      {!ready && <div className="login-subtle-note">Google 로그인 로딩 중...</div>}
      {/* This div’s width is controlled by .google-wrap */}
      <div ref={containerRef} className="google-inner" />
    </div>
  );
}
