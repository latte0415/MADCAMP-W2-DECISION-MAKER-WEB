import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import FindPasswordPage from "./pages/FindPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import InitNamePage from "./pages/InitNamePage.jsx";
import EventPage from "./pages/EventPage.jsx";
import UserGuidePage from "./pages/UserGuidePage.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/find-password" element={<FindPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/init-name"
        element={
          <RequireAuth>
            <InitNamePage />
          </RequireAuth>
        }
      />

      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/event/:eventId"
        element={
          <RequireAuth>
            <EventPage />
          </RequireAuth>
        }
      />
      <Route path="/user-guide" element={<UserGuidePage />} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
