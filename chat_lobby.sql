-- Create the chat_messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    udid VARCHAR(255) NOT NULL,
    
    -- Add constraints
    CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message)) > 0),
    CONSTRAINT user_name_not_empty CHECK (LENGTH(TRIM(user_name)) > 0)
);

-- Create the active_users table
CREATE TABLE active_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    udid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT udid_unique UNIQUE (udid)
);

-- Create indexes for better query performance
CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at DESC);
CREATE INDEX active_users_last_active_idx ON active_users(last_active DESC);

-- Set up Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_users ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_messages
-- Allow anyone to read messages
CREATE POLICY "Allow anonymous read access to messages"
ON chat_messages FOR SELECT
TO anon
USING (true);

-- Allow anyone to insert messages
CREATE POLICY "Allow anonymous insert access to messages"
ON chat_messages FOR INSERT
TO anon
WITH CHECK (true);

-- Create policies for active_users
-- Allow anyone to read active users
CREATE POLICY "Allow anonymous read access to active users"
ON active_users FOR SELECT
TO anon
USING (true);

-- Allow anyone to insert/update active users
CREATE POLICY "Allow anonymous insert/update access to active users"
ON active_users FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to active users"
ON active_users FOR UPDATE
TO anon
USING (true);

-- Add comments to tables
COMMENT ON TABLE chat_messages IS 'Stores chat messages for the visitor lobby';
COMMENT ON TABLE active_users IS 'Tracks active users in the visitor lobby';

-- Grant access to authenticated and anonymous users
GRANT SELECT, INSERT ON chat_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON active_users TO anon, authenticated;

-- Create function to clean up old messages (keep only the most recent 20)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
    messages_to_delete INTEGER;
BEGIN
    -- Count total messages
    SELECT COUNT(*) INTO message_count FROM chat_messages;
    
    -- If we have more than 20 messages, delete the oldest ones
    IF message_count > 20 THEN
        messages_to_delete := message_count - 20;
        
        DELETE FROM chat_messages
        WHERE id IN (
            SELECT id FROM chat_messages
            ORDER BY created_at ASC
            LIMIT messages_to_delete
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the cleanup function after each insert
CREATE TRIGGER cleanup_messages_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_messages();

-- Create function to clean up inactive users (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete users who haven't been active in the last 5 minutes
    DELETE FROM active_users
    WHERE last_active < NOW() - INTERVAL '5 minutes';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run the cleanup function after each update
CREATE TRIGGER cleanup_inactive_users_trigger
AFTER UPDATE ON active_users
FOR EACH ROW
EXECUTE FUNCTION cleanup_inactive_users(); 