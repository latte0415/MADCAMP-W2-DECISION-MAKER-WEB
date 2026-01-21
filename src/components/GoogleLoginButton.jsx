import React, { useEffect, useRef, useState } from "react";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google script"))
      );
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
  const [ready, setReady] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          const error = new Error("Missing VITE_GOOGLE_CLIENT_ID. Check Vercel environment variables.");
          console.error("[GoogleLoginButton] Environment variable missing:", error);
          onError?.(error);
          return;
        }

        await loadGoogleScript();
        if (!mounted) return;

        if (!window.google?.accounts?.id) {
          const error = new Error("Google Identity Services failed to load");
          console.error("[GoogleLoginButton] Google script not loaded");
          onError?.(error);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => {
            try {
              if (!resp?.credential) {
                console.error("[GoogleLoginButton] No credential in response");
                onError?.(new Error("Google login failed: no credential received"));
                return;
              }
              onCredential?.(resp.credential); // ID token (JWT)
            } catch (e) {
              console.error("[GoogleLoginButton] Callback error:", e);
              onError?.(e);
            }
          },
        });

        // Wait for the overlay container to be available
        let retryCount = 0;
        const maxRetries = 20; // 1 second max wait
        const renderButton = () => {
          if (!overlayRef.current) {
            retryCount++;
            if (retryCount < maxRetries) {
              setTimeout(renderButton, 50);
            } else {
              const error = new Error("Failed to render Google button: container not found");
              console.error("[GoogleLoginButton]", error);
              onError?.(error);
            }
            return;
          }

          try {
            overlayRef.current.innerHTML = "";

            // Match width to parent button
            const width = overlayRef.current.parentElement?.offsetWidth || 300;
            window.google.accounts.id.renderButton(overlayRef.current, {
              theme: "outline",
              size: "large",
              width: width,
            });

            setReady(true);
          } catch (e) {
            console.error("[GoogleLoginButton] Render error:", e);
            onError?.(e);
          }
        };

        renderButton();
      } catch (e) {
        console.error("[GoogleLoginButton] Initialization error:", e);
        onError?.(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onCredential, onError]);

  return (
    <button
      type="button"
      className="google-login-btn"
      aria-disabled={!ready}
      // Do NOT use disabled=... here, because it can prevent the overlay iframe from receiving clicks
      style={{ position: "relative" }}
    >
      {/* Invisible real Google button overlay (captures the click) */}
      <div
        ref={overlayRef}
        className="gis-overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          pointerEvents: ready ? "auto" : "none",
          zIndex: 10,
          cursor: ready ? "pointer" : "default",
        }}
      />

      {/* Your original visuals underneath */}
      <svg
        className="google-logo"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}
      >
        <g fill="none" fillRule="evenodd">
          <path
            d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.711c-.18-.54-.282-1.117-.282-1.711s.102-1.171.282-1.711V4.957H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.043l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.957L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </g>
      </svg>

      <span
        className="google-login-text"
        style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}
      >
        {ready ? "Google 계정으로 계속하기" : "로딩 중..."}
      </span>
    </button>
  );
}
