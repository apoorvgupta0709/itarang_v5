CREATE TABLE "documents" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "documents_entity_idx" ON "documents" ("entity_type","entity_id");
--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" ("document_type");
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "order_pi_versions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"document_id" varchar(255) NOT NULL,
	"pi_number" text,
	"pi_date" timestamp with time zone,
	"amount" numeric(12, 2) NOT NULL,
	"version" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'uploaded' NOT NULL,
	"rejection_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "order_pi_versions_order_idx" ON "order_pi_versions" ("order_id");
--> statement-breakpoint
CREATE INDEX "order_pi_versions_active_idx" ON "order_pi_versions" ("order_id","is_active");
--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "order_invoice_versions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"document_id" varchar(255) NOT NULL,
	"invoice_number" text,
	"invoice_date" timestamp with time zone,
	"amount" numeric(12, 2) NOT NULL,
	"version" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'uploaded' NOT NULL,
	"rejection_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "order_invoice_versions_order_idx" ON "order_invoice_versions" ("order_id");
--> statement-breakpoint
CREATE INDEX "order_invoice_versions_active_idx" ON "order_invoice_versions" ("order_id","is_active");
--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "order_payments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"invoice_version_id" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"mode" varchar(50) NOT NULL,
	"utr" text NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "order_payments_order_idx" ON "order_payments" ("order_id");
--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_invoice_version_id_order_invoice_versions_id_fk" FOREIGN KEY ("invoice_version_id") REFERENCES "public"."order_invoice_versions"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "order_credits" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"invoice_version_id" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "order_credits_order_idx" ON "order_credits" ("order_id");
--> statement-breakpoint
CREATE INDEX "order_credits_status_idx" ON "order_credits" ("status");
--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_invoice_version_id_order_invoice_versions_id_fk" FOREIGN KEY ("invoice_version_id") REFERENCES "public"."order_invoice_versions"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "order_challans" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"document_id" varchar(255) NOT NULL,
	"challan_number" text,
	"challan_date" timestamp with time zone,
	"ewaybill_number" text,
	"ewaybill_date" timestamp with time zone,
	"status" varchar(20) DEFAULT 'uploaded' NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "order_challans_order_idx" ON "order_challans" ("order_id");
--> statement-breakpoint
ALTER TABLE "order_challans" ADD CONSTRAINT "order_challans_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_challans" ADD CONSTRAINT "order_challans_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "order_challans" ADD CONSTRAINT "order_challans_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;