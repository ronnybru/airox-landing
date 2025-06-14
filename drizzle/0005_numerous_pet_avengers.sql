ALTER TABLE "user" ADD COLUMN "iap_purchase_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "iap_platform" varchar(10);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "iap_original_transaction_id" text;