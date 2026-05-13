-- ============================================================
-- REVULY — SUPABASE SQL SCHEMA
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================


-- ============================================================
-- 1. PROFILES
--    Extends auth.users — one row per registered user
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT        NOT NULL,
  full_name              TEXT,

  -- Restaurant info (set during onboarding)
  restaurant_name        TEXT,
  restaurant_type        TEXT        DEFAULT 'Fine Dining',
  city                   TEXT,
  country                TEXT,

  -- Rating goal
  rating_goal            NUMERIC(2,1) DEFAULT 4.8,
  rating_goal_months     INTEGER      DEFAULT 6,

  -- Plan & usage
  plan                   TEXT        NOT NULL DEFAULT 'free_trial'
                           CHECK (plan IN ('free_trial','starter','growth','pro')),
  used_count             INTEGER     NOT NULL DEFAULT 0,

  -- Google Business connection
  google_connected       BOOLEAN     NOT NULL DEFAULT FALSE,
  google_location_name   TEXT,

  -- Inbound email forwarding (derived: user-[id]@mail.revuly.dev, stored for reference)
  inbound_email          TEXT,

  -- Email notification preferences
  email_notifications    BOOLEAN     NOT NULL DEFAULT TRUE,
  notification_frequency TEXT        NOT NULL DEFAULT 'immediately'
                           CHECK (notification_frequency IN ('immediately','daily','weekly')),
  crisis_alerts          BOOLEAN     NOT NULL DEFAULT TRUE,
  weekly_report          BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Custom keywords (Growth / Pro only) — stored as array
  custom_keywords        TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Admin & account management
  role                   TEXT        NOT NULL DEFAULT 'user'
                           CHECK (role IN ('user','admin')),
  disabled               BOOLEAN     NOT NULL DEFAULT FALSE,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles IS 'One row per auth user. Extended profile data for Revuly.';
COMMENT ON COLUMN public.profiles.plan IS 'free_trial | starter | growth | pro';
COMMENT ON COLUMN public.profiles.used_count IS 'AI replies consumed this billing period (reset monthly via cron)';
COMMENT ON COLUMN public.profiles.custom_keywords IS 'User-defined keywords for Keyword Intelligence (Growth/Pro)';


-- ============================================================
-- 2. REVIEWS
--    Customer reviews — both manually added and Google-synced
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Review content
  reviewer_name    TEXT        NOT NULL DEFAULT 'Anonymous',
  stars            INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
  content          TEXT        NOT NULL DEFAULT '',
  source           TEXT        NOT NULL DEFAULT 'manual'
                     CHECK (source IN ('manual','google')),

  -- AI-derived analysis
  sentiment        TEXT        NOT NULL DEFAULT 'neutral'
                     CHECK (sentiment IN ('positive','neutral','negative')),
  is_crisis        BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Reply tracking
  replied          BOOLEAN     NOT NULL DEFAULT FALSE,
  reply_text       TEXT,

  -- Google sync dedup key
  google_review_id TEXT        UNIQUE,

  -- Dates
  review_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.reviews IS 'Customer reviews — manual or synced from Google Business Profile.';
COMMENT ON COLUMN public.reviews.is_crisis IS 'TRUE when part of a 3+ negative reviews in 24h pattern';
COMMENT ON COLUMN public.reviews.google_review_id IS 'Unique ID from Google My Business API, prevents duplicate syncing';


-- ============================================================
-- 3. REPLY_SUGGESTIONS
--    AI-generated reply suggestions per review
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reply_suggestions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- JSONB structure: { "warm": "...", "professional": "...", "brief": "..." }
  replies     JSONB       NOT NULL DEFAULT '{}',
  lang        TEXT        NOT NULL DEFAULT 'en',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.reply_suggestions IS 'Pre-generated AI replies (from cron sync or on-demand generation).';
COMMENT ON COLUMN public.reply_suggestions.replies IS 'JSONB with keys: warm, professional, brief — each a reply string';


-- ============================================================
-- 4. GOOGLE_CONNECTIONS
--    OAuth tokens for Google Business Profile API access
-- ============================================================
CREATE TABLE IF NOT EXISTS public.google_connections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- OAuth tokens (access_token is refreshed; refresh_token is long-lived)
  access_token   TEXT        NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMPTZ,

  -- Google Business info
  account_id     TEXT,
  location_id    TEXT,
  location_name  TEXT,
  google_email   TEXT,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.google_connections IS 'Stores Google Business OAuth tokens per user.';
COMMENT ON COLUMN public.google_connections.refresh_token IS 'Long-lived token used to renew access_token — store securely';


-- ============================================================
-- INDEXES — query performance
-- ============================================================

-- Reviews — most queries filter or sort by these
CREATE INDEX IF NOT EXISTS idx_reviews_user_id     ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_date        ON public.reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_stars       ON public.reviews(stars);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment   ON public.reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_replied     ON public.reviews(replied) WHERE replied = FALSE;
CREATE INDEX IF NOT EXISTS idx_reviews_crisis      ON public.reviews(is_crisis) WHERE is_crisis = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_source      ON public.reviews(source);

-- Reply suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_review  ON public.reply_suggestions(review_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user    ON public.reply_suggestions(user_id);

-- Profiles — admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan       ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_created    ON public.profiles(created_at DESC);


-- ============================================================
-- TRIGGER: auto-update updated_at timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_google_connections_updated_at
  BEFORE UPDATE ON public.google_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- TRIGGER: auto-create profile row when a new user signs up
--   Works for both email/password and Google OAuth signups.
--   Uses SECURITY DEFINER so it can write to profiles as superuser.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop first in case of re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
--   Users can only read/write their own data.
--   The service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses
--   RLS automatically — used by API routes and admin panel.
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;


-- ── PROFILES ──────────────────────────────────────────────

CREATE POLICY "profiles: user can select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: user can insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: user can update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE policy — deletion is handled server-side via service role


-- ── REVIEWS ───────────────────────────────────────────────

CREATE POLICY "reviews: user can select own"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reviews: user can insert own"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: user can update own"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: user can delete own"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);


-- ── REPLY SUGGESTIONS ─────────────────────────────────────

CREATE POLICY "suggestions: user can select own"
  ON public.reply_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "suggestions: user can insert own"
  ON public.reply_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "suggestions: user can delete own"
  ON public.reply_suggestions FOR DELETE
  USING (auth.uid() = user_id);


-- ── GOOGLE CONNECTIONS ────────────────────────────────────

CREATE POLICY "google: user can select own"
  ON public.google_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "google: user can insert own"
  ON public.google_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "google: user can update own"
  ON public.google_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "google: user can delete own"
  ON public.google_connections FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- OPTIONAL: Reset used_count monthly (run via cron job)
--   Call this from /api/cron/reset-usage with CRON_SECRET
--   Schedule: 1st of every month at 00:00 UTC
-- ============================================================
-- UPDATE public.profiles SET used_count = 0;


-- ============================================================
-- OPTIONAL: Set yourself as admin
--   Replace with your actual email after first sign-up.
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';


-- ============================================================
-- VERIFICATION — run these to confirm everything was created
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
