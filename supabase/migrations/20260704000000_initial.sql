-- Supabase Schema for Poker Trainer
-- Run this in your Supabase SQL editor

-- 1. Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Spots
CREATE TABLE public.spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format TEXT NOT NULL CHECK (format IN ('cash', 'tournament')),
  stack_size INTEGER NOT NULL CHECK (stack_size IN (20, 40, 60, 100, 200)),
  hero_position TEXT NOT NULL CHECK (hero_position IN ('UTG', 'MP', 'CO', 'BTN', 'SB', 'BB')),
  villain_position TEXT CHECK (villain_position IN ('UTG', 'MP', 'CO', 'BTN', 'SB', 'BB')),
  action_state JSONB NOT NULL,
  hero_hand JSONB NOT NULL,
  difficulty REAL DEFAULT 0.5,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read spots"
  ON public.spots FOR SELECT
  USING (true);

-- 3. Attempts
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  user_action TEXT NOT NULL,
  correct_action TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  decision_time_ms INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts"
  ON public.attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_attempts_user_id ON public.attempts(user_id);
CREATE INDEX idx_attempts_spot_id ON public.attempts(spot_id);
CREATE INDEX idx_attempts_timestamp ON public.attempts(timestamp DESC);

-- 4. Mistakes
CREATE TABLE public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL CHECK (error_type IN ('wrong-action', 'wrong-size', 'timed-out')),
  priority_score REAL NOT NULL DEFAULT 0.5,
  frequency INTEGER NOT NULL DEFAULT 1,
  last_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mistakes"
  ON public.mistakes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mistakes"
  ON public.mistakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mistakes"
  ON public.mistakes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_mistakes_user_id ON public.mistakes(user_id);
CREATE INDEX idx_mistakes_next_review ON public.mistakes(next_review_at);
CREATE INDEX idx_mistakes_priority ON public.mistakes(priority_score DESC);

-- 5. Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  accuracy REAL,
  avg_time_ms INTEGER,
  total_decisions INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed'))
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);

-- 6. Session_Attempts (join table)
CREATE TABLE public.session_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL
);

ALTER TABLE public.session_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session_attempts"
  ON public.session_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE INDEX idx_session_attempts_session ON public.session_attempts(session_id);

-- 7. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
