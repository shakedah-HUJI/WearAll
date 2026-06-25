-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  location      TEXT,  -- city name or "lat,lon" for weather lookup
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Clothing items
CREATE TABLE IF NOT EXISTS items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url        TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('top','bottom','dress','outerwear','shoes','accessory','other')),
  subcategory      TEXT,
  primary_color    TEXT,
  secondary_colors TEXT[],
  pattern          TEXT CHECK (pattern IN ('solid','striped','floral','plaid','print','other')),
  material_guess   TEXT,
  formality        TEXT CHECK (formality IN ('casual','smart-casual','business','formal','sporty')),
  season           TEXT[],
  warmth           TEXT CHECK (warmth IN ('light','medium','warm')),
  notes            TEXT,
  wear_count       INT DEFAULT 0,
  last_worn        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Chat threads
CREATE TABLE IF NOT EXISTS threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Messages within threads (content stored as JSONB for flexibility)
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
