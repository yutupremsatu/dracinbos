-- Create Dramas Table
CREATE TABLE public.dramas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_id TEXT NOT NULL, -- e.g., 'dramabox-123'
    platform TEXT NOT NULL,    -- 'dramabox', 'reelshort', etc.
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    category TEXT,
    tags TEXT[],
    total_episodes INTEGER,
    rating DECIMAL,
    status TEXT DEFAULT 'ongoing',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(platform_id)
);

-- Create Episodes Table
CREATE TABLE public.episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drama_id UUID REFERENCES public.dramas(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title TEXT,
    video_url TEXT, -- Proxied/Original link
    duration INTEGER, -- in seconds
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(drama_id, episode_number)
);

-- Indices for performance
CREATE INDEX idx_dramas_platform ON public.dramas(platform);
CREATE INDEX idx_dramas_category ON public.dramas(category);
CREATE INDEX idx_episodes_drama_id ON public.episodes(drama_id);
