import React, { useState, useEffect } from 'react';
import { apiClient, generateIdempotencyKey } from '../utils/api';
import { Button } from './Button';
import { Input } from './Input';
import type { EventDetail } from '../api/events';
import './ProposalInput.css';

interface ProposalInputProps {
  eventId: string;
  event: EventDetail;
  onSuccess: () => void;
}

const ProposalInput: React.FC<ProposalInputProps> = ({
  eventId,
  event,
  onSuccess,
}) => {
  const [category, setCategory] = useState<'assumption' | 'criterion' | ''>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [action, setAction] = useState<'add' | 'modify' | 'delete' | 'comment' | 'conclusion' | ''>('');
  const [content, setContent] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 액션 변경 시 번호 초기화
  useEffect(() => {
    if (action === 'add') {
      setSelectedId('');
    }
  }, [action]);

  // 카테고리 변경 시 번호 초기화
  useEffect(() => {
    setSelectedId('');
    setAction('');
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('분류를 선택해주세요.');
      return;
    }

    if (action === 'add') {
      if (!content.trim()) {
        setError('내용을 입력해주세요.');
        return;
      }
    } else if (action === 'modify' || action === 'delete') {
      if (!selectedId) {
        setError('번호를 선택해주세요.');
        return;
      }
      if (action === 'modify' && !content.trim()) {
        setError('내용을 입력해주세요.');
        return;
      }
    } else if (action === 'comment' || action === 'conclusion') {
      if (!selectedId) {
        setError('번호를 선택해주세요.');
        return;
      }
      if (!content.trim()) {
        setError('내용을 입력해주세요.');
        return;
      }
    } else {
      setError('액션을 선택해주세요.');
      return;
    }

    setLoading(true);

    try {
      if (category === 'assumption') {
        const proposalCategory =
          action === 'add' ? 'CREATION' : action === 'modify' ? 'MODIFICATION' : 'DELETION';
        await apiClient.post(
          `/v1/events/${eventId}/assumption-proposals`,
          {
            proposal_category: proposalCategory,
            assumption_id: selectedId || null,
            proposal_content: content || null,
            reason: reason || null,
          },
          generateIdempotencyKey()
        );
      } else if (category === 'criterion') {
        if (action === 'conclusion') {
          await apiClient.post(
            `/v1/events/${eventId}/criteria/${selectedId}/conclusion-proposals`,
            {
              proposal_content: content,
            },
            generateIdempotencyKey()
          );
        } else {
          const proposalCategory =
            action === 'add'
              ? 'CREATION'
              : action === 'modify'
              ? 'MODIFICATION'
              : 'DELETION';
          await apiClient.post(
            `/v1/events/${eventId}/criteria-proposals`,
            {
              proposal_category: proposalCategory,
              criteria_id: selectedId || null,
              proposal_content: content || null,
              reason: reason || null,
            },
            generateIdempotencyKey()
          );
        }
      }

      // 성공 시 폼 초기화
      setContent('');
      setReason('');
      setError('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || '제안 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableItems = () => {
    if (category === 'assumption') {
      return event.assumptions.map((assumption, index) => ({
        id: assumption.id,
        content: assumption.content,
        number: index + 1,
      }));
    } else if (category === 'criterion') {
      return event.criteria.map((criterion, index) => ({
        id: criterion.id,
        content: criterion.content,
        number: index + 1,
      }));
    }
    return [];
  };

  const getAvailableActions = (): Array<{ value: string; label: string }> => {
    if (!category) return [];
    
    if (category === 'assumption') {
      return [
        { value: 'add', label: '추가' },
        { value: 'modify', label: '수정' },
        { value: 'delete', label: '삭제' },
      ];
    } else {
      return [
        { value: 'add', label: '추가' },
        { value: 'modify', label: '수정' },
        { value: 'delete', label: '삭제' },
        { value: 'comment', label: '코멘트' },
        { value: 'conclusion', label: '결론' },
      ];
    }
  };

  const showContentInput = () => {
    if (action === 'delete') return false;
    if (action === 'add' || action === 'modify' || action === 'comment' || action === 'conclusion') {
      return true;
    }
    return false;
  };

  const showReasonInput = () => {
    return action === 'add' || action === 'modify' || action === 'delete';
  };

  const showNumberSelect = () => {
    return action !== 'add' && action !== '';
  };

  return (
    <div className="proposal-input-container">
      <div className="proposal-input">
        <form onSubmit={handleSubmit} className="proposal-form">
          <div className="proposal-dropdowns">
            <select
              className="proposal-dropdown"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'assumption' | 'criterion' | '')}
              disabled={loading}
            >
              <option value="">분류 선택</option>
              <option value="assumption">전제</option>
              <option value="criterion">기준</option>
            </select>

            {showNumberSelect() && (
              <select
                className="proposal-dropdown"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading}
              >
                <option value="">번호 선택</option>
                {getAvailableItems().map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.number}번: {item.content}
                  </option>
                ))}
              </select>
            )}

            <select
              className="proposal-dropdown"
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              disabled={loading || !category}
            >
              <option value="">액션 선택</option>
              {getAvailableActions().map((act) => (
                <option key={act.value} value={act.value}>
                  {act.label}
                </option>
              ))}
            </select>
          </div>

          {showContentInput() && (
            <Input
              label={action === 'comment' || action === 'conclusion' ? '내용' : '제안 내용'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={loading}
              multiline={action === 'comment' || action === 'conclusion'}
              rows={action === 'comment' || action === 'conclusion' ? 3 : undefined}
            />
          )}

          {showReasonInput() && (
            <Input
              label="이유 (선택)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
            />
          )}

          {error && <div className="proposal-error">{error}</div>}

          <div className="proposal-actions">
            <Button type="submit" disabled={loading || !category || !action}>
              {loading ? '제안 중...' : '제안하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalInput;
