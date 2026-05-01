-- SQL Setup for Supabase

-- Tables
CREATE TABLE IF NOT EXISTS flowers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    species TEXT,
    care_tips TEXT,
    image_url TEXT,
    colors TEXT[], -- Array of hex colors
    identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    water_level TEXT DEFAULT 'medium',
    target_water_ml INTEGER DEFAULT 500,
    identification_confidence INTEGER,
    identification_status TEXT DEFAULT 'success' -- 'success', 'uncertain', 'suggestion'
);

CREATE TABLE IF NOT EXISTS watering_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flower_id UUID REFERENCES flowers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_watering TIMESTAMP WITH TIME ZONE,
    water_amount INTEGER DEFAULT 0
);

-- RLS Policies (Basic)
ALTER TABLE flowers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own flowers" ON flowers
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE watering_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage logs for their flowers" ON watering_logs
    FOR ALL USING (
        flower_id IN (SELECT id FROM flowers WHERE user_id = auth.uid())
    );
