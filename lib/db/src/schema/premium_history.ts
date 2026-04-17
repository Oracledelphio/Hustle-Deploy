import { pgTable, uuid, text, decimal, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const premiumHistoryTable = pgTable("premium_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  worker_id: uuid("worker_id").notNull(),
  week_start: date("week_start"),
  premium_amount: decimal("premium_amount", { precision: 8, scale: 2 }),
  zone_risk_adjustment: decimal("zone_risk_adjustment", { precision: 8, scale: 2 }),
  worker_risk_adjustment: decimal("worker_risk_adjustment", { precision: 8, scale: 2 }),
  explanation: text("explanation"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPremiumHistorySchema = createInsertSchema(premiumHistoryTable).omit({ id: true, created_at: true });
export type InsertPremiumHistory = z.infer<typeof insertPremiumHistorySchema>;
export type PremiumHistory = typeof premiumHistoryTable.$inferSelect;
