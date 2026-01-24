import { type BrandStory, type InsertBrandStory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getBrandStory(id: string): Promise<BrandStory | undefined>;
  getAllBrandStories(): Promise<BrandStory[]>;
  createBrandStory(story: InsertBrandStory): Promise<BrandStory>;
  deleteBrandStory(id: string): Promise<boolean>;
}

function calculateMatchedKeywords(keywords: string[], story: string): number {
  const storyLower = story.toLowerCase();
  return keywords.filter(keyword => {
    const keywordTrimmed = keyword.trim().toLowerCase();
    return keywordTrimmed && storyLower.includes(keywordTrimmed);
  }).length;
}

export class MemStorage implements IStorage {
  private brandStories: Map<string, BrandStory>;

  constructor() {
    this.brandStories = new Map();
  }

  async getBrandStory(id: string): Promise<BrandStory | undefined> {
    return this.brandStories.get(id);
  }

  async getAllBrandStories(): Promise<BrandStory[]> {
    return Array.from(this.brandStories.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createBrandStory(insertStory: InsertBrandStory): Promise<BrandStory> {
    const id = randomUUID();
    const matchedCount = calculateMatchedKeywords(insertStory.keywords, insertStory.story);
    const brandStory: BrandStory = {
      ...insertStory,
      id,
      matchedCount,
      createdAt: new Date().toISOString(),
    };
    this.brandStories.set(id, brandStory);
    return brandStory;
  }

  async deleteBrandStory(id: string): Promise<boolean> {
    return this.brandStories.delete(id);
  }
}

export const storage = new MemStorage();
