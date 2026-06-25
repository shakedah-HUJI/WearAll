-- Enable Row Level Security on all tables
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;

-- Profiles: each user can only read/write their own row
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Items: owner-only CRUD
CREATE POLICY "items_select" ON items FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "items_insert" ON items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "items_update" ON items FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "items_delete" ON items FOR DELETE USING (user_id = auth.uid());

-- Threads: owner-only CRUD
CREATE POLICY "threads_select" ON threads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "threads_insert" ON threads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "threads_update" ON threads FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "threads_delete" ON threads FOR DELETE USING (user_id = auth.uid());

-- Messages: owner-only CRUD
CREATE POLICY "messages_select" ON messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages_delete" ON messages FOR DELETE USING (user_id = auth.uid());
