import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disruptionEventsTable = pgTable("disruption_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  zone_id: text("zone_id"),
  event_type: text("event_type").notNull(),
  gds_target: integer("gds_target"),
  duration_minutes: integer("duration_minutes"),
  triggered_by: text("triggered_by").default("simulator").notNull(),
  is_active: boolean("is_active").default(false).notNull(),
  started_at: timestamp("started_at", { withTimezone: true }),
  ended_at: timestamp("ended_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDisruptionEventSchema = createInsertSchema(disruptionEventsTable).omit({ id: true, created_at: true });
export type InsertDisruptionEvent = z.infer<typeof insertDisruptionEventSchema>;
export type DisruptionEvent = typeof disruptionEventsTable.$inferSelect;
