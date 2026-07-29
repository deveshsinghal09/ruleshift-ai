CREATE TYPE "SessionStatus" AS ENUM ('PLAYING', 'VICTORY', 'DEFEAT', 'ABANDONED');

CREATE TABLE "game_sessions" (
    "id" UUID NOT NULL,
    "owner_token_hash" CHAR(64) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PLAYING',
    "state_version" INTEGER NOT NULL DEFAULT 1,
    "current_turn" INTEGER NOT NULL DEFAULT 0,
    "current_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "abandoned_at" TIMESTAMP(3),
    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_sessions_state_version_check" CHECK ("state_version" > 0),
    CONSTRAINT "game_sessions_current_turn_check" CHECK ("current_turn" >= 0)
);

CREATE TABLE "game_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "turn" INTEGER NOT NULL,
    "event_id" VARCHAR(128) NOT NULL,
    "event_kind" VARCHAR(32) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "action_id" VARCHAR(128) NOT NULL,
    "action_label" VARCHAR(320) NOT NULL,
    "before_state_snapshot" JSONB NOT NULL,
    "after_state_snapshot" JSONB NOT NULL,
    "effects" JSONB NOT NULL,
    "rule_events" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_events_turn_check" CHECK ("turn" > 0)
);

CREATE TABLE "active_rules" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "rule_id" VARCHAR(128) NOT NULL,
    "rule_key" VARCHAR(80) NOT NULL,
    "parameters" JSONB NOT NULL,
    "remaining_turns" INTEGER NOT NULL,
    "total_turns" INTEGER NOT NULL,
    "activated_at_turn" INTEGER NOT NULL,
    CONSTRAINT "active_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "active_rules_duration_check" CHECK ("remaining_turns" >= 0 AND "total_turns" BETWEEN 1 AND 5)
);

CREATE TABLE "session_inventory_items" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "item_id" VARCHAR(128) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "rarity" VARCHAR(32) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "uses_remaining" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    CONSTRAINT "session_inventory_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_inventory_non_negative_check" CHECK ("quantity" >= 0 AND "uses_remaining" >= 0)
);

CREATE TABLE "session_npc_states" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "npc_id" VARCHAR(128) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "relationship" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    CONSTRAINT "session_npc_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "turn_requests" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(128) NOT NULL,
    "expected_version" INTEGER NOT NULL,
    "resulting_version" INTEGER NOT NULL,
    "action" JSONB NOT NULL,
    "response_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "turn_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "turn_requests_versions_check" CHECK ("expected_version" > 0 AND "resulting_version" > "expected_version")
);

CREATE INDEX "game_sessions_owner_token_hash_updated_at_idx" ON "game_sessions"("owner_token_hash", "updated_at");
CREATE UNIQUE INDEX "game_events_session_id_turn_key" ON "game_events"("session_id", "turn");
CREATE INDEX "game_events_session_id_created_at_idx" ON "game_events"("session_id", "created_at");
CREATE UNIQUE INDEX "active_rules_session_id_rule_id_key" ON "active_rules"("session_id", "rule_id");
CREATE UNIQUE INDEX "session_inventory_items_session_id_item_id_key" ON "session_inventory_items"("session_id", "item_id");
CREATE UNIQUE INDEX "session_npc_states_session_id_npc_id_key" ON "session_npc_states"("session_id", "npc_id");
CREATE UNIQUE INDEX "turn_requests_session_id_idempotency_key_key" ON "turn_requests"("session_id", "idempotency_key");
CREATE INDEX "turn_requests_session_id_created_at_idx" ON "turn_requests"("session_id", "created_at");

ALTER TABLE "game_events" ADD CONSTRAINT "game_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "active_rules" ADD CONSTRAINT "active_rules_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_inventory_items" ADD CONSTRAINT "session_inventory_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_npc_states" ADD CONSTRAINT "session_npc_states_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "turn_requests" ADD CONSTRAINT "turn_requests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
