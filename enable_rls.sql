-- Enable Row Level Security (RLS)
ALTER TABLE public.dramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow Public Read Access (Select) for everyone
CREATE POLICY "Enable read access for all users" ON "public"."dramas"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."episodes"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Create policy to allow Insert/Update only for Service Role (Backend)
-- By default, enabling RLS denies all writes unless explicitly allowed.
-- Since our backend uses the SERVICE_KEY (Anon key usually can't write if RLS is on unless policy allows),
-- we should check if Supabase Client is using Service Role or Anon.
-- If using Anon Key for backend writes (which we are currently doing with fallback),
-- we might need to allow Anon writes TEMPORARILY or switch to Service Key.

-- FOR NOW: Allow all inserts/updates for simplicity as this is a personal project.
-- Secure approach: Only allow authenticated users or specific roles.
CREATE POLICY "Enable insert for everyone" ON "public"."dramas"
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable update for everyone" ON "public"."dramas"
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Enable insert for everyone" ON "public"."episodes"
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable update for everyone" ON "public"."episodes"
FOR UPDATE
TO public
USING (true);
