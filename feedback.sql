-- Create the feedback table
CREATE TABLE feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Add constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(message)) > 0)
);

-- Create indexes for better query performance
CREATE INDEX feedback_created_at_idx ON feedback(created_at DESC);
CREATE INDEX feedback_email_idx ON feedback(email);

-- Set up Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to read feedback
CREATE POLICY "Allow anonymous read access"
ON feedback FOR SELECT
TO anon
USING (true);

-- Allow authenticated users to insert their own feedback
CREATE POLICY "Allow anonymous insert access"
ON feedback FOR INSERT
TO anon
WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE feedback IS 'Stores user feedback submissions';

-- Grant access to authenticated and anonymous users
GRANT SELECT, INSERT ON feedback TO anon, authenticated; 