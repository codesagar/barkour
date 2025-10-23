-- Barkour Database Schema
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/rnzxoxmhtiectqgytnlq/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scores table
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    character_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_score_desc ON public.scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_difficulty ON public.scores(difficulty);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON public.scores(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Scores RLS Policies
CREATE POLICY "Scores are viewable by everyone"
    ON public.scores FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert their own scores"
    ON public.scores FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
    ON public.scores FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scores"
    ON public.scores FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(difficulty_filter TEXT DEFAULT NULL, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    username TEXT,
    score INTEGER,
    difficulty TEXT,
    character_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.username,
        s.score,
        s.difficulty,
        s.character_name,
        s.created_at
    FROM public.scores s
    WHERE difficulty_filter IS NULL OR s.difficulty = difficulty_filter
    ORDER BY s.score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's personal best
CREATE OR REPLACE FUNCTION get_personal_best(user_uuid UUID, difficulty_filter TEXT DEFAULT NULL)
RETURNS TABLE (
    score INTEGER,
    difficulty TEXT,
    character_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.score,
        s.difficulty,
        s.character_name,
        s.created_at
    FROM public.scores s
    WHERE s.user_id = user_uuid
        AND (difficulty_filter IS NULL OR s.difficulty = difficulty_filter)
    ORDER BY s.score DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
