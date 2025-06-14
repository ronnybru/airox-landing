-- Add new IAP fields to user table
ALTER TABLE "user" ADD COLUMN "iap_purchase_token" text;
ALTER TABLE "user" ADD COLUMN "iap_platform" varchar(10);
ALTER TABLE "user" ADD COLUMN "iap_original_transaction_id" text;

-- Update existing comment for iap_transaction_id to clarify it can be Apple or Android
COMMENT ON COLUMN "user"."iap_transaction_id" IS 'Apple transaction ID or Android order ID';
COMMENT ON COLUMN "user"."iap_purchase_token" IS 'Android purchase token (for Google Play validation)';
COMMENT ON COLUMN "user"."iap_platform" IS 'Platform: ios or android';
COMMENT ON COLUMN "user"."iap_original_transaction_id" IS 'iOS original transaction ID';