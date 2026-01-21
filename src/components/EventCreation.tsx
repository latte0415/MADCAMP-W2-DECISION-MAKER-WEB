import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { eventsApi, generateIdempotencyKey } from '../api/events';
import './EventCreation.css';

interface EventCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EventCreation: React.FC<EventCreationProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    decision_subject: '',
    entrance_code: '',
    assumption_is_auto_approved_by_votes: false,
    criteria_is_auto_approved_by_votes: false,
    membership_is_auto_approved: false,
    conclusion_is_auto_approved_by_votes: false,
    assumption_min_votes_required: '',
    criteria_min_votes_required: '',
    conclusion_approval_threshold_percent: '',
    max_membership: '',
    options: [''],
    assumptions: [''],
    criteria: [''],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateCode = async () => {
    try {
      const response = await eventsApi.generateEntranceCode();
      setFormData({ ...formData, entrance_code: response.code });
    } catch (error) {
      console.error('코드 생성 실패:', error);
    }
  };

  const handleCheckCode = async () => {
    if (!formData.entrance_code) return;
    try {
      const response = await eventsApi.checkEntranceCode(formData.entrance_code);
      if (!response.is_available) {
        setError('이미 사용 중인 코드입니다.');
      } else {
        setError('');
        alert('사용 가능한 코드입니다.');
      }
    } catch (error: any) {
      setError(error.message || '코드 확인 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        decision_subject: formData.decision_subject,
        entrance_code: formData.entrance_code.toUpperCase(),
        assumption_is_auto_approved_by_votes: formData.assumption_is_auto_approved_by_votes,
        criteria_is_auto_approved_by_votes: formData.criteria_is_auto_approved_by_votes,
        membership_is_auto_approved: formData.membership_is_auto_approved,
        conclusion_is_auto_approved_by_votes: formData.conclusion_is_auto_approved_by_votes,
        assumption_min_votes_required: formData.assumption_min_votes_required
          ? parseInt(formData.assumption_min_votes_required)
          : null,
        criteria_min_votes_required: formData.criteria_min_votes_required
          ? parseInt(formData.criteria_min_votes_required)
          : null,
        conclusion_approval_threshold_percent: formData.conclusion_approval_threshold_percent
          ? parseInt(formData.conclusion_approval_threshold_percent)
          : null,
        max_membership: parseInt(formData.max_membership),
        options: formData.options.filter((opt) => opt.trim()).map((content) => ({ content })),
        assumptions: formData.assumptions.filter((ass) => ass.trim()).map((content) => ({ content })),
        criteria: formData.criteria.filter((cri) => cri.trim()).map((content) => ({ content })),
      };

      await eventsApi.createEvent(payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || '이벤트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (formData.options.length < 5) {
      setFormData({ ...formData, options: [...formData.options, ''] });
    }
  };

  const addAssumption = () => {
    if (formData.assumptions.length < 10) {
      setFormData({ ...formData, assumptions: [...formData.assumptions, ''] });
    }
  };

  const addCriterion = () => {
    if (formData.criteria.length < 10) {
      setFormData({ ...formData, criteria: [...formData.criteria, ''] });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="이벤트 생성" size="lg">
      <form onSubmit={handleSubmit} className="event-creation-form">
        <div className="form-section">
          <h3 className="section-title">기본 정보</h3>
          <Input
            label="주제"
            value={formData.decision_subject}
            onChange={(e) => setFormData({ ...formData, decision_subject: e.target.value })}
            required
            disabled={loading}
          />
          <div className="form-group">
            <label className="form-label">선택지 (최대 5개)</label>
            {formData.options.map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(e) => {
                  const newOptions = [...formData.options];
                  newOptions[index] = e.target.value;
                  setFormData({ ...formData, options: newOptions });
                }}
                placeholder={`선택지 ${index + 1}`}
                disabled={loading}
              />
            ))}
            {formData.options.length < 5 && (
              <Button type="button" variant="ghost" onClick={addOption}>
                + 선택지 추가
              </Button>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">전제 (최대 10개)</label>
            {formData.assumptions.map((assumption, index) => (
              <Input
                key={index}
                value={assumption}
                onChange={(e) => {
                  const newAssumptions = [...formData.assumptions];
                  newAssumptions[index] = e.target.value;
                  setFormData({ ...formData, assumptions: newAssumptions });
                }}
                placeholder={`전제 ${index + 1}`}
                disabled={loading}
              />
            ))}
            {formData.assumptions.length < 10 && (
              <Button type="button" variant="ghost" onClick={addAssumption}>
                + 전제 추가
              </Button>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">기준 (최대 10개)</label>
            {formData.criteria.map((criterion, index) => (
              <Input
                key={index}
                value={criterion}
                onChange={(e) => {
                  const newCriteria = [...formData.criteria];
                  newCriteria[index] = e.target.value;
                  setFormData({ ...formData, criteria: newCriteria });
                }}
                placeholder={`기준 ${index + 1}`}
                disabled={loading}
              />
            ))}
            {formData.criteria.length < 10 && (
              <Button type="button" variant="ghost" onClick={addCriterion}>
                + 기준 추가
              </Button>
            )}
          </div>
          <Input
            type="number"
            label="최대 인원"
            value={formData.max_membership}
            onChange={(e) => setFormData({ ...formData, max_membership: e.target.value })}
            required
            min="1"
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <h3 className="section-title">투표 허용 정책</h3>
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.assumption_is_auto_approved_by_votes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assumption_is_auto_approved_by_votes: e.target.checked,
                  })
                }
                disabled={loading}
              />
              <span>투표로 전제 제안/편집 허용하기</span>
            </label>
            {formData.assumption_is_auto_approved_by_votes && (
              <Input
                type="number"
                label="전제 제안/편집 허용하는 최소 투표 수"
                value={formData.assumption_min_votes_required}
                onChange={(e) =>
                  setFormData({ ...formData, assumption_min_votes_required: e.target.value })
                }
                disabled={loading}
              />
            )}
          </div>
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.criteria_is_auto_approved_by_votes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criteria_is_auto_approved_by_votes: e.target.checked,
                  })
                }
                disabled={loading}
              />
              <span>투표로 기준 제안/편집 허용하기</span>
            </label>
            {formData.criteria_is_auto_approved_by_votes && (
              <Input
                type="number"
                label="기준 제안/편집 허용하는 최소 투표 수"
                value={formData.criteria_min_votes_required}
                onChange={(e) =>
                  setFormData({ ...formData, criteria_min_votes_required: e.target.value })
                }
                disabled={loading}
              />
            )}
          </div>
          <Input
            type="number"
            label="결론이 승인되는 최소 동의 투표 퍼센티지 (1~100)"
            value={formData.conclusion_approval_threshold_percent}
            onChange={(e) =>
              setFormData({ ...formData, conclusion_approval_threshold_percent: e.target.value })
            }
            min="1"
            max="100"
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <h3 className="section-title">입장 정책</h3>
          <div className="toggle-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={formData.membership_is_auto_approved}
                onChange={(e) =>
                  setFormData({ ...formData, membership_is_auto_approved: e.target.checked })
                }
                disabled={loading}
              />
              <span>가입 승인 자동 여부</span>
            </label>
          </div>
          <div className="code-input-group">
            <Input
              label="입장 코드"
              value={formData.entrance_code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 6);
                setFormData({ ...formData, entrance_code: value });
              }}
              placeholder="6자리 코드"
              maxLength={6}
              required
              disabled={loading}
            />
            <div className="code-actions">
              <Button type="button" variant="secondary" onClick={handleGenerateCode}>
                랜덤 생성
              </Button>
              <Button type="button" variant="secondary" onClick={handleCheckCode}>
                중복 확인
              </Button>
            </div>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            닫기
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '생성 중...' : '생성하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EventCreation;
