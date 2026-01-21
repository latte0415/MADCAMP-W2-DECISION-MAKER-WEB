import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { eventsApi, type EventOverview as EventOverviewType } from '../api/events';
import './EventOverview.css';

interface EventOverviewProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onEnter: () => void;
}

const EventOverview: React.FC<EventOverviewProps> = ({
  eventId,
  isOpen,
  onClose,
  onEnter,
}) => {
  const [overview, setOverview] = useState<EventOverviewType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && eventId) {
      loadOverview();
    }
  }, [isOpen, eventId]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getEventOverview(eventId);
      setOverview(data);
    } catch (error) {
      console.error('오버뷰 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      NOT_STARTED: '시작 전',
      IN_PROGRESS: '진행 중',
      PAUSED: '일시정지',
      FINISHED: '종료',
    };
    return statusMap[status] || status;
  };

  const getMembershipMessage = () => {
    if (!overview) return '';
    if (overview.membership_status === 'REJECTED') {
      return { text: '가입이 거절되었습니다', disabled: true };
    }
    if (overview.membership_status === 'PENDING') {
      return { text: '승인 대기 중입니다', disabled: true };
    }
    if (overview.membership_status === 'ACCEPTED') {
      return { text: '가입이 승인되었습니다', disabled: false };
    }
    return { text: '', disabled: true };
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="이벤트 개요" size="md">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  if (!overview) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="이벤트 개요" size="md">
        <div>이벤트 정보를 불러올 수 없습니다.</div>
      </Modal>
    );
  }

  const membershipMessage = getMembershipMessage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="이벤트 개요" size="md">
      <div className="event-overview">
        <div className="overview-section">
          <h3 className="overview-label">주제</h3>
          <p className="overview-value">{overview.event.decision_subject}</p>
        </div>

        <div className="overview-section">
          <h3 className="overview-label">선택지</h3>
          <ul className="options-list">
            {overview.options.map((option) => (
              <li key={option.id}>{option.content}</li>
            ))}
          </ul>
        </div>

        <div className="overview-section">
          <h3 className="overview-label">참가 인원</h3>
          <p className="overview-value">{overview.participant_count}명</p>
        </div>

        <div className="overview-section">
          <h3 className="overview-label">관리자</h3>
          <p className="overview-value">{overview.admin.email}</p>
        </div>

        <div className="overview-section">
          <h3 className="overview-label">현재 상태</h3>
          <p className="overview-value">{getStatusText(overview.event.event_status)}</p>
        </div>

        <div className="overview-section">
          <h3 className="overview-label">가입 상태</h3>
          <p className={`membership-message ${membershipMessage.disabled ? 'disabled' : ''}`}>
            {membershipMessage.text}
          </p>
        </div>

        <div className="overview-actions">
          <Button
            onClick={onEnter}
            disabled={membershipMessage.disabled || !overview.can_enter}
          >
            입장하기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EventOverview;
