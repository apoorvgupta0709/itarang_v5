CREATE TABLE "lead_reference_counter" (
	"year" integer PRIMARY KEY NOT NULL,
	"seq" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "reference_id" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "workflow_step" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "lead_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "last_contact_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "leads_ref_idx" ON "leads" USING btree ("reference_id");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_reference_id_unique" UNIQUE("reference_id");