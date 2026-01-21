import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { LoadingSpinner } from './LoadingSpinner';
import { apiClient } from '../utils/api';
import './EventSetting.css';

interface EventSettingProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SettingData {
  decision_subject: string;
  options: Array<{ id?: string; content: string }>;
  assumptions: Array<{ id?: string; content: string }>;
  criteria: Array<{ id?: string; content: string }>;
  max_membership: number;
  assumption_is_auto_approved_by_votes: boolean;
  assumption_min_votes_required: number | null;
  criteria_is_auto_approved_by_votes: boolean;
  criteria_min_votes_required: number | null;
  conclusion_approval_threshold_percent: number | null;
  membership_is_auto_approved: boolean;
  entrance_code: string;
}

const EventSetting: React.FC<EventSettingProps> = ({
  eventId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SettingData>({
    decision_subject: '',
    options: [],
    assumptions: [],
    criteria: [],
    max_membership: 10,
    assumption_is_auto_approved_by_votes: false,
    assumption_min_votes_required: null,
    criteria_is_auto_approved_by_votes: false,
    criteria_min_votes_required: null,
    conclusion_approval_threshold_percent: null,
    membership_is_auto_approved: false,
    entrance_code: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadSettingData();
    }
  }, [isOpen, eventId]);

  const loadSettingData = async () => {
    try {
      setLoadingData(true);
      const data = await apiClient.get<SettingData>(`/v1/events/${eventId}/setting`);
      setFormData(data);
    } catch (error) {
      console.error('설정 데이터 로드 실패:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.patch(`/v1/events/${eventId}`, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || '설정 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { content: '' }],
    });
  };

  const updateOption = (index: number, content: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], content };
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = [...formData.options];
    if (newOptions[index].id) {
      newOptions[index] = { ...newOptions[index], content: null as any };
    } else {
      newOptions.splice(index, 1);
    }
    setFormData({ ...formData, options: newOptions });
  };

  const addAssumption = () => {
    setFormData({
      ...formData,
      assumptions: [...formData.assumptions, { content: '' }],
    });
  };

  const updateAssumption = (index: number, content: string) => {
    const newAssumptions = [...formData.assumptions];
    newAssumptions[index] = { ...newAssumptions[index], content };
    setFormData({ ...formData, assumptions: newAssumptions });
  };

  const removeAssumption = (index: number) => {
    const newAssumptions = [...formData.assumptions];
    if (newAssumptions[index].id) {
      newAssumptions[index] = { ...newAssumptions[index], content: null as any };
    } else {
      newAssumptions.splice(index, 1);
    }
    setFormData({ ...formData, assumptions: newAssumptions });
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { content: '' }],
    });
  };

  const updateCriterion = (index: number, content: string) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], content };
    setFormData({ ...formData, criteria: newCriteria });
  };

  const removeCriterion = (index: number) => {
    const newCriteria = [...formData.criteria];
    if (newCriteria[index].id) {
      newCriteria[index] = { ...newCriteria[index], content: null as any };
    } else {
      newCriteria.splice(index, 1);
    }
    setFormData({ ...formData, criteria: newCriteria });
  };

  if (loadingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="이벤트 설정" size="lg">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="이벤트 설정" size="lg">
      <form onSubmit={handleSubmit} className="event-setting-form">
        <div className="form-section">
          <h3 className="section-title">기본 정보</h3>
          <Input
            label="주제"
            value={formData.decision_subject}
            onChange={(e) =>
              setFormData({ ...formData, decision_subject: e.target.value })
            }
            disabled={loading}
          />
          <div className="form-group">
            <label className="form-label">선택지</label>
            {formData.options.map((option, index) => (
              <div key={index} className="list-item">
                <Input
                  value={option.content || ''}
                  onChange={(e) => updateOption(index, e.target.value)}
                  disabled={loading || !option.content}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeOption(index)}
                  disabled={loading}
                >
                  삭제
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={addOption} disabled={loading}>
              + 선택지 추가
            </Button>
          </div>
          <div className="form-group">
            <label className="form-label">전제</label>
            {formData.assumptions.map((assumption, index) => (
              <div key={index} className="list-item">
                <Input
                  value={assumption.content || ''}
                  onChange={(e) => updateAssumption(index, e.target.value)}
                  disabled={loading || !assumption.content}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeAssumption(index)}
                  disabled={loading}
                >
                  삭제
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={addAssumption} disabled={loading}>
              + 전제 추가
            </Button>
          </div>
          <div className="form-group">
            <label className="form-label">기준</label>
            {formData.criteria.map((criterion, index) => (
              <div key={index} className="list-item">
                <Input
                  value={criterion.content || ''}
                  onChange={(e) => updateCriterion(index, e.target.value)}
                  disabled={loading || !criterion.content}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeCriterion(index)}
                  disabled={loading}
                >
                  삭제
                </Button>
              </div>
            ))}
            <Button type="button" variant="ghost" onClick={addCriterion} disabled={loading}>
              + 기준 추가
            </Button>
          </div>
          <Input
            type="number"
            label="최대 인원"
            value={formData.max_membership}
            onChange={(e) =>
              setFormData({ ...formData, max_membership: parseInt(e.target.value) })
            }
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
                value={formData.assumption_min_votes_required || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assumption_min_votes_required: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
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
                value={formData.criteria_min_votes_required || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    criteria_min_votes_required: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                disabled={loading}
              />
            )}
          </div>
          <Input
            type="number"
            label="결론이 승인되는 최소 동의 투표 퍼센티지 (1~100)"
            value={formData.conclusion_approval_threshold_percent || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                conclusion_approval_threshold_percent: e.target.value
                  ? parseInt(e.target.value)
                  : null,
              })
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
          <Input
            label="입장 코드 (수정 불가)"
            value={formData.entrance_code}
            disabled
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            닫기
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '수정 중...' : '수정하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EventSetting;
