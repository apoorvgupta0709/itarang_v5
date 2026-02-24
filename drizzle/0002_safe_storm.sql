CREATE TABLE "intellicar_can_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicleno" text NOT NULL,
	"time_ms" bigint NOT NULL,
	"soc" numeric(10, 2),
	"soh" numeric(10, 2),
	"battery_temp" numeric(10, 2),
	"battery_voltage" numeric(10, 2),
	"current" numeric(10, 2),
	"charge_cycle" integer,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_distance_windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicleno" text NOT NULL,
	"start_ms" bigint NOT NULL,
	"end_ms" bigint NOT NULL,
	"distance" numeric(12, 3),
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_fuel_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicleno" text NOT NULL,
	"time_ms" bigint NOT NULL,
	"in_litres" boolean NOT NULL,
	"value" numeric(12, 3),
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_gps_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicleno" text NOT NULL,
	"commtime_ms" bigint NOT NULL,
	"lat" numeric(10, 7) NOT NULL,
	"lng" numeric(10, 7) NOT NULL,
	"alti" numeric(10, 2),
	"speed" numeric(10, 2),
	"heading" numeric(10, 2),
	"ignstatus" integer,
	"mobili" integer,
	"devbattery" numeric(10, 2),
	"vehbattery" numeric(10, 2),
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_history_checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicleno" text NOT NULL,
	"dataset" text NOT NULL,
	"last_synced_end_ms" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intellicar_history_job_control" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"historical_start_ms" bigint DEFAULT 1725148800000 NOT NULL,
	"max_windows_per_run" integer DEFAULT 48 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "intellicar_sync_runs" ADD COLUMN "window_start_ms" bigint;--> statement-breakpoint
ALTER TABLE "intellicar_sync_runs" ADD COLUMN "window_end_ms" bigint;--> statement-breakpoint
ALTER TABLE "intellicar_can_history" ADD CONSTRAINT "intellicar_can_history_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_distance_windows" ADD CONSTRAINT "intellicar_distance_windows_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_fuel_history" ADD CONSTRAINT "intellicar_fuel_history_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_gps_history" ADD CONSTRAINT "intellicar_gps_history_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellicar_history_checkpoints" ADD CONSTRAINT "intellicar_history_checkpoints_vehicleno_intellicar_vehicle_device_map_vehicleno_fk" FOREIGN KEY ("vehicleno") REFERENCES "public"."intellicar_vehicle_device_map"("vehicleno") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "intellicar_can_history_veh_time_unique" ON "intellicar_can_history" USING btree ("vehicleno","time_ms");--> statement-breakpoint
CREATE INDEX "intellicar_can_history_veh_time_idx" ON "intellicar_can_history" USING btree ("vehicleno","time_ms");--> statement-breakpoint
CREATE UNIQUE INDEX "intellicar_distance_windows_veh_range_unique" ON "intellicar_distance_windows" USING btree ("vehicleno","start_ms","end_ms");--> statement-breakpoint
CREATE INDEX "intellicar_distance_windows_veh_start_idx" ON "intellicar_distance_windows" USING btree ("vehicleno","start_ms");--> statement-breakpoint
CREATE UNIQUE INDEX "intellicar_fuel_history_veh_time_unique" ON "intellicar_fuel_history" USING btree ("vehicleno","time_ms","in_litres");--> statement-breakpoint
CREATE INDEX "intellicar_fuel_history_veh_time_idx" ON "intellicar_fuel_history" USING btree ("vehicleno","time_ms");--> statement-breakpoint
CREATE UNIQUE INDEX "intellicar_gps_history_veh_time_unique" ON "intellicar_gps_history" USING btree ("vehicleno","commtime_ms");--> statement-breakpoint
CREATE INDEX "intellicar_gps_history_veh_time_idx" ON "intellicar_gps_history" USING btree ("vehicleno","commtime_ms");--> statement-breakpoint
CREATE UNIQUE INDEX "intellicar_history_checkpoints_veh_dataset_unique" ON "intellicar_history_checkpoints" USING btree ("vehicleno","dataset");--> statement-breakpoint
CREATE INDEX "intellicar_history_checkpoints_dataset_end_idx" ON "intellicar_history_checkpoints" USING btree ("dataset","last_synced_end_ms");--> statement-breakpoint
CREATE INDEX "intellicar_history_checkpoints_veh_idx" ON "intellicar_history_checkpoints" USING btree ("vehicleno");--> statement-breakpoint
ALTER TABLE "intellicar_sync_runs" DROP COLUMN "window_start_epoch";--> statement-breakpoint
ALTER TABLE "intellicar_sync_runs" DROP COLUMN "window_end_epoch";