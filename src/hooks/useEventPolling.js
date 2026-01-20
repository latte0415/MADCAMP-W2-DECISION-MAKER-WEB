/**
 * 이벤트 폴링 훅
 * 주기적으로 이벤트 데이터를 새로고침합니다.
 */
import { useEffect, useRef } from "react";

/**
 * 이벤트 폴링 훅
 * @param {Function} fetchFn - 데이터를 가져오는 함수
 * @param {number} intervalMs - 폴링 간격 (밀리초)
 * @param {boolean} enabled - 폴링 활성화 여부
 */
export function useEventPolling(fetchFn, intervalMs = 1500, enabled = true) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !fetchFn) return;

    // 즉시 한 번 실행
    fetchFn();

    // 주기적으로 실행
    intervalRef.current = setInterval(() => {
      fetchFn();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchFn, intervalMs, enabled]);
}
