-- Supabase / Postgres schema generated from OnboardFlow Schemas + exported CSV headers

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'course_category_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.course_category_enum AS ENUM ('compliance', 'technical', 'soft_skills', 'onboarding', 'safety', 'other');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'course_assignment_status_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.course_assignment_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'document_status_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.document_status_enum AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'employee_onboarding_status_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.employee_onboarding_status_enum AS ENUM ('not_started', 'in_progress', 'completed');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'equipment_category_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.equipment_category_enum AS ENUM ('laptop', 'mobile', 'accessories', 'furniture', 'software', 'other');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'equipment_request_status_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.equipment_request_status_enum AS ENUM ('pending', 'approved', 'rejected', 'delivered');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'form_template_form_type_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.form_template_form_type_enum AS ENUM ('new_employee', 'personal_info', 'emergency_contact', 'bank_details', 'custom');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'module_progress_module_type_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.module_progress_module_type_enum AS ENUM ('video', 'reading', 'quiz');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'task_type_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.task_type_enum AS ENUM ('form', 'document_upload', 'equipment_request', 'review', 'acknowledgement', 'approval', 'custom');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'task_status_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.task_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'task_assigned_role_enum' AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.task_assigned_role_enum AS ENUM ('employee', 'hr');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public."document_template" (
"id" text NOT NULL,
"name" text NOT NULL,
"description" text,
"template_file_url" text,
"placeholders" jsonb,
"is_active" boolean,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT document_template_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."document_type" (
"id" text NOT NULL,
"name" text NOT NULL,
"description" text,
"is_required" boolean,
"is_active" boolean,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT document_type_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."equipment" (
"id" text NOT NULL,
"name" text NOT NULL,
"description" text,
"category" public.equipment_category_enum NOT NULL,
"is_available" boolean,
"image_url" text,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT equipment_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."form_template" (
"id" text NOT NULL,
"name" text NOT NULL,
"description" text,
"form_type" public.form_template_form_type_enum NOT NULL,
"fields" jsonb,
"is_active" boolean,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT form_template_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."workflow" (
"id" text NOT NULL,
"name" text NOT NULL,
"description" text,
"is_active" boolean,
"is_default" boolean,
"tasks" jsonb,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT workflow_pkey PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."course" (
"id" text NOT NULL,
"title" text NOT NULL,
"description" text,
"category" public.course_category_enum,
"duration_minutes" numeric,
"is_active" boolean,
"available_to_all" boolean,
"certificate_enabled" boolean,
"certificate_template_id" text,
"certificate_file_url" text,
"modules" jsonb,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT course_pkey PRIMARY KEY ("id"),
  CONSTRAINT course_certificate_template_id_fkey FOREIGN KEY ("certificate_template_id") REFERENCES public."document_template"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."employee" (
"id" text NOT NULL,
"full_name" text NOT NULL,
"email" text NOT NULL,
"phone" text,
"position" text,
"department" text,
"start_date" date,
"assigned_hr" text NOT NULL,
"onboarding_status" public.employee_onboarding_status_enum,
"onboarding_progress" numeric,
"personal_info" jsonb,
"user_email" text,
"workflow_id" text,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT employee_pkey PRIMARY KEY ("id"),
  CONSTRAINT employee_workflow_id_fkey FOREIGN KEY ("workflow_id") REFERENCES public."workflow"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."document" (
"id" text NOT NULL,
"employee_id" text NOT NULL,
"document_type_id" text,
"document_type_name" text NOT NULL,
"file_url" text,
"status" public.document_status_enum,
"submitted_date" timestamptz,
"reviewed_by" text,
"reviewed_date" timestamptz,
"rejection_reason" text,
"notes" text,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT document_pkey PRIMARY KEY ("id"),
  CONSTRAINT document_employee_id_fkey FOREIGN KEY ("employee_id") REFERENCES public."employee"("id") ON DELETE SET NULL,
  CONSTRAINT document_document_type_id_fkey FOREIGN KEY ("document_type_id") REFERENCES public."document_type"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."task" (
"id" text NOT NULL,
"employee_id" text NOT NULL,
"workflow_task_id" text,
"title" text NOT NULL,
"description" text,
"type" public.task_type_enum NOT NULL,
"status" public.task_status_enum,
"due_date" date,
"completed_date" timestamptz,
"assigned_to" text,
"assigned_role" public.task_assigned_role_enum,
"form_id" text,
"document_type_id" text,
"related_id" text,
"form_data" jsonb,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT task_pkey PRIMARY KEY ("id"),
  CONSTRAINT task_employee_id_fkey FOREIGN KEY ("employee_id") REFERENCES public."employee"("id") ON DELETE SET NULL,
  CONSTRAINT task_form_id_fkey FOREIGN KEY ("form_id") REFERENCES public."form_template"("id") ON DELETE SET NULL,
  CONSTRAINT task_document_type_id_fkey FOREIGN KEY ("document_type_id") REFERENCES public."document_type"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."course_assignment" (
"id" text NOT NULL,
"employee_id" text NOT NULL,
"course_id" text NOT NULL,
"course_title" text,
"assigned_by" text,
"assigned_date" timestamptz,
"due_date" date,
"status" public.course_assignment_status_enum,
"progress_percentage" numeric,
"completed_date" timestamptz,
"certificate_url" text,
"current_module_id" text,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT course_assignment_pkey PRIMARY KEY ("id"),
  CONSTRAINT course_assignment_employee_id_fkey FOREIGN KEY ("employee_id") REFERENCES public."employee"("id") ON DELETE SET NULL,
  CONSTRAINT course_assignment_course_id_fkey FOREIGN KEY ("course_id") REFERENCES public."course"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."equipment_request" (
"id" text NOT NULL,
"employee_id" text NOT NULL,
"equipment_id" text,
"equipment_name" text,
"quantity" bigint,
"status" public.equipment_request_status_enum,
"notes" text,
"reviewed_by" text,
"reviewed_date" timestamptz,
"rejection_reason" text,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT equipment_request_pkey PRIMARY KEY ("id"),
  CONSTRAINT equipment_request_employee_id_fkey FOREIGN KEY ("employee_id") REFERENCES public."employee"("id") ON DELETE SET NULL,
  CONSTRAINT equipment_request_equipment_id_fkey FOREIGN KEY ("equipment_id") REFERENCES public."equipment"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."module_progress" (
"id" text NOT NULL,
"employee_id" text NOT NULL,
"course_id" text NOT NULL,
"assignment_id" text,
"module_id" text NOT NULL,
"module_type" public.module_progress_module_type_enum,
"completed" boolean,
"progress_percentage" numeric,
"time_spent_seconds" numeric,
"quiz_score" numeric,
"quiz_passed" boolean,
"quiz_attempts" numeric,
"completed_date" timestamptz,
"created_date" timestamptz,
"updated_date" timestamptz,
"created_by_id" text,
"created_by" text,
"is_sample" boolean DEFAULT false,
  CONSTRAINT module_progress_pkey PRIMARY KEY ("id"),
  CONSTRAINT module_progress_employee_id_fkey FOREIGN KEY ("employee_id") REFERENCES public."employee"("id") ON DELETE SET NULL,
  CONSTRAINT module_progress_course_id_fkey FOREIGN KEY ("course_id") REFERENCES public."course"("id") ON DELETE SET NULL,
  CONSTRAINT module_progress_assignment_id_fkey FOREIGN KEY ("assignment_id") REFERENCES public."course_assignment"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."equipment_request_item" (
"id" text NOT NULL,
"request_id" text NOT NULL,
"equipment_id" text,
"equipment_name" text NOT NULL,
"equipment_category" text,
"quantity" numeric,
"notes" text,
"created_date" text,
"updated_date" text,
"created_by_id" text,
"created_by" text,
"is_sample" text DEFAULT false,
  CONSTRAINT equipment_request_item_pkey PRIMARY KEY ("id"),
  CONSTRAINT equipment_request_item_request_id_fkey FOREIGN KEY ("request_id") REFERENCES public."equipment_request"("id") ON DELETE SET NULL,
  CONSTRAINT equipment_request_item_equipment_id_fkey FOREIGN KEY ("equipment_id") REFERENCES public."equipment"("id") ON DELETE SET NULL
);


CREATE INDEX IF NOT EXISTS idx_course_certificate_template_id ON public."course"("certificate_template_id");
CREATE INDEX IF NOT EXISTS idx_course_assignment_employee_id ON public."course_assignment"("employee_id");
CREATE INDEX IF NOT EXISTS idx_course_assignment_course_id ON public."course_assignment"("course_id");
CREATE INDEX IF NOT EXISTS idx_document_employee_id ON public."document"("employee_id");
CREATE INDEX IF NOT EXISTS idx_document_document_type_id ON public."document"("document_type_id");
CREATE INDEX IF NOT EXISTS idx_employee_workflow_id ON public."employee"("workflow_id");
CREATE INDEX IF NOT EXISTS idx_equipment_request_employee_id ON public."equipment_request"("employee_id");
CREATE INDEX IF NOT EXISTS idx_equipment_request_equipment_id ON public."equipment_request"("equipment_id");
CREATE INDEX IF NOT EXISTS idx_equipment_request_item_request_id ON public."equipment_request_item"("request_id");
CREATE INDEX IF NOT EXISTS idx_equipment_request_item_equipment_id ON public."equipment_request_item"("equipment_id");
CREATE INDEX IF NOT EXISTS idx_module_progress_employee_id ON public."module_progress"("employee_id");
CREATE INDEX IF NOT EXISTS idx_module_progress_course_id ON public."module_progress"("course_id");
CREATE INDEX IF NOT EXISTS idx_module_progress_assignment_id ON public."module_progress"("assignment_id");
CREATE INDEX IF NOT EXISTS idx_task_employee_id ON public."task"("employee_id");
CREATE INDEX IF NOT EXISTS idx_task_form_id ON public."task"("form_id");
CREATE INDEX IF NOT EXISTS idx_task_document_type_id ON public."task"("document_type_id");

COMMIT;
