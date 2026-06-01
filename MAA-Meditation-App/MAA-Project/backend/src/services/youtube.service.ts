import axios from 'axios';
import { supabase } from './supabase.service';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || '';

/**
 * Polls YouTube Data API for live streams and updates the database.
 */
export const syncLiveEvents = async () => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. Skipping YouTube sync.');
    return;
  }

  try {
    // 1. Fetch currently live videos for the channel
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId: YOUTUBE_CHANNEL_ID,
        eventType: 'live',
        type: 'video',
        key: YOUTUBE_API_KEY,
      },
    });

    const items = response.data.items || [];
    
    for (const item of items) {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails?.high?.url || '';

      // 2. Fetch concurrent viewers
      const videoResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'liveStreamingDetails',
          id: videoId,
          key: YOUTUBE_API_KEY,
        },
      });

      const videoData = videoResponse.data.items?.[0];
      const concurrentViewers = parseInt(videoData?.liveStreamingDetails?.concurrentViewers || '0', 10);

      // 3. Upsert into database
      // Try to find if we already have an event that matches this
      const { data: existingEvents } = await supabase
        .from('events')
        .select('id, peak_viewers')
        .eq('youtube_video_id', videoId);

      const existingEvent = existingEvents?.[0];
      const newPeak = Math.max(existingEvent?.peak_viewers || 0, concurrentViewers);

      if (existingEvent) {
        await supabase
          .from('events')
          .update({
            is_live: true,
            status: 'live',
            viewer_count: concurrentViewers,
            peak_viewers: newPeak,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEvent.id);
      } else {
        // Create new live event on the fly if it wasn't scheduled
        await supabase
          .from('events')
          .insert({
            title,
            instructor_name: 'MAA Organization',
            thumbnail_url: thumbnail,
            youtube_video_id: videoId,
            event_date: new Date().toISOString(),
            is_live: true,
            status: 'live',
            viewer_count: concurrentViewers,
            peak_viewers: concurrentViewers
          });
      }
    }
  } catch (error) {
    console.error('Error syncing live events from YouTube:', error);
  }
};

/**
 * Starts the YouTube sync job to run every 60 seconds.
 */
export const startYoutubeSyncJob = () => {
  console.log('Starting YouTube Sync Job...');
  // Run immediately
  syncLiveEvents();
  // Poll every 60 seconds
  setInterval(syncLiveEvents, 60 * 1000);
};
