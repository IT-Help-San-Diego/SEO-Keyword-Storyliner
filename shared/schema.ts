import { z } from "zod";

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
