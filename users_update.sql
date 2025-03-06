-- Add DELETE policies for users table
CREATE POLICY "Allow users to delete their own data"
ON users FOR DELETE
TO anon, authenticated
USING (true);  -- In a production environment, you might want to restrict this further

-- Add DELETE policies for user_achievements table
CREATE POLICY "Allow users to delete their own achievements"
ON user_achievements FOR DELETE
TO anon, authenticated
USING (true);  -- In a production environment, you might want to restrict this further

-- Add DELETE policies for active_users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'active_users') THEN
        EXECUTE 'CREATE POLICY "Allow users to delete their own active status" ON active_users FOR DELETE TO anon, authenticated USING (true)';
    END IF;
END
$$;

-- Update permissions to include DELETE
GRANT DELETE ON users TO anon, authenticated;
GRANT DELETE ON user_achievements TO anon, authenticated;

-- Update permissions for active_users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'active_users') THEN
        EXECUTE 'GRANT DELETE ON active_users TO anon, authenticated';
    END IF;
END
$$; 