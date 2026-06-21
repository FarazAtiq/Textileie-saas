-- ============================================================
-- TextileIE — Supabase Schema
-- Run this entire file in: Supabase → SQL Editor → New query
-- ============================================================

-- ── Profiles (extends Supabase auth.users) ──────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  plan        TEXT NOT NULL DEFAULT 'free',  -- free | pro | enterprise
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Reports ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,        -- efficiency | capacity | smv | fabric | thread | costing
  title       TEXT NOT NULL,
  inputs      JSONB NOT NULL DEFAULT '{}',
  results     JSONB NOT NULL DEFAULT '{}',
  notes       TEXT DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  is_starred  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SMV Templates ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.smv_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  garment_type TEXT DEFAULT '',
  operations   JSONB NOT NULL DEFAULT '[]',
  total_smv    NUMERIC(10,3) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Usage tracking (for plan limits) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,   -- report_created | pdf_exported | template_saved
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (each user sees only their own data)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smv_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_log     ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Reports
CREATE POLICY "Users can view own reports"   ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);

-- SMV Templates
CREATE POLICY "Users can view own templates"   ON public.smv_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.smv_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.smv_templates FOR DELETE USING (auth.uid() = user_id);

-- Usage log
CREATE POLICY "Users can view own usage"   ON public.usage_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.usage_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_reports_user_id    ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type       ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smv_user_id        ON public.smv_templates(user_id);

-- ══════════════════════════════════════════════════════════════
-- HELPER VIEWS
-- ══════════════════════════════════════════════════════════════

-- Dashboard stats per user
CREATE OR REPLACE VIEW public.user_report_stats AS
SELECT
  user_id,
  COUNT(*)                                        AS total_reports,
  COUNT(*) FILTER (WHERE type = 'efficiency')    AS efficiency_count,
  COUNT(*) FILTER (WHERE type = 'capacity')      AS capacity_count,
  COUNT(*) FILTER (WHERE type = 'smv')           AS smv_count,
  COUNT(*) FILTER (WHERE type = 'fabric')        AS fabric_count,
  COUNT(*) FILTER (WHERE type = 'thread')        AS thread_count,
  COUNT(*) FILTER (WHERE type = 'costing')       AS costing_count,
  MAX(created_at)                                AS last_report_at
FROM public.reports
GROUP BY user_id;

-- RLS on the view
ALTER VIEW public.user_report_stats SET (security_invoker = true);
