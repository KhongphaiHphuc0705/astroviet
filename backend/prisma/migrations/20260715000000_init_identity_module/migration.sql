-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";
CREATE SCHEMA IF NOT EXISTS "astrology";
CREATE SCHEMA IF NOT EXISTS "content";

-- CreateTable
CREATE TABLE "identity"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "email_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "replaced_by_token_id" UUID,
    "created_by_ip" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "identity"."users"("email") WHERE "deleted_at" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "identity"."refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "identity"."refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "identity"."refresh_tokens"("expires_at") WHERE "revoked_at" IS NULL;

-- AddForeignKey
ALTER TABLE "identity"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_token_id_fkey" FOREIGN KEY ("replaced_by_token_id") REFERENCES "identity"."refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Custom Check Constraints (from DB Design Spec)
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_role_check" CHECK (role IN ('user', 'admin'));
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_display_name_check" CHECK (length(display_name) <= 100);
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_email_check" CHECK (position('@' in email) > 1);

-- Custom Trigger for updated_at (Method B)
CREATE OR REPLACE FUNCTION "identity".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_identity_users_updated_at
BEFORE UPDATE ON "identity"."users"
FOR EACH ROW
EXECUTE FUNCTION "identity".update_updated_at_column();
