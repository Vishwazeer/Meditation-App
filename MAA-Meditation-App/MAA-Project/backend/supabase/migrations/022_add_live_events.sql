-- =====================================================
-- Migration 022: Add Live Events tables and columns
-- =====================================================

-- 1. Alter events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS peak_viewers INTEGER DEFAULT 0;

-- 2. Create event_reminders table
CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 3. Create event_views table
CREATE TABLE IF NOT EXISTS event_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Allow anonymous views if applicable, or just keep it null for deleted users
  watch_duration INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update timestamp for event_views
CREATE TRIGGER update_event_views_updated_at
  BEFORE UPDATE ON event_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Create event_analytics table
CREATE TABLE IF NOT EXISTS event_analytics (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  total_unique_viewers INTEGER DEFAULT 0,
  peak_concurrent_viewers INTEGER DEFAULT 0,
  average_watch_duration INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update timestamp for event_analytics
CREATE TRIGGER update_event_analytics_updated_at
  BEFORE UPDATE ON event_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Add RLS Policies
-- Event Reminders
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON event_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON event_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON event_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Event Views
ALTER TABLE event_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own views" ON event_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own views" ON event_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own views" ON event_views
  FOR UPDATE USING (auth.uid() = user_id);

-- Event Analytics (Public Read)
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event analytics" ON event_analytics
  FOR SELECT USING (true);
