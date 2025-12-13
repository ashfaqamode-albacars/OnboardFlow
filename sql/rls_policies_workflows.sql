-- sql/rls_policies_workflows.sql
-- RLS policies for workflows

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT
CREATE POLICY "auth_select_workflows" ON public.workflows FOR SELECT TO authenticated USING (true);

-- Allow admins (JWT claim role='admin') full access
CREATE POLICY "admins_manage_workflows" ON public.workflows FOR ALL TO authenticated
  USING ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin')
  WITH CHECK ((current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin');

-- Optional: allow owners to manage their own workflows (if owner_id column exists)
CREATE POLICY "owner_manage_own_workflow" ON public.workflows FOR ALL TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));
