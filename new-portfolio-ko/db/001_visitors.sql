-- Anonymous visitor profiles. The number is global and never exposed in the UI.
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 30),
  session_hash CHAR(64) NOT NULL UNIQUE,
  first_explored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visitor_section_visits (
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL CHECK (char_length(section_id) BETWEEN 1 AND 60),
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, section_id)
);

CREATE TABLE IF NOT EXISTS visitor_achievements (
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL CHECK (char_length(achievement_id) BETWEEN 1 AND 60),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (visitor_id, achievement_id)
);
