import React from "react";
import { useParams, Link } from "react-router-dom";

export default function EventPage() {
  const { eventId } = useParams();

  return (
    <div style={{ padding: 24 }}>
      <h2>Event Page (4-0-0) Placeholder</h2>
      <div style={{ marginTop: 8 }}>eventId: {eventId}</div>
      <div style={{ marginTop: 16 }}>
        <Link to="/home">← 홈으로</Link>
      </div>
    </div>
  );
}
