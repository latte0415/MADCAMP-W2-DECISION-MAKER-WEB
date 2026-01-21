import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { apiClient, generateIdempotencyKey } from '../utils/api';
import './EventVote.css';

interface EventVoteProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface VoteData {
  option_id: string | null;
  criterion_order: string[];
  created_at: string;
  updated_at: string;
  decision_subject: string;
  options: Array<{ id: string; content: string }>;
  criteria: Array<{ id: string; content: string }>;
}

const EventVote: React.FC<EventVoteProps> = ({ eventId, isOpen, onClose, onSuccess }) => {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [criterionOrder, setCriterionOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadVoteData();
    }
  }, [isOpen, eventId]);

  const loadVoteData = async () => {
    try {
      setLoadingData(true);
      const data = await apiClient.get<VoteData>(`/v1/events/${eventId}/votes/me`);
      setVoteData(data);
      setSelectedOption(data.option_id || null);
      setCriterionOrder(data.criterion_order || []);
    } catch (error) {
      console.error('투표 데이터 로드 실패:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedOption) {
      setError('선택지를 선택해주세요.');
      return;
    }

    if (criterionOrder.length === 0) {
      setError('기준 우선순위를 설정해주세요.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post(
        `/v1/events/${eventId}/votes`,
        {
          option_id: selectedOption,
          criterion_ids: criterionOrder,
        },
        generateIdempotencyKey()
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || '투표에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const moveCriterion = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...criterionOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setCriterionOrder(newOrder);
  };

  const addCriterion = (criterionId: string) => {
    if (!criterionOrder.includes(criterionId)) {
      setCriterionOrder([...criterionOrder, criterionId]);
    }
  };

  const removeCriterion = (criterionId: string) => {
    setCriterionOrder(criterionOrder.filter((id) => id !== criterionId));
  };

  if (loadingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="투표하기" size="md">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  if (!voteData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="투표하기" size="md">
        <div>투표 데이터를 불러올 수 없습니다.</div>
      </Modal>
    );
  }

  const availableCriteria = voteData.criteria.filter(
    (criterion) => !criterionOrder.includes(criterion.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="투표하기" size="md">
      <form onSubmit={handleSubmit} className="vote-form">
        <div className="vote-section">
          <h3 className="vote-section-title">선택지 선택</h3>
          <div className="options-grid">
            {voteData.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`option-button ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option.id)}
              >
                {option.content}
              </button>
            ))}
          </div>
        </div>

        <div className="vote-section">
          <h3 className="vote-section-title">기준 우선순위</h3>
          <div className="criterion-order">
            {criterionOrder.map((criterionId, index) => {
              const criterion = voteData.criteria.find((c) => c.id === criterionId);
              if (!criterion) return null;
              return (
                <div key={criterionId} className="criterion-order-item">
                  <span className="order-number">{index + 1}</span>
                  <span className="criterion-content">{criterion.content}</span>
                  <div className="order-actions">
                    <button
                      type="button"
                      onClick={() => moveCriterion(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCriterion(index, 'down')}
                      disabled={index === criterionOrder.length - 1}
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => removeCriterion(criterionId)}>
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {availableCriteria.length > 0 && (
            <div className="available-criteria">
              <h4>추가할 기준</h4>
              {availableCriteria.map((criterion) => (
                <button
                  key={criterion.id}
                  type="button"
                  className="add-criterion-button"
                  onClick={() => addCriterion(criterion.id)}
                >
                  + {criterion.content}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <div className="vote-error">{error}</div>}

        <div className="vote-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            닫기
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '투표 중...' : '투표하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EventVote;
