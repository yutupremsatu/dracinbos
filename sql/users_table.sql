-- Users table for Supabase
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'email',
    last_login TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Service role can do anything
CREATE POLICY "Service role full access" ON users
    USING (auth.role() = 'service_role');

-- Allow inserts from authenticated users (for sync)
CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);
