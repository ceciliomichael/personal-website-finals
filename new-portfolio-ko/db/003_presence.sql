-- Recent visitor activity powers the public "Online" count.
-- A visitor is counted once across multiple browser tabs.
CREATE TABLE IF NOT EXISTS visitor_presence (
  visitor_id UUID PRIMARY KEY REFERENCES visitors(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_presence_last_seen
  ON visitor_presence (last_seen);
