CREATE TABLE "kyc_sessions" (
	"lead_id" varchar(255) PRIMARY KEY NOT NULL,
	"payment_method" varchar(50),
	"required_total" integer DEFAULT 0,
	"documents" jsonb,
	"consent_status" text,
	"coupon_code" varchar(50),
	"verification_status" jsonb,
	"kyc_draft_data" jsonb,
	"kyc_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_facilitation_files" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"lead_id" varchar(255) NOT NULL,
	"payment_method" varchar(50),
	"documents_uploaded" boolean DEFAULT false,
	"company_validation_status" varchar(50) DEFAULT 'pending',
	"facilitation_fee_status" varchar(50) DEFAULT 'pending',
	"fee_amount" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kyc_sessions" ADD CONSTRAINT "kyc_sessions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_facilitation_files" ADD CONSTRAINT "loan_facilitation_files_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;