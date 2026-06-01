import { get, post, del } from './api';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  instructor_avatar_url: string | null;
  event_date: string;
  duration_minutes: number;
  timezone: string;
  thumbnail_url: string | null;
  stream_url: string | null;
  youtube_video_id: string | null;
  viewer_count: number;
  category: string;
  is_live: boolean;
  is_premium: boolean;
  max_participants: number | null;
  registration_count: number;
  status: string;
  has_reminder?: boolean;
}

export const eventsService = {
  async getLiveEvents(): Promise<Event[]> {
    const data = await get<Event[]>('/events/live');
    return data || [];
  },

  async getUpcomingEvents(): Promise<Event[]> {
    const data = await get<Event[]>('/events/upcoming');
    return data || [];
  },

  async getPastEvents(): Promise<Event[]> {
    const data = await get<Event[]>('/events/past');
    return data || [];
  },

  async getEvent(eventId: string): Promise<Event> {
    return get<Event>(`/events/${eventId}`);
  },

  async setReminder(eventId: string): Promise<{ message: string }> {
    return post<{ message: string }>(`/events/${eventId}/reminder`);
  },

  async deleteReminder(eventId: string): Promise<{ message: string }> {
    return del<{ message: string }>(`/events/${eventId}/reminder`);
  },

  async getViewerCount(eventId: string): Promise<number> {
    const data = await get<{ viewer_count: number }>(`/events/${eventId}/viewers`);
    return data?.viewer_count || 0;
  }
};
