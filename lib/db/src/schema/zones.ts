import { pgTable, text, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const zonesTable = pgTable("zones", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  lat: decimal("lat", { precision: 9, scale: 6 }),
  lng: decimal("lng", { precision: 9, scale: 6 }),
  gds_score: integer("gds_score").default(0).notNull(),
  status: text("status").default("normal").notNull(),
  active_workers: integer("active_workers").default(0).notNull(),
  rainfall_mm: decimal("rainfall_mm", { precision: 6, scale: 2 }).default("0").notNull(),
  traffic_score: decimal("traffic_score", { precision: 3, scale: 1 }).default("0").notNull(),
  aqi: integer("aqi").default(50).notNull(),
  demand_drop_pct: integer("demand_drop_pct").default(0).notNull(),
  govt_alert: boolean("govt_alert").default(false).notNull(),
  last_updated: timestamp("last_updated", { withTimezone: true }).defaultNow().notNull(),
});

export const insertZoneSchema = createInsertSchema(zonesTable);
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zonesTable.$inferSelect;
