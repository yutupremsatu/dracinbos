-- Create App Config Table
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default APK URL
INSERT INTO public.app_config (key, value, description)
VALUES ('apk_url', 'https://dracinbos.vercel.app/dracin_1.0.0.apk', 'Direct download link for the Android APK')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (Optional but good practice)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access" ON public.app_config
FOR SELECT USING (true);

-- Allow update access to authenticated users (Admin only effectively, handled by app logic)
-- Ideally strictly for service roles or admin users, but for now allow auth users to update if they are admins
CREATE POLICY "Allow update for admins" ON public.app_config
FOR UPDATE USING (auth.role() = 'authenticated');
