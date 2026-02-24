ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "reference_id" varchar(255);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "workflow_step" integer DEFAULT 1 NOT NULL;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lead_score" integer DEFAULT 30 NOT NULL;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_contact_at" timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS "leads_ref_idx" ON "leads" ("reference_id");
