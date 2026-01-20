import React from "react";
import "../styles/eventErrorBanner.css";

/**
 * variant: "error" | "success"
 */
export default function EventErrorBanner({ message, variant = "error", onClose }) {
  if (!message) return null;

  const cls =
    variant === "success"
      ? "event-banner event-banner--success"
      : "event-banner event-banner--error";

  return (
    <div className={cls} role="alert" aria-live="polite">
      <button
        className="event-banner-close"
        onClick={() => onClose?.()}
        aria-label="Close error"
        type="button"
      >
        ×
      </button>
      <div className="event-banner-text">{message}</div>
    </div>
  );
}