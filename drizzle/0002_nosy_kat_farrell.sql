ALTER TABLE "user" ADD COLUMN "health_kit_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "health_kit_last_connected" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "health_kit_last_disconnected" timestamp;