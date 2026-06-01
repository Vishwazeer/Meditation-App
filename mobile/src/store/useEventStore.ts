import { create } from 'zustand';
import { Event, eventsService } from '../services/events.service';

interface EventState {
  liveEvents: Event[];
  upcomingEvents: Event[];
  pastEvents: Event[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  toggleReminder: (eventId: string, currentStatus: boolean) => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  liveEvents: [],
  upcomingEvents: [],
  pastEvents: [],
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const [live, upcoming, past] = await Promise.all([
        eventsService.getLiveEvents(),
        eventsService.getUpcomingEvents(),
        eventsService.getPastEvents(),
      ]);
      set({ liveEvents: live, upcomingEvents: upcoming, pastEvents: past, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch events', isLoading: false });
    }
  },

  toggleReminder: async (eventId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await eventsService.deleteReminder(eventId);
      } else {
        await eventsService.setReminder(eventId);
      }
      
      // Update local state for optimism
      const { upcomingEvents } = get();
      set({
        upcomingEvents: upcomingEvents.map(event =>
          event.id === eventId ? { ...event, has_reminder: !currentStatus } : event
        )
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to toggle reminder' });
    }
  }
}));
