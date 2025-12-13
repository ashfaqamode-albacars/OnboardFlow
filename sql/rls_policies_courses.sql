-- sql/rls_policies_courses.sql
-- RLS policies for courses

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT
CREATE POLICY "auth_select_courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- Allow admins (JWT claim role='admin') full access
CREATE POLICY "admins_manage_courses" ON public.courses FOR ALL TO authenticated
  USING ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin')
  WITH CHECK ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin');

-- Optional: allow creators to manage their own courses (if created_by column exists)
CREATE POLICY "creator_manage_own_course" ON public.courses FOR ALL TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));
