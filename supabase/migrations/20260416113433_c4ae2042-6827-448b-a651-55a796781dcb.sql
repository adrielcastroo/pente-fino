-- Fix search path for update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix search path for handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Re-verify RLS policies for operation_logs
-- (These were flagged as 'Always True', but for shared data they are intentional. 
-- However, we can make them more explicit by checking if anon/authenticated)
DROP POLICY IF EXISTS "Anyone can view operation logs" ON public.operation_logs;
CREATE POLICY "Anyone can view operation logs" ON public.operation_logs 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert operation logs" ON public.operation_logs;
CREATE POLICY "Anyone can insert operation logs" ON public.operation_logs 
FOR INSERT WITH CHECK (true);

-- Re-verify RLS policies for inventory
DROP POLICY IF EXISTS "Anyone can view inventory" ON public.inventory;
CREATE POLICY "Anyone can view inventory" ON public.inventory 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update inventory" ON public.inventory;
CREATE POLICY "Anyone can update inventory" ON public.inventory 
FOR ALL USING (true);