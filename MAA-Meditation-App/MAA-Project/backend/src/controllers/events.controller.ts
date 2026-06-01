/**
 * File: events.controller.ts
 *
 * Description: Manages event endpoints: live events, upcoming events, reminders, and views.
 */

import { Request, Response } from 'express';
import { supabase } from '../services/supabase.service';
import { success, error } from '../utils/apiResponse';

export const getLiveEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: events, error: queryError } = await supabase
      .from('events')
      .select('*')
      .eq('is_live', true)
      .neq('status', 'cancelled')
      .order('viewer_count', { ascending: false });

    if (queryError) {
      res.status(500).json(error('QUERY_FAILED', queryError.message, 500));
      return;
    }

    res.status(200).json(success(events ?? []));
  } catch (err) {
    console.error('getLiveEvents error:', err);
    res.status(500).json(error('INTERNAL_SERVER_ERROR', 'Failed to fetch live events', 500));
  }
};

export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date().toISOString();

    const { data: events, error: queryError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'upcoming')
      .gt('event_date', now)
      .order('event_date', { ascending: true });

    if (queryError) {
      res.status(500).json(error('QUERY_FAILED', queryError.message, 500));
      return;
    }

    let remindersMap: Record<string, boolean> = {};
    if (userId && events && events.length > 0) {
      const eventIds = events.map(e => e.id as string);
      const { data: reminders } = await supabase
        .from('event_reminders')
        .select('event_id')
        .eq('user_id', userId)
        .in('event_id', eventIds);

      if (reminders) {
        remindersMap = reminders.reduce<Record<string, boolean>>((acc, r) => {
          acc[r.event_id] = true;
          return acc;
        }, {});
      }
    }

    const upcomingWithReminders = (events ?? []).map((event) => ({
      ...event,
      has_reminder: remindersMap[event.id] ?? false,
    }));

    res.status(200).json(success(upcomingWithReminders));
  } catch (err) {
    console.error('getUpcomingEvents error:', err);
    res.status(500).json(error('INTERNAL_SERVER_ERROR', 'Failed to fetch upcoming events', 500));
  }
};

export const getPastEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date().toISOString();

    const { data: events, error: queryError } = await supabase
      .from('events')
      .select('*')
      // .eq('status', 'upcoming') - Assuming past events could have any status or maybe 'completed', let's just use date
      .lt('event_date', now)
      .order('event_date', { ascending: false });

    if (queryError) {
      res.status(500).json(error('QUERY_FAILED', queryError.message, 500));
      return;
    }

    res.status(200).json(success(events ?? []));
  } catch (err) {
    console.error('getPastEvents error:', err);
    res.status(500).json(error('INTERNAL_SERVER_ERROR', 'Failed to fetch past events', 500));
  }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user?.id;

    const { data: event, error: queryError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (queryError || !event) {
      res.status(404).json(error('NOT_FOUND', 'Event not found', 404));
      return;
    }

    let hasReminder = false;
    if (userId) {
      const { data: reminder } = await supabase
        .from('event_reminders')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
      hasReminder = !!reminder;
    }

    res.status(200).json(success({ ...event, has_reminder: hasReminder }));
  } catch (err) {
    console.error('getEventById error:', err);
    res.status(500).json(error('INTERNAL_SERVER_ERROR', 'Failed to fetch event', 500));
  }
};

export const setReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(error('UNAUTHORIZED', 'Authentication required', 401));
      return;
    }
    const { id: eventId } = req.params;

    const { error: insertError } = await supabase
      .from('event_reminders')
      .insert({ event_id: eventId, user_id: userId });

    if (insertError && insertError.code !== '23505') { // Ignore unique constraint violation
      res.status(500).json(error('REMINDER_FAILED', insertError.message, 500));
      return;
    }

    res.status(201).json(success({ message: 'Reminder set' }));
  } catch (err) {
    console.error('setReminder error:', err);
    res.status(500).json(error('INTERNAL_SERVER_ERROR', 'Failed to set reminder', 500));
  }
};

export const deleteReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(error('UNAUTHORIZED', 'Authentication required', 401));
      return;
    }
    const { id: eventId } = req.params;

    const { error: delError } = await supabase
      .from('event_reminders')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (delError) {
      res.status(500).json(error('DELETE_FAILED', delError.message, 500));
      return;
    }

    res.status(200).json(success({ message: 'Reminder removed' }));
  } catch (err) {
    console.error('deleteReminder error:', err);
    res.status(500).json(error('INTERNAL_SERVER_ERROR', 'Failed to remove reminder', 500));
  }
};

export const getEventViewers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: eventId } = req.params;

    const { data: event, error: queryError } = await supabase
      .from('events')
      .select('viewer_count')
      .eq('id', eventId)
      .single();

    if (queryError || !event) {
      res.status(404).json(error('NOT_FOUND', 'Event not found', 404));
      return;
    }

    res.status(200).json(success({ viewer_count: event.viewer_count }));
  } catch (err) {
    console.error('getEventViewers error:', err);
    res.status(500).json(error('INTERNAL_SERVER_ERROR', 'Failed to get viewers', 500));
  }
};

// Legacy endpoints for backward compatibility
export const listEvents = getUpcomingEvents;
export const registerForEvent = setReminder;
export const getStreamUrl = async (req: Request, res: Response): Promise<void> => {
  const { id: eventId } = req.params;
  const { data: event } = await supabase.from('events').select('stream_url').eq('id', eventId).single();
  res.status(200).json(success({ stream_url: event?.stream_url }));
};
