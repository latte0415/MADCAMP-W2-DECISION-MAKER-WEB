import { apiClient, generateIdempotencyKey } from '../utils/api';

export interface Event {
  id: string;
  decision_subject: string;
  event_status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
  admin_id: string;
  admin_name: string;
  entrance_code: string;
  participant_count: number;
  is_admin: boolean;
  membership_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
}

export interface EventOverview {
  event: {
    id: string;
    decision_subject: string;
    event_status: string;
    entrance_code: string;
  };
  options: Array<{ id: string; content: string }>;
  admin: {
    id: string;
    email: string;
  };
  participant_count: number;
  membership_status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  can_enter: boolean;
}

export interface EventDetail {
  id: string;
  decision_subject: string;
  event_status: string;
  is_admin: boolean;
  options: Array<{ id: string; content: string }>;
  assumptions: Array<any>;
  criteria: Array<any>;
  assumption_creation_proposals: Array<any>;
  criteria_creation_proposals: Array<any>;
  current_participants_count: number;
  voted_participants_count: number;
}

export const eventsApi = {
  getParticipatedEvents: () => apiClient.get<Event[]>('/v1/events/participated'),

  getEventOverview: (eventId: string) =>
    apiClient.get<EventOverview>(`/v1/events/${eventId}/overview`),

  getEventDetail: (eventId: string) =>
    apiClient.get<EventDetail>(`/v1/events/${eventId}`),

  enterEvent: (entranceCode: string) =>
    apiClient.post('/v1/events/entry', { entrance_code: entranceCode }),

  createEvent: (data: any) =>
    apiClient.post('/v1/events', data, generateIdempotencyKey()),

  checkEntranceCode: (code: string) =>
    apiClient.post('/v1/events/entrance-code/check', { entrance_code: code }),

  generateEntranceCode: () =>
    apiClient.get<{ code: string }>('/v1/events/entrance-code/generate'),
};
