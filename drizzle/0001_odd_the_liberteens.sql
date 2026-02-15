CREATE TABLE "accounts" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"email" text,
	"phone" varchar(20),
	"gstin" varchar(15),
	"billing_address" text,
	"shipping_address" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_order_fulfilled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assignment_change_logs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"lead_id" varchar(255) NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"old_user_id" uuid,
	"new_user_id" uuid,
	"changed_by" uuid NOT NULL,
	"change_reason" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bolna_calls" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"bolna_call_id" varchar(255) NOT NULL,
	"lead_id" varchar(255),
	"status" varchar(20) DEFAULT 'initiated' NOT NULL,
	"current_phase" varchar(100),
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"transcript_chunk" text,
	"chunk_received_at" timestamp with time zone,
	"full_transcript" text,
	"transcript_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bolna_calls_bolna_call_id_unique" UNIQUE("bolna_call_id")
);
--> statement-breakpoint
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
CREATE TABLE "intellicar_can_latest" (
	"vehicleno" text PRIMARY KEY NOT NULL,
	"soc_value" numeric(10, 2),
	"soc_ts_epoch" bigint,
	"battery_temp_value" numeric(10, 2),
	"battery_temp_ts_epoch" bigint,
	"battery_voltage_value" numeric(10, 2),
	"battery_voltage_ts_epoch" bigint,
	"current_value" numeric(10, 2),
	"current_ts_epoch" bigint,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sync_run_id" uuid,
	"raw" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_fuel_latest" (
	"vehicleno" text PRIMARY KEY NOT NULL,
	"fueltime_epoch" bigint NOT NULL,
	"fuellevel_pct" numeric(10, 2),
	"fuellevel_litres" numeric(12, 3),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sync_run_id" uuid,
	"raw" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_gps_latest" (
	"vehicleno" text PRIMARY KEY NOT NULL,
	"commtime_epoch" bigint NOT NULL,
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"alti" numeric(10, 2),
	"devbattery" numeric(10, 2),
	"vehbattery" numeric(10, 2),
	"speed" numeric(10, 2),
	"heading" numeric(10, 2),
	"ignstatus" integer,
	"mobili" integer,
	"dout_1" integer,
	"dout_2" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sync_run_id" uuid,
	"raw" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_pulls" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"pulled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "intellicar_sync_run_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_run_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"vehicleno" text,
	"status" varchar(20) NOT NULL,
	"pulled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error" text,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "intellicar_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger" varchar(20) DEFAULT 'cron' NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"window_start_epoch" bigint,
	"window_end_epoch" bigint,
	"vehicles_discovered" integer DEFAULT 0 NOT NULL,
	"vehicles_updated" integer DEFAULT 0 NOT NULL,
	"endpoints_called" integer DEFAULT 0 NOT NULL,
	"records_written" integer DEFAULT 0 NOT NULL,
	"errors_count" integer DEFAULT 0 NOT NULL,
	"errors" jsonb,
	"app_version" text
);
--> statement-breakpoint
CREATE TABLE "intellicar_vehicle_device_map" (
	"vehicleno" text PRIMARY KEY NOT NULL,
	"deviceno" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sync_run_id" uuid,
	"raw" jsonb
);
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
CREATE TABLE "order_disputes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"dispute_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"photos_urls" jsonb,
	"assigned_to" uuid NOT NULL,
	"resolution_status" varchar(50) DEFAULT 'open' NOT NULL,
	"resolution_details" text,
	"action_taken" text,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
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
ALTER TABLE "oem_contacts" DROP CONSTRAINT "oem_contacts_oem_id_oems_id_fk";
--> statement-breakpoint
ALTER TABLE "oem_inventory_for_pdi" DROP CONSTRAINT "oem_inventory_for_pdi_product_id_product_catalog_id_fk";
--> statement-breakpoint
ALTER TABLE "approvals" ALTER COLUMN "decision_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "transportation_cost" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "transportation_cost" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "deal_status" SET DEFAULT 'pending_approval_l1';--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "quantity" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "challan_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "gst_percent" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "status" SET DEFAULT 'in_transit';--> statement-breakpoint
ALTER TABLE "inventory" ALTER COLUMN "uploaded_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "interest_level" SET DEFAULT 'cold';--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "uploader_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "uploader_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "qualified_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oems" ALTER COLUMN "cin" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "oems" ALTER COLUMN "bank_proof_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_amount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "expected_delivery_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "expected_delivery_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "actual_delivery_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "grn_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pdi_records" ALTER COLUMN "latitude" SET DATA TYPE numeric(10, 8);--> statement-breakpoint
ALTER TABLE "pdi_records" ALTER COLUMN "longitude" SET DATA TYPE numeric(11, 8);--> statement-breakpoint
ALTER TABLE "pdi_records" ALTER COLUMN "inspected_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pdi_records" ALTER COLUMN "inspected_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "provisions" ALTER COLUMN "expected_delivery_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "comments" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "invoice_number" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "invoice_url" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "invoice_issued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "expired_by" uuid;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "expired_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "expiry_reason" text;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "rejected_by" uuid;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "oem_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "asset_category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "asset_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "model_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "batch_number" varchar(255);--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "manufacturing_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "expiry_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "oem_invoice_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "oem_invoice_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "oem_invoice_url" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "product_manual_url" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "warranty_document_url" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "warehouse_location" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD COLUMN "assigned_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD COLUMN "lead_actor" uuid;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD COLUMN "actor_assigned_by" uuid;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD COLUMN "actor_assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "business_name" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "owner_email" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "shop_address" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "battery_order_expected" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "investment_capacity" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "business_type" varchar(50);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "converted_deal_id" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "converted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oem_inventory_for_pdi" ADD COLUMN "inventory_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "oem_inventory_for_pdi" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "pan" varchar(10);--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "address_line1" text;--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "address_line2" text;--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "pincode" varchar(6);--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "oems" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "account_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_status" varchar(20) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "pdi_records" ADD COLUMN "capacity_ah" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "pdi_records" ADD COLUMN "resistance_mohm" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "pdi_records" ADD COLUMN "temperature_celsius" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "pdi_records" ADD COLUMN "location_address" text;--> statement-breakpoint
ALTER TABLE "pdi_records" ADD COLUMN "pdi_photos" jsonb;--> statement-breakpoint
ALTER TABLE "product_catalog" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_catalog" ADD COLUMN "disabled_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_change_logs" ADD CONSTRAINT "assignment_change_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_change_logs" ADD CONSTRAINT "assignment_change_logs_old_user_id_users_id_fk" FOREIGN KEY ("old_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_change_logs" ADD CONSTRAINT "assignment_change_logs_new_user_id_users_id_fk" FOREIGN KEY ("new_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_change_logs" ADD CONSTRAINT "assignment_change_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bolna_calls" ADD CONSTRAINT "bolna_calls_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_can_latest" ADD CONSTRAINT "intellicar_can_latest_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_can_latest" ADD CONSTRAINT "intellicar_can_latest_last_sync_run_id_intellicar_sync_runs_id_fk" FOREIGN KEY ("last_sync_run_id") REFERENCES "public"."intellicar_sync_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_fuel_latest" ADD CONSTRAINT "intellicar_fuel_latest_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_fuel_latest" ADD CONSTRAINT "intellicar_fuel_latest_last_sync_run_id_intellicar_sync_runs_id_fk" FOREIGN KEY ("last_sync_run_id") REFERENCES "public"."intellicar_sync_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_gps_latest" ADD CONSTRAINT "intellicar_gps_latest_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_gps_latest" ADD CONSTRAINT "intellicar_gps_latest_last_sync_run_id_intellicar_sync_runs_id_fk" FOREIGN KEY ("last_sync_run_id") REFERENCES "public"."intellicar_sync_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_sync_run_items" ADD CONSTRAINT "intellicar_sync_run_items_sync_run_id_intellicar_sync_runs_id_fk" FOREIGN KEY ("sync_run_id") REFERENCES "public"."intellicar_sync_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_vehicle_device_map" ADD CONSTRAINT "intellicar_vehicle_device_map_last_sync_run_id_intellicar_sync_runs_id_fk" FOREIGN KEY ("last_sync_run_id") REFERENCES "public"."intellicar_sync_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_challans" ADD CONSTRAINT "order_challans_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_challans" ADD CONSTRAINT "order_challans_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_challans" ADD CONSTRAINT "order_challans_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_invoice_version_id_order_invoice_versions_id_fk" FOREIGN KEY ("invoice_version_id") REFERENCES "public"."order_invoice_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_credits" ADD CONSTRAINT "order_credits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_disputes" ADD CONSTRAINT "order_disputes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_invoice_versions" ADD CONSTRAINT "order_invoice_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_invoice_version_id_order_invoice_versions_id_fk" FOREIGN KEY ("invoice_version_id") REFERENCES "public"."order_invoice_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_pi_versions" ADD CONSTRAINT "order_pi_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bolna_calls_bolna_call_id_idx" ON "bolna_calls" USING btree ("bolna_call_id");--> statement-breakpoint
CREATE INDEX "bolna_calls_lead_id_idx" ON "bolna_calls" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "bolna_calls_status_idx" ON "bolna_calls" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bolna_calls_started_at_idx" ON "bolna_calls" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "documents_entity_idx" ON "documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "intellicar_can_latest_updated_at_idx" ON "intellicar_can_latest" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "intellicar_fuel_latest_updated_at_idx" ON "intellicar_fuel_latest" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "intellicar_fuel_latest_fueltime_idx" ON "intellicar_fuel_latest" USING btree ("fueltime_epoch");--> statement-breakpoint
CREATE INDEX "intellicar_gps_latest_updated_at_idx" ON "intellicar_gps_latest" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "intellicar_gps_latest_commtime_idx" ON "intellicar_gps_latest" USING btree ("commtime_epoch");--> statement-breakpoint
CREATE INDEX "intellicar_sync_run_items_run_idx" ON "intellicar_sync_run_items" USING btree ("sync_run_id");--> statement-breakpoint
CREATE INDEX "intellicar_sync_run_items_endpoint_idx" ON "intellicar_sync_run_items" USING btree ("endpoint","pulled_at");--> statement-breakpoint
CREATE INDEX "intellicar_sync_run_items_vehicle_endpoint_idx" ON "intellicar_sync_run_items" USING btree ("vehicleno","endpoint","pulled_at");--> statement-breakpoint
CREATE INDEX "intellicar_sync_runs_started_at_idx" ON "intellicar_sync_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "intellicar_sync_runs_status_started_idx" ON "intellicar_sync_runs" USING btree ("status","started_at");--> statement-breakpoint
CREATE INDEX "intellicar_vehicle_device_map_deviceno_idx" ON "intellicar_vehicle_device_map" USING btree ("deviceno");--> statement-breakpoint
CREATE INDEX "intellicar_vehicle_device_map_active_idx" ON "intellicar_vehicle_device_map" USING btree ("active");--> statement-breakpoint
CREATE INDEX "intellicar_vehicle_device_map_last_seen_idx" ON "intellicar_vehicle_device_map" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "order_challans_order_idx" ON "order_challans" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_credits_order_idx" ON "order_credits" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_credits_status_idx" ON "order_credits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_invoice_versions_order_idx" ON "order_invoice_versions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_invoice_versions_active_idx" ON "order_invoice_versions" USING btree ("order_id","is_active");--> statement-breakpoint
CREATE INDEX "order_payments_order_idx" ON "order_payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_pi_versions_order_idx" ON "order_pi_versions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_pi_versions_active_idx" ON "order_pi_versions" USING btree ("order_id","is_active");--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_expired_by_users_id_fk" FOREIGN KEY ("expired_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_actor_users_id_fk" FOREIGN KEY ("lead_actor") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_actor_assigned_by_users_id_fk" FOREIGN KEY ("actor_assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oem_contacts" ADD CONSTRAINT "oem_contacts_oem_id_oems_id_fk" FOREIGN KEY ("oem_id") REFERENCES "public"."oems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oem_inventory_for_pdi" ADD CONSTRAINT "oem_inventory_for_pdi_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_catalog" ADD CONSTRAINT "product_catalog_disabled_by_users_id_fk" FOREIGN KEY ("disabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_source_idx" ON "leads" USING btree ("lead_source");--> statement-breakpoint
CREATE INDEX "leads_interest_idx" ON "leads" USING btree ("interest_level");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("lead_status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
ALTER TABLE "inventory" DROP COLUMN "invoice_number";--> statement-breakpoint
ALTER TABLE "inventory" DROP COLUMN "invoice_date";--> statement-breakpoint
ALTER TABLE "lead_assignments" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "oem_inventory_for_pdi" DROP COLUMN "product_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_iot_imei_no_unique" UNIQUE("iot_imei_no");--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_serial_number_unique" UNIQUE("serial_number");