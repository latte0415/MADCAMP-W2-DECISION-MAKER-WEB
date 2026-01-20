/**
 * 코멘트 관리 훅
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as commentsApi from "../api/comments";

/**
 * 코멘트 관리 훅
 * @param {string} eventId - 이벤트 ID
 * @param {string} criterionId - 기준 ID
 * @param {boolean} enabled - 활성화 여부
 */
export function useComments(eventId, criterionId, enabled = true) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inFlightRef = useRef(false);

  const fetchComments = useCallback(async () => {
    if (!eventId || !criterionId || !enabled) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    setError("");

    try {
      const data = await commentsApi.listCriteriaComments(eventId, criterionId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "코멘트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [eventId, criterionId, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchComments();
    }
  }, [enabled, fetchComments]);

  const refresh = useCallback(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    refresh,
  };
}
