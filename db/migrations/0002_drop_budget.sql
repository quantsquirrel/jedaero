DROP TABLE "budget_envelopes" CASCADE;--> statement-breakpoint
DROP TABLE "budget_months" CASCADE;--> statement-breakpoint
DROP TABLE "exemption_claims" CASCADE;--> statement-breakpoint
DROP TABLE "expenses" CASCADE;--> statement-breakpoint
ALTER TABLE "weekly_scores" DROP COLUMN "twr_pct";--> statement-breakpoint
ALTER TABLE "weekly_scores" DROP COLUMN "budget_accuracy";