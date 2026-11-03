-- Public community features. Each visitor can publish one feedback post.
CREATE TABLE IF NOT EXISTS visitor_feedback (
  visitor_id UUID PRIMARY KEY REFERENCES visitors(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1600),
  edit_count SMALLINT NOT NULL DEFAULT 0 CHECK (edit_count BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only the 20 most recently inserted lobby messages are retained.
-- The application deletes older rows within an advisory-locked transaction.
CREATE TABLE IF NOT EXISTS lobby_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lobby_messages_by_visitor
  ON lobby_messages (visitor_id, id DESC);
