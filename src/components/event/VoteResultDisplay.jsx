/**
 * 투표 결과 표시 컴포넌트
 * FINISHED 상태일 때만 표시
 */
import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay, getErrorMessage } from "../common/ErrorDisplay";
import * as votesApi from "../../api/votes";
import "../../styles/voteresult.css";

/**
 * 투표 결과 표시
 * @param {string} eventId - 이벤트 ID
 * @param {string} eventStatus - 이벤트 상태 (FINISHED일 때만 표시)
 */
export default function VoteResultDisplay({ eventId, eventStatus }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId || eventStatus !== "FINISHED") return;

    let alive = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const data = await votesApi.getVoteResult(eventId);
        if (alive) setResult(data);
      } catch (err) {
        if (alive) setError(getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [eventId, eventStatus]);

  // FINISHED 상태가 아니면 표시하지 않음
  if (eventStatus !== "FINISHED") {
    return null;
  }

  if (loading) {
    return (
      <div className="vote-result-section">
        <h3 className="event-section-title">투표 결과</h3>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <LoadingSpinner message="투표 결과를 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-result-section">
        <h3 className="event-section-title">투표 결과</h3>
        <ErrorDisplay message={error} />
      </div>
    );
  }

  if (!result) return null;

  const {
    total_participants_count = 0,
    voted_participants_count = 0,
    option_vote_counts = [],
    first_priority_criteria = [],
    weighted_criteria = [],
  } = result;

  const voteRate = total_participants_count > 0 
    ? Math.round((voted_participants_count / total_participants_count) * 100) 
    : 0;

  return (
    <div className="vote-result-section">
      <h3 className="event-section-title">투표 결과</h3>

      <div className="vote-result-summary">
        <div className="vote-result-stat">
          <div className="vote-result-stat-label">전체 참가자</div>
          <div className="vote-result-stat-value">{total_participants_count}명</div>
        </div>
        <div className="vote-result-stat">
          <div className="vote-result-stat-label">투표 참여자</div>
          <div className="vote-result-stat-value">{voted_participants_count}명 ({voteRate}%)</div>
        </div>
      </div>

      <div className="vote-result-section-item">
        <h4 className="vote-result-subtitle">선택지별 투표 수</h4>
        <div className="vote-result-list">
          {option_vote_counts.map((item) => (
            <div key={item.option_id} className="vote-result-item">
              <div className="vote-result-item-label">{item.option_content}</div>
              <div className="vote-result-item-value">
                {item.vote_count}표 ({total_participants_count > 0 ? Math.round((item.vote_count / total_participants_count) * 100) : 0}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="vote-result-section-item">
        <h4 className="vote-result-subtitle">1순위 기준 통계</h4>
        <div className="vote-result-list">
          {first_priority_criteria.length > 0 ? (
            first_priority_criteria.map((item) => (
              <div key={item.criterion_id} className="vote-result-item">
                <div className="vote-result-item-label">{item.criterion_content}</div>
                <div className="vote-result-item-value">{item.count}표</div>
              </div>
            ))
          ) : (
            <div className="vote-result-empty">데이터가 없습니다.</div>
          )}
        </div>
      </div>

      <div className="vote-result-section-item">
        <h4 className="vote-result-subtitle">가중치 기준 통계 (1위=3점, 2위=2점, 3위=1점)</h4>
        <div className="vote-result-list">
          {weighted_criteria.length > 0 ? (
            weighted_criteria.map((item) => (
              <div key={item.criterion_id} className="vote-result-item">
                <div className="vote-result-item-label">{item.criterion_content}</div>
                <div className="vote-result-item-value">{item.count}점</div>
              </div>
            ))
          ) : (
            <div className="vote-result-empty">데이터가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
