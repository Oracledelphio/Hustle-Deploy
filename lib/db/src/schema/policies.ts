import { pgTable, uuid, text, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const policiesTable = pgTable("policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  worker_id: uuid("worker_id").notNull(),
  tier: text("tier").notNull(),
  weekly_premium: decimal("weekly_premium", { precision: 8, scale: 2 }).notNull(),
  coverage_cap: decimal("coverage_cap", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("active").notNull(),
  activated_at: timestamp("activated_at", { withTimezone: true }).defaultNow().notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  zone_id: text("zone_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPolicySchema = createInsertSchema(policiesTable).omit({ id: true, created_at: true, activated_at: true });
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = typeof policiesTable.$inferSelect;
