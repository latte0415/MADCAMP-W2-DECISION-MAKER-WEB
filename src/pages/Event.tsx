import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import EventSetting from '../components/EventSetting';
import EventVote from '../components/EventVote';
import AssumptionComponent from '../components/AssumptionComponent';
import CriterionComponent from '../components/CriterionComponent';
import ProposalInput from '../components/ProposalInput';
import type { EventDetail } from '../api/events';
import './Event.css';

const Event: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<EventDetail>(`/v1/events/${eventId}`);
      setEvent(data);
    } catch (error) {
      console.error('이벤트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!eventId) return;
    try {
      await apiClient.patch(`/v1/events/${eventId}/status`, { status });
      await loadEvent();
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="event-page">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-page">
        <div className="container">
          <div className="empty-state">
            <p>이벤트를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-page">
      <div className="container">
        <div className="event-header">
          <div className="header-left">
            <Button variant="ghost" onClick={() => navigate('/home')}>
              ← 나가기
            </Button>
            <h1 className="event-title">{event.decision_subject}</h1>
          </div>
          <div className="header-right">
            {event.is_admin && (
              <>
                <select
                  className="status-select"
                  value={event.event_status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="NOT_STARTED">시작 예정</option>
                  <option value="IN_PROGRESS">진행 중</option>
                  <option value="PAUSED">일시 정지</option>
                  <option value="FINISHED">종료</option>
                </select>
                <Button variant="secondary" onClick={() => setShowSettingModal(true)}>
                  설정
                </Button>
              </>
            )}
            {event.event_status === 'IN_PROGRESS' && (
              <Button onClick={() => setShowVoteModal(true)}>투표하기</Button>
            )}
          </div>
        </div>

        <div className="event-content">
          <section className="event-section">
            <h2 className="section-title">기본 정보</h2>
            <Card>
              <div className="basic-info">
                <div className="info-group">
                  <h3 className="info-label">주제</h3>
                  <p>{event.decision_subject}</p>
                </div>
                <div className="info-group">
                  <h3 className="info-label">선택지</h3>
                  <ul className="options-list">
                    {event.options.map((option) => (
                      <li key={option.id}>{option.content}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          <section className="event-section">
            <h2 className="section-title">전제</h2>
            {event.assumptions.map((assumption) => (
              <AssumptionComponent
                key={assumption.id}
                assumption={assumption}
                isAdmin={event.is_admin}
                onPropose={() => {}}
              />
            ))}
          </section>

          <section className="event-section">
            <h2 className="section-title">기준</h2>
            {event.criteria.map((criterion) => (
              <CriterionComponent
                key={criterion.id}
                criterion={criterion}
                isAdmin={event.is_admin}
                eventId={eventId!}
                onPropose={() => {}}
              />
            ))}
          </section>
        </div>

        <ProposalInput
          eventId={eventId!}
          event={event}
          onSuccess={() => {
            loadEvent();
          }}
        />
      </div>

      {event.is_admin && (
        <EventSetting
          eventId={eventId!}
          isOpen={showSettingModal}
          onClose={() => setShowSettingModal(false)}
          onSuccess={() => {
            setShowSettingModal(false);
            loadEvent();
          }}
        />
      )}

      <EventVote
        eventId={eventId!}
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        onSuccess={() => {
          setShowVoteModal(false);
          loadEvent();
        }}
      />
    </div>
  );
};

export default Event;
