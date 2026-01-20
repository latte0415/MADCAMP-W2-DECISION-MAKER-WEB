/**
 * Idempotency-Key 관련 유틸리티 함수
 * API 스펙에 따라 일부 엔드포인트는 Idempotency-Key 헤더가 필수입니다.
 */

/**
 * UUID v4를 생성하여 Idempotency-Key로 사용합니다.
 * @returns {string} UUID v4 형식의 문자열
 */
export function generateIdempotencyKey() {
  // crypto.randomUUID()는 브라우저에서 지원됩니다 (Chrome 92+, Firefox 95+, Safari 15.4+)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // 폴백: 간단한 UUID v4 생성
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 특정 URL과 HTTP 메서드가 Idempotency-Key를 필요로 하는지 확인합니다.
 * @param {string} url - API 엔드포인트 URL
 * @param {string} [method] - HTTP 메서드 (GET, POST, PATCH, DELETE 등)
 * @returns {boolean} Idempotency-Key가 필요한지 여부
 */
export function requiresIdempotencyKey(url, method) {
  // POST와 PATCH 메서드만 Idempotency-Key를 사용합니다
  if (method !== "POST" && method !== "PATCH") {
    return false;
  }

  // Idempotency-Key가 필요한 경로 패턴들
  const idempotencyRequiredPaths = [
    "/assumption-proposals",
    "/criteria-proposals",
    "/conclusion-proposals",
    "/votes",
    "/memberships/",
    "/status",
  ];

  return idempotencyRequiredPaths.some((path) => url.includes(path));
}

/**
 * Idempotency-Key가 필요한 엔드포인트인지 확인하고,
 * 필요하면 새 키를 생성하거나 기존 키를 반환합니다.
 * @param {string} url - API 엔드포인트 URL
 * @param {string} method - HTTP 메서드
 * @param {string} [existingKey] - 기존 Idempotency-Key (재시도 시 사용)
 * @returns {string|null} Idempotency-Key 또는 null
 */
export function getIdempotencyKey(url, method, existingKey) {
  if (!requiresIdempotencyKey(url, method)) {
    return null;
  }

  // 재시도 시 같은 키를 사용합니다
  if (existingKey) {
    return existingKey;
  }

  // 새로운 키를 생성합니다
  return generateIdempotencyKey();
}
