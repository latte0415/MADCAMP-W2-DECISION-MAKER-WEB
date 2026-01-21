/**
 * 투표 모달 컴포넌트
 * 선택지 선택 및 기준 우선순위 정렬
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ModalShell from "../ModalShell";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorDisplay, getErrorMessage } from "../common/ErrorDisplay";
import * as votesApi from "../../api/votes";
import "../../styles/votemodal.css";

/**
 * 투표 모달
 * @param {boolean} open - 모달 열림 여부
 * @param {string} eventId - 이벤트 ID
 * @param {Array} options - 선택지 목록
 * @param {Array} criteria - 기준 목록 (활성화된 것만)
 * @param {Function} onClose - 모달 닫기 핸들러
 * @param {Function} onSuccess - 투표 성공 핸들러
 */
export default function VoteModal({ open, eventId, options = [], criteria = [], onClose, onSuccess }) {
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [criterionOrder, setCriterionOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMyVote, setLoadingMyVote] = useState(false);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  // 활성화된 기준만 필터링 (is_deleted가 false인 것만)
  const activeCriteria = useMemo(() => {
    return criteria.filter((c) => !c.is_deleted);
  }, [criteria]);

  // 모달이 열릴 때 기존 투표 불러오기
  useEffect(() => {
    if (!open || !eventId) return;

    let alive = true;
    setLoadingMyVote(true);
    setError("");

    (async () => {
      try {
        const myVote = await votesApi.getMyVote(eventId);
        if (alive) {
          if (myVote.option_id) {
            setSelectedOptionId(myVote.option_id);
            // criterion_order가 있으면 사용, 없으면 criteria 순서 사용
            if (myVote.criterion_order && myVote.criterion_order.length > 0) {
              setCriterionOrder(myVote.criterion_order);
            } else {
              // 기존 투표가 없으면 활성 기준의 기본 순서 사용
              setCriterionOrder(activeCriteria.map((c) => c.id));
            }
          } else {
            // 투표가 없으면 활성 기준의 기본 순서 사용
            setCriterionOrder(activeCriteria.map((c) => c.id));
          }
        }
      } catch (err) {
        if (alive) {
          // 투표가 없는 경우는 에러가 아닐 수 있음
          if (err.status !== 404) {
            setError(getErrorMessage(err));
          } else {
            // 투표가 없으면 활성 기준의 기본 순서 사용
            setCriterionOrder(activeCriteria.map((c) => c.id));
          }
        }
      } finally {
        if (alive) setLoadingMyVote(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, eventId, activeCriteria]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSelectedOptionId(null);
      setCriterionOrder([]);
      setError("");
      setDraggedIndex(null);
    }
  }, [open]);

  // 기준 순서가 변경될 때 criterionOrder 업데이트
  useEffect(() => {
    if (activeCriteria.length > 0 && criterionOrder.length === 0) {
      setCriterionOrder(activeCriteria.map((c) => c.id));
    }
  }, [activeCriteria, criterionOrder.length]);

  // 드래그 시작
  const handleDragStart = useCallback((index) => {
    setDraggedIndex(index);
  }, []);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // 드래그 오버
  const handleDragOver = useCallback(
    (e, index) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      const newOrder = [...criterionOrder];
      const draggedItem = newOrder[draggedIndex];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(index, 0, draggedItem);
      setCriterionOrder(newOrder);
      setDraggedIndex(index);
    },
    [criterionOrder, draggedIndex]
  );

  // 투표 제출
  const handleSubmit = useCallback(async () => {
    if (!selectedOptionId) {
      setError("선택지를 선택해주세요.");
      return;
    }

    if (criterionOrder.length === 0) {
      setError("기준을 정렬해주세요.");
      return;
    }

    // 모든 활성 기준이 포함되어 있는지 확인
    const activeCriterionIds = new Set(activeCriteria.map((c) => c.id));
    const orderSet = new Set(criterionOrder);
    const missing = [...activeCriterionIds].filter((id) => !orderSet.has(id));

    if (missing.length > 0) {
      setError("모든 기준이 포함되어야 합니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await votesApi.createOrUpdateVote(eventId, {
        option_id: selectedOptionId,
        criterion_ids: criterionOrder,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, selectedOptionId, criterionOrder, activeCriteria, onClose, onSuccess]);

  if (!open) return null;

  return (
    <ModalShell open={open} title="투표하기" onClose={onClose}>
      <div className="vote-modal-content">
        {loadingMyVote && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <LoadingSpinner message="투표 정보를 불러오는 중..." />
          </div>
        )}

        {!loadingMyVote && (
          <>
            {error && <ErrorDisplay message={error} dismissible onDismiss={() => setError("")} />}

            <div className="vote-section">
              <h3 className="vote-section-title" style={{marginTop: "-30px"}}>선택지 선택</h3>
              <div className="vote-options">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`vote-option-btn ${selectedOptionId === option.id ? "vote-option-btn--selected" : ""}`}
                    onClick={() => setSelectedOptionId(option.id)}
                  >
                    {option.content}
                  </button>
                ))}
              </div>
            </div>

            <div className="vote-section">
              <h3 className="vote-section-title">기준 우선순위 정렬</h3>
              <p className="vote-section-hint">드래그하여 순서를 변경할 수 있습니다.</p>
              <div className="vote-criteria-list">
                {criterionOrder.map((criterionId, index) => {
                  const criterion = activeCriteria.find((c) => c.id === criterionId);
                  if (!criterion) return null;

                  return (
                    <div
                      key={criterionId}
                      className={`vote-criterion-item ${draggedIndex === index ? "vote-criterion-item--dragging" : ""}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                    >
                      <div className="vote-criterion-handle">☰</div>
                      <div className="vote-criterion-rank">{index + 1}</div>
                      <div className="vote-criterion-content">{criterion.content}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="vote-modal-actions">
              <button type="button" className="dm-btn dm-btn--outline" onClick={onClose}>
                취소
              </button>
              <button
                type="button"
                className="dm-btn dm-btn--primary"
                onClick={handleSubmit}
                disabled={loading || !selectedOptionId || criterionOrder.length === 0}
              >
                {loading ? "투표 중..." : "투표하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}
