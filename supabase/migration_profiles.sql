-- ============================================================
-- REVULY — Profiles Table Migration
-- The profiles table existed from the old system.
-- This adds all missing columns without touching existing data.
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Plan (free_trial | starter | growth | pro)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free_trial'
  CHECK (plan IN ('free_trial','starter','growth','pro'));

-- Usage counter (new name, keep old columns untouched)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reply_count INTEGER NOT NULL DEFAULT 0;

-- Full name
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Location split (old table has single "location" column)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Rating goal
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_rating NUMERIC(2,1) DEFAULT 4.8;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_months INTEGER DEFAULT 6;

-- Notification options missing from old schema
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crisis_alerts BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN NOT NULL DEFAULT FALSE;

-- Custom keywords (Growth/Pro)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Google Business connection
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_connected BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_location_name TEXT;

-- Admin / account management
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT FALSE;

-- updated_at (may already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── Auto-update updated_at trigger ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Auto-create profile on signup trigger ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── RLS policies (add if not already enabled) ─────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── RLS for reviews ───────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
CREATE POLICY "reviews_select_own" ON public.reviews FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- ── RLS for reply_suggestions ─────────────────────────────
ALTER TABLE public.reply_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suggestions_select_own" ON public.reply_suggestions;
CREATE POLICY "suggestions_select_own" ON public.reply_suggestions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "suggestions_insert_own" ON public.reply_suggestions;
CREATE POLICY "suggestions_insert_own" ON public.reply_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── RLS for google_connections ────────────────────────────
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "google_select_own" ON public.google_connections;
CREATE POLICY "google_select_own" ON public.google_connections FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "google_insert_own" ON public.google_connections;
CREATE POLICY "google_insert_own" ON public.google_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "google_update_own" ON public.google_connections;
CREATE POLICY "google_update_own" ON public.google_connections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "google_delete_own" ON public.google_connections;
CREATE POLICY "google_delete_own" ON public.google_connections FOR DELETE USING (auth.uid() = user_id);

-- ── Set yourself as admin ─────────────────────────────────
UPDATE public.profiles SET role = 'admin' WHERE email = 'jack820704@gmail.com';

-- ── Verify ───────────────────────────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
