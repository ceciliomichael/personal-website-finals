-- Create the users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    udid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL,
    
    -- Add constraints
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create the user_achievements table
CREATE TABLE user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_udid TEXT NOT NULL,  -- Changed from UUID to TEXT to match the format from the client
    achievement_id VARCHAR(255) NOT NULL,
    
    -- Add constraints
    CONSTRAINT unique_user_achievement UNIQUE (user_udid, achievement_id)
);

-- Create indexes for better query performance
CREATE INDEX users_udid_idx ON users(udid);
CREATE INDEX user_achievements_user_udid_idx ON user_achievements(user_udid);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for users
-- Allow anyone to read users
CREATE POLICY "Allow anonymous read access to users"
ON users FOR SELECT
TO anon
USING (true);

-- Allow anyone to insert users
CREATE POLICY "Allow anonymous insert access to users"
ON users FOR INSERT
TO anon
WITH CHECK (true);

-- Create policies for user_achievements
-- Allow anyone to read user achievements
CREATE POLICY "Allow anonymous read access to user achievements"
ON user_achievements FOR SELECT
TO anon
USING (true);

-- Allow anyone to insert user achievements
CREATE POLICY "Allow anonymous insert access to user achievements"
ON user_achievements FOR INSERT
TO anon
WITH CHECK (true);

-- Add comments to tables
COMMENT ON TABLE users IS 'Stores user information';
COMMENT ON TABLE user_achievements IS 'Stores user achievements';

-- Grant access to authenticated and anonymous users
GRANT SELECT, INSERT ON users TO anon, authenticated;
GRANT SELECT, INSERT ON user_achievements TO anon, authenticated; 