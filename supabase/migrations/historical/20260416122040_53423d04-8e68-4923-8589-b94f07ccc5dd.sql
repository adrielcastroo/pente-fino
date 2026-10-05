
-- Ensure profiles table exists with correct columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  opt_out_reports BOOLEAN DEFAULT false,
  display_mode TEXT DEFAULT 'light',
  ai_customization_rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Restrict DELETE on registros
DROP POLICY IF EXISTS "Public delete registros" ON public.registros;
CREATE POLICY "Authenticated users can delete registros" ON public.registros FOR DELETE USING (auth.role() = 'authenticated');

-- Restrict DELETE on conferences
DROP POLICY IF EXISTS "Public delete conferences" ON public.conferences;
CREATE POLICY "Authenticated users can delete conferences" ON public.conferences FOR DELETE USING (auth.role() = 'authenticated');

-- Restrict DELETE on estoque_posicoes
DROP POLICY IF EXISTS "Public delete estoque" ON public.estoque_posicoes;
CREATE POLICY "Authenticated users can delete estoque" ON public.estoque_posicoes FOR DELETE USING (auth.role() = 'authenticated');

-- Restrict DELETE on estoque_saidas
DROP POLICY IF EXISTS "Allow all access to estoque_saidas" ON public.estoque_saidas;
CREATE POLICY "Public select estoque_saidas" ON public.estoque_saidas FOR SELECT USING (true);
CREATE POLICY "Public insert estoque_saidas" ON public.estoque_saidas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update estoque_saidas" ON public.estoque_saidas FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete estoque_saidas" ON public.estoque_saidas FOR DELETE USING (auth.role() = 'authenticated');

-- Restrict DELETE on inventory
DROP POLICY IF EXISTS "Anyone can update inventory" ON public.inventory;
CREATE POLICY "Anyone can select inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Anyone can insert inventory" ON public.inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update inventory" ON public.inventory FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete inventory" ON public.inventory FOR DELETE USING (auth.role() = 'authenticated');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
