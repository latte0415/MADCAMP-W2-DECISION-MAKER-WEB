import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { eventsApi, type Event } from '../api/events';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import EventOverview from '../components/EventOverview';
import EventCreation from '../components/EventCreation';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [entryCode, setEntryCode] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getParticipatedEvents();
      setEvents(data);
    } catch (error) {
      console.error('이벤트 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEntry = async () => {
    if (entryCode.length !== 6) return;

    try {
      await eventsApi.enterEvent(entryCode.toUpperCase());
      setShowEntryModal(false);
      setEntryCode('');
      await loadEvents();
    } catch (error: any) {
      alert(error.message || '입장에 실패했습니다.');
    }
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowOverviewModal(true);
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

  const getMembershipStatusText = (status: string | null, isAdmin: boolean) => {
    if (isAdmin) return '관리자';
    if (status === 'PENDING') return '승인 대기 중';
    if (status === 'REJECTED') return '거절됨';
    if (status === 'ACCEPTED') return '승인됨';
    return '';
  };

  return (
    <div className="home-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">의사결정 플랫폼</h1>
          <div className="header-actions">
            <span className="user-name">{user?.name || user?.email}</span>
            <Button variant="ghost" onClick={logout}>
              로그아웃
            </Button>
          </div>
        </div>

        <div className="home-actions">
          <Button onClick={() => setShowEntryModal(true)}>참여하기</Button>
          <Button onClick={() => setShowCreationModal(true)}>생성하기</Button>
        </div>

        <div className="events-section">
          <h2 className="section-title">이벤트 목록</h2>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-16)' }}>
              <LoadingSpinner size="lg" />
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">참가한 이벤트가 없습니다.</div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <Card
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  className="event-card"
                >
                  <div className="event-header">
                    <h3 className="event-title">{event.decision_subject}</h3>
                    <span className={`event-status status-${event.event_status.toLowerCase()}`}>
                      {getStatusText(event.event_status)}
                    </span>
                  </div>
                  <div className="event-info">
                    <div className="info-item">
                      <span className="info-label">관리자:</span>
                      <span>{event.admin_name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">참가 인원:</span>
                      <span>{event.participant_count}명</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">상태:</span>
                      <span>{getMembershipStatusText(event.membership_status, event.is_admin)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">입장 코드:</span>
                      <span>{event.entrance_code}</span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="event-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event.id);
                    }}
                  >
                    진행하기
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setEntryCode('');
        }}
        title="코드로 입장"
        size="sm"
      >
        <div className="entry-modal-content">
          <Input
            label="입장 코드"
            value={entryCode}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().slice(0, 6);
              setEntryCode(value);
            }}
            placeholder="6자리 코드 입력"
            maxLength={6}
          />
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEntryModal(false);
                setEntryCode('');
              }}
            >
              닫기
            </Button>
            <Button
              onClick={handleEntry}
              disabled={entryCode.length !== 6}
            >
              접속
            </Button>
          </div>
        </div>
      </Modal>

      {selectedEventId && (
        <EventOverview
          eventId={selectedEventId}
          isOpen={showOverviewModal}
          onClose={() => {
            setShowOverviewModal(false);
            setSelectedEventId(null);
          }}
          onEnter={() => {
            navigate(`/events/${selectedEventId}`);
          }}
        />
      )}

      <EventCreation
        isOpen={showCreationModal}
        onClose={() => {
          setShowCreationModal(false);
        }}
        onSuccess={() => {
          setShowCreationModal(false);
          loadEvents();
        }}
      />
    </div>
  );
};

export default Home;
