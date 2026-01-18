import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthed, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <div style={{ padding: 24, color: "#fff" }}>Checking session...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
