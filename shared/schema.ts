import { z } from "zod";
import { pgTable, varchar, integer } from "drizzle-orm/pg-core";

// Anonymous milestone tallies — counts only, never words, never identities.
// Each row is a turnstile counter: which milestone, how many times, nothing else.
export const statCounters = pgTable("stat_counters", {
  event: varchar("event", { length: 40 }).primaryKey(),
  count: integer("count").notNull().default(0),
});

export const STAT_EVENTS = [
  "stories_coached",
  "ethos_lit",
  "pathos_lit",
  "logos_lit",
  "all_three_lit",
  "unicorns_danced",
] as const;

export type StatEvent = (typeof STAT_EVENTS)[number];
export type StatCounter = typeof statCounters.$inferSelect;

export const brandStorySchema = z.object({
  id: z.string(),
  keywords: z.array(z.string()).length(8),
  story: z.string().max(160),
  matchedCount: z.number().min(0).max(8),
  createdAt: z.string(),
});

export const insertBrandStorySchema = z.object({
  keywords: z.array(z.string()).length(8),
  story: z.string().min(1, "Story is required").max(160, "Story must be 160 characters or less"),
});

export type BrandStory = z.infer<typeof brandStorySchema>;
export type InsertBrandStory = z.infer<typeof insertBrandStorySchema>;
