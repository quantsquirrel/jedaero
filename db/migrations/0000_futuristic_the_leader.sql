CREATE TABLE "ai_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_of" text NOT NULL,
	"weights" jsonb NOT NULL,
	"details" jsonb,
	"template_id" text,
	"decided_at" timestamp with time zone NOT NULL,
	"effective_from" date NOT NULL,
	CONSTRAINT "allocations_user_id_week_of_unique" UNIQUE("user_id","week_of")
);
--> statement-breakpoint
CREATE TABLE "budget_envelopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_month_id" uuid NOT NULL,
	"category" text NOT NULL,
	"allocated" integer NOT NULL,
	"spent" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_months" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"year_month" text NOT NULL,
	"base_salary" integer NOT NULL,
	"locked_at" timestamp with time zone,
	CONSTRAINT "budget_months_user_id_year_month_unique" UNIQUE("user_id","year_month")
);
--> statement-breakpoint
CREATE TABLE "exemption_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"year_quarter" text NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text,
	"cap_applied" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occurred_on" date NOT NULL,
	"amount" integer NOT NULL,
	"memo" text,
	"tier" text DEFAULT 'UNCLASSIFIED' NOT NULL,
	"category" text,
	"ai_suggested_tier" text,
	"ai_confidence" real,
	"confirmed_by_user" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"member_limit" integer DEFAULT 30 NOT NULL,
	CONSTRAINT "groups_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"holiday_date" date PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"ticker" text NOT NULL,
	"trade_date" date NOT NULL,
	"close" integer NOT NULL,
	CONSTRAINT "prices_ticker_trade_date_pk" PRIMARY KEY("ticker","trade_date")
);
--> statement-breakpoint
CREATE TABLE "quest_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"quest_id" uuid NOT NULL,
	"week_of" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "quest_progress_user_quest_week_unique" UNIQUE("user_id","quest_id","week_of")
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"xp" integer NOT NULL,
	"badge" text,
	CONSTRAINT "quests_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickers" (
	"ticker" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"theme" text NOT NULL,
	"kind" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nickname" text NOT NULL,
	"rank" text NOT NULL,
	"branch" text NOT NULL,
	"enlisted_at" date NOT NULL,
	"discharge_at" date NOT NULL,
	"home_distance" text NOT NULL,
	"analytics_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_of" text NOT NULL,
	"twr_pct" real,
	"budget_accuracy" real,
	"xp" integer
);
--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;