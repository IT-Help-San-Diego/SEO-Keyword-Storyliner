import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandStorySchema } from "@shared/schema";
import { z } from "zod";
import { isAIEnabled, aiProviderName, aiChat } from "./ai";

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "that",
  "this", "have", "from", "they", "will", "what", "when", "where", "which",
  "our", "out", "all", "can", "get", "has", "was", "were", "into", "more",
  "than", "then", "them", "their", "his", "her", "its", "who", "why", "how",
  "a", "an", "to", "of", "in", "on", "at", "is", "it", "we", "be", "or", "so",
]);

const STARTER_KEYWORDS = [
  "trusted", "innovative", "premium", "affordable", "handcrafted", "local",
  "sustainable", "fast", "reliable", "modern", "expert", "friendly",
];

const rateBuckets = new Map<string, { count: number; reset: number }>();

function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [k, v] of Array.from(rateBuckets)) if (now > v.reset) rateBuckets.delete(k);
  }
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.reset) {
    rateBuckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  if (bucket.count >= limit) return true;
  bucket.count += 1;
  return false;
}

const aiCoachResponseSchema = z.object({
  tips: z.array(z.string().max(280)).max(4).default([]),
  rewrite: z.string().max(400).default(""),
});

async function datamuseRelated(seeds: string[], max: number): Promise<string[]> {
  const results = new Map<string, number>();
  await Promise.all(
    seeds.map(async (seed) => {
      try {
        const res = await fetch(
          `https://api.datamuse.com/words?rel_trg=${encodeURIComponent(seed)}&max=12`
        );
        if (!res.ok) return;
        const words = (await res.json()) as { word: string; score?: number }[];
        for (const w of words) {
          if (w.word.includes(" ")) continue;
          results.set(w.word, Math.max(results.get(w.word) ?? 0, w.score ?? 0));
        }
      } catch {
        /* ignore individual failures */
      }
    })
  );
  return Array.from(results.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, max);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getAllBrandStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    try {
      const story = await storage.getBrandStory(req.params.id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch story" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const validated = insertBrandStorySchema.parse(req.body);
      
      if (validated.keywords.length !== 8) {
        return res.status(400).json({ error: "Exactly 8 keywords are required" });
      }
      if (validated.story.length > 160) {
        return res.status(400).json({ error: "Story must be 160 characters or less" });
      }
      
      const story = await storage.createBrandStory(validated);
      res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBrandStory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  app.get("/api/ai/status", (_req, res) => {
    res.json({ enabled: isAIEnabled(), provider: aiProviderName() });
  });

  app.get("/api/thesaurus", async (req, res) => {
    if (rateLimited(`thesaurus:${req.ip}`, 40, 60_000)) {
      return res.status(429).json({ error: "Too many requests", synonyms: [] });
    }
    const word = String(req.query.word ?? "").trim().toLowerCase().slice(0, 40);
    if (!word) return res.status(400).json({ error: "word query is required" });
    try {
      const r = await fetch(
        `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}&max=10`
      );
      if (!r.ok) throw new Error(`Datamuse ${r.status}`);
      const data = (await r.json()) as { word: string }[];
      const synonyms = data
        .map((d) => d.word)
        .filter((w) => w.toLowerCase() !== word)
        .slice(0, 8);
      res.json({ word, synonyms });
    } catch {
      res.status(502).json({ error: "Thesaurus lookup failed", synonyms: [] });
    }
  });

  app.post("/api/suggest", async (req, res) => {
    if (rateLimited(`suggest:${req.ip}`, 40, 60_000)) {
      return res.status(429).json({ suggestions: [] });
    }
    const story = String(req.body?.story ?? "").slice(0, 1000);
    const exclude = new Set(
      (Array.isArray(req.body?.exclude) ? req.body.exclude : [])
        .map((s: string) => String(s).toLowerCase().trim())
        .filter(Boolean)
    );

    const seeds = Array.from(
      new Set(
        story
          .toLowerCase()
          .replace(/[^a-z\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 3 && !STOPWORDS.has(w))
      )
    )
      .sort((a, b) => b.length - a.length)
      .slice(0, 4);

    try {
      let suggestions: string[] = [];
      if (seeds.length > 0) {
        suggestions = await datamuseRelated(seeds, 24);
      }
      if (suggestions.length < 6) {
        suggestions = [...suggestions, ...STARTER_KEYWORDS];
      }
      const seen = new Set<string>();
      const cleaned = suggestions.filter((w) => {
        const lw = w.toLowerCase();
        if (exclude.has(lw) || seen.has(lw)) return false;
        if (story.toLowerCase().includes(lw)) return false;
        seen.add(lw);
        return true;
      });
      res.json({ suggestions: cleaned.slice(0, 10) });
    } catch {
      res.json({ suggestions: STARTER_KEYWORDS.slice(0, 8) });
    }
  });

  app.post("/api/ai/coach", async (req, res) => {
    if (!isAIEnabled()) {
      return res.status(503).json({ error: "AI endpoint not configured" });
    }
    if (rateLimited(`ai:${req.ip}`, 12, 60_000)) {
      return res.status(429).json({ error: "Too many requests — slow down a moment." });
    }
    const story = String(req.body?.story ?? "").slice(0, 400);
    const keywords = (Array.isArray(req.body?.keywords) ? req.body.keywords : [])
      .map((k: string) => String(k))
      .filter(Boolean)
      .slice(0, 8);
    try {
      const content = await aiChat(
        [
          {
            role: "system",
            content: [
              "You are Storyliner's coach: part Aristotle, part honest friend who gives people a reality check.",
              "PHILOSOPHY — this is the whole point, so honor it:",
              "- A brand's story is its FOUNDATION, the thing most people skip. It comes before the logo, the domain, the ads.",
              "- Built on nearly 2,400 years of logic from Aristotle: ethos (character/trust), pathos (feeling/why anyone cares), logos (logic/concrete proof), and a story shape (a hook, a turn, a payoff) — even compressed into one breath.",
              "- It is engineered like a Disney story, not decorated.",
              "KEYWORDS ARE NOT A MARKET BET. They are honest findability:",
              "- The goal is to simply BE who you say you are — name, address, what you actually do all matching — so the right people just find you. Don't tell anyone to game or chase search.",
              "- The reality check: a keyword must name what is TRUE, even when the person wishes it weren't. The thing you're best known for is how the world finds you; it earns its place whether you like it or not. Gently push back on wishful, vanity, or vague keywords.",
              "- Keywords can be short real phrases (e.g. 'emergency IT help, San Diego'), not just single abstract nouns.",
              "THE STORY must stay UNDER 160 characters (it is an SEO meta description). Keep it real, direct, and specific — never buzzword soup.",
              "Voice: warm, plain, everyday language; confident; occasionally a kind but firm reality check. No jargon, no hype.",
              "Respond ONLY with compact JSON: {\"tips\": [\"...\"], \"rewrite\": \"...\"} where tips has 2-3 short, specific items and rewrite is an improved version UNDER 160 characters that naturally weaves in the given keywords.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `Keywords: ${keywords.join(", ") || "(none)"}\nStory: ${story || "(empty)"}`,
          },
        ],
        { temperature: 0.7, maxTokens: 320 }
      );
      let raw: any;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        raw = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        raw = { tips: [content], rewrite: "" };
      }
      if (typeof raw?.tips === "string") raw.tips = [raw.tips];
      if (!Array.isArray(raw?.tips)) raw.tips = [];
      if (typeof raw?.rewrite !== "string") raw.rewrite = "";
      const safe = aiCoachResponseSchema.safeParse(raw);
      res.json(safe.success ? safe.data : { tips: [], rewrite: "" });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : "AI request failed",
      });
    }
  });

  return httpServer;
}
