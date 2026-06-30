import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Pencil,
  Copy,
  Save,
  RotateCcw,
  Plus,
  X,
  Moon,
  Loader2,
  Coins,
  Search,
  Type,
  ChevronDown,
  ArrowRight,
  MapPin,
  TriangleAlert,
  Anchor,
  Sparkles,
  Wand2,
  Download,
  ArrowUpRight,
} from "lucide-react";
import { DancingUnicorns } from "@/components/dancing-unicorns";
import { StoryCoachPanel } from "@/components/story-coach-panel";
import { analyzeStory } from "@/lib/story-coach";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loadDraft, saveDraft, clearDraft } from "@/lib/draft-storage";
import aristotleImg from "@assets/generated_images/aristotle_engraving.webp";

const MAX_STORY_LENGTH = 160;
const REQUIRED_KEYWORDS = 4;
const TOTAL_KEYWORDS = 8;

const EXAMPLE_STORY =
  "Don McLean — American singer-songwriter loved since 1971 for \"American Pie\" & \"Vincent (Starry Starry Night)\". The American Troubadour.";
const EXAMPLE_KEYWORDS = [
  "American singer-songwriter",
  "Don McLean",
  "American Pie",
  "Vincent (Starry Starry Night)",
  "American Troubadour",
  "",
  "",
  "",
];

const liveAppealColors: Record<string, string> = {
  ethos: "bg-chart-1",
  pathos: "bg-chart-2",
  logos: "bg-success",
};

const STOPWORDS = new Set(
  "a an and are as at be been but by for from had has have he her his i in into is it its known like more most my no not of on one or our she so than that the their them then there these they this to up us was we were what when where which who will with you your".split(
    " ",
  ),
);

function extractStoryKeywords(text: string, existing: string[]): string[] {
  const used = new Set(
    existing.map((k) => k.toLowerCase().trim()).filter(Boolean),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (raw: string) => {
    const v = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'’)]+$/g, "").trim();
    if (v.length < 3) return;
    const key = v.toLowerCase();
    if (seen.has(key) || used.has(key)) return;
    if (v.split(/\s+/).length === 1 && STOPWORDS.has(key)) return;
    seen.add(key);
    out.push(v);
  };
  (text.match(/[“"']([^“”"']{2,40})[”"']/g) || []).forEach(add);
  (text.match(/[A-Z][\w’']+(?:\s+(?:[A-Z][\w’']+|of|the|and|&)){0,3}/g) || [])
    .filter((p) => p.trim().split(/\s+/).length >= 2)
    .forEach(add);
  (text.match(/[A-Z][\w’']{2,}/g) || []).forEach(add);
  const words = text.toLowerCase().match(/[a-z][a-z'’-]{3,}/g) || [];
  const freq = new Map<string, number>();
  for (const w of words) if (!STOPWORDS.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .forEach(([w]) => add(w));
  return out.slice(0, 10);
}

interface AnchorConfig {
  label: string;
  placeholder: string;
  hint: string;
}

const ANCHOR_SLOTS: Record<number, AnchorConfig> = {
  0: {
    label: "Anchor · what",
    placeholder: "what you are",
    hint: 'your core category — add a place only if you\'re local, e.g. "IT support, San Diego". A global or personal brand can skip the where.',
  },
  1: {
    label: "Anchor · who",
    placeholder: "your brand name",
    hint: "the name people actually call you",
  },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-primary/60" />
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/90">
        {children}
      </span>
    </div>
  );
}

interface KeywordSlotProps {
  index: number;
  value: string;
  matched: boolean;
  anchor?: AnchorConfig;
  onChange: (value: string) => void;
  onClear: () => void;
}

function KeywordSlot({ index, value, matched, anchor, onChange, onClear }: KeywordSlotProps) {
  const filled = value.trim().length > 0;
  const isAnchor = !!anchor;
  return (
    <div
      data-testid={`slot-keyword-${index}`}
      className={`relative rounded-md border p-2.5 transition-all duration-300 ${
        matched
          ? "border-primary/60 bg-primary/10 shadow-[0_0_16px_hsl(36_54%_61%/0.18)]"
          : filled
            ? isAnchor
              ? "border-primary/50 bg-primary/[0.06]"
              : "border-card-border bg-card"
            : isAnchor
              ? "border-primary/40 bg-primary/[0.05]"
              : "border-dashed border-border bg-muted/20"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.16em] flex items-center gap-1 whitespace-nowrap ${
            isAnchor ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {isAnchor && <Anchor className="w-3 h-3 shrink-0" />}
          {anchor ? anchor.label : `# ${String(index + 1).padStart(2, "0")}`}
        </span>
        {matched ? (
          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
        ) : filled ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={anchor ? `Clear ${anchor.label} keyword` : `Clear keyword slot ${index + 1}`}
            data-testid={`button-clear-slot-${index}`}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Plus className={`w-3.5 h-3.5 shrink-0 ${isAnchor ? "text-primary/40" : "text-muted-foreground/40"}`} />
        )}
      </div>
      <Input
        data-testid={`input-keyword-${index}`}
        placeholder={anchor ? anchor.placeholder : "keyword"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0 ${
          matched ? "text-primary" : ""
        }`}
      />
      {anchor && !filled && (
        <p className="font-mono text-[9px] leading-tight text-primary/60">
          {anchor.hint}
        </p>
      )}
    </div>
  );
}

const PRINCIPLES = [
  {
    icon: MapPin,
    title: "Everything matches",
    body: "Pick the one real-world name people actually call you, and spell it identically everywhere — same spacing, same logo, colors, photos, and descriptions. You don't slap 'LLC' on everything; you just put your exact registered legal name where it's official — your footer and your business listings — so the directories that vouch for real companies match you to the record and start treating you like the bigger, real brand you are.",
  },
  {
    icon: Moon,
    title: "The 2 a.m. test",
    body: "Picture a stranger, alone in the dark, typing into a search bar to solve the exact problem you fix. The words they type are your keywords — not the words you wish they'd use.",
  },
  {
    icon: Coins,
    title: "Bread & butter",
    body: "Every keyword should point at money. Is this the thing that actually pays you? If a word doesn't lead someone toward becoming a customer, it's decoration — cut it.",
  },
  {
    icon: Type,
    title: "Name what's real",
    body: "The thing you're known for may not be the thing you wish you were known for — but if it's how the world finds you, it earns a slot. Keywords can be short phrases, too: \"emergency IT help, San Diego.\"",
  },
];

const APPEALS_EXPLAINED = [
  { label: "Ethos", greek: "ἦθος", body: "Character. The reason you can be trusted to do this at all." },
  { label: "Pathos", greek: "πάθος", body: "Feeling. The reason a stranger should care for even one second." },
  { label: "Logos", greek: "λόγος", body: "Logic. The proof — concrete, specific — that the promise is real." },
];

export default function Home() {
  const initialDraft = useMemo(() => loadDraft(), []);
  const initialHasContent =
    !!initialDraft &&
    (initialDraft.story.trim().length > 0 ||
      initialDraft.keywords.some((k) => k.trim().length > 0));

  const [keywords, setKeywords] = useState<string[]>(() => {
    if (initialDraft) {
      const k = initialDraft.keywords.slice(0, TOTAL_KEYWORDS);
      while (k.length < TOTAL_KEYWORDS) k.push("");
      return k;
    }
    return Array(TOTAL_KEYWORDS).fill("");
  });
  const [story, setStory] = useState(() =>
    initialDraft ? initialDraft.story.slice(0, MAX_STORY_LENGTH) : "",
  );
  const [draftStatus, setDraftStatus] = useState<
    "none" | "restored" | "saved" | "failed"
  >(initialHasContent ? "restored" : "none");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [suggestMode, setSuggestMode] = useState<"story" | "related">("story");
  const [exampleLoaded, setExampleLoaded] = useState(false);
  const preExampleDraft = useRef<{ story: string; keywords: string[] } | null>(null);
  const { toast } = useToast();

  const { data: aiStatus } = useQuery<{ enabled: boolean; provider: string | null }>({
    queryKey: ["/api/ai/status"],
  });
  const aiEnabled = !!aiStatus?.enabled;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!story.trim()) throw new Error("Story is required");
      if (story.length > MAX_STORY_LENGTH) {
        throw new Error(`Story must be ${MAX_STORY_LENGTH} characters or less`);
      }
      return apiRequest("POST", "/api/stories", { keywords, story });
    },
    onSuccess: () => {
      toast({ title: "Story saved", description: "Your brand story has been saved." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save your story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const matchedKeywords = useMemo(() => {
    const storyLower = story.toLowerCase();
    return keywords.map((keyword, index) => {
      if (!keyword.trim()) return { index, keyword, matched: false };
      const matched = storyLower.includes(keyword.toLowerCase().trim());
      return { index, keyword, matched };
    });
  }, [keywords, story]);

  const matchedCount = useMemo(
    () => matchedKeywords.filter((k) => k.matched).length,
    [matchedKeywords]
  );
  const filledKeywords = useMemo(() => keywords.filter((k) => k.trim()).length, [keywords]);

  const coach = useMemo(() => analyzeStory(story), [story]);

  const isSuccess = matchedCount >= REQUIRED_KEYWORDS;
  const progressPercentage = (matchedCount / REQUIRED_KEYWORDS) * 100;

  const [showCelebration, setShowCelebration] = useState(false);
  const wasSuccess = useRef(false);
  useEffect(() => {
    if (isSuccess && !wasSuccess.current) {
      setShowCelebration(true);
    } else if (!isSuccess) {
      setShowCelebration(false);
    }
    wasSuccess.current = isSuccess;
  }, [isSuccess]);

  const draftMounted = useRef(false);
  useEffect(() => {
    if (!draftMounted.current) {
      draftMounted.current = true;
      return;
    }
    if (exampleLoaded) return;
    const handle = setTimeout(() => {
      const hasContent =
        story.trim().length > 0 || keywords.some((k) => k.trim().length > 0);
      if (hasContent) {
        const ok = saveDraft({ story, keywords });
        setDraftStatus(ok ? "saved" : "failed");
      } else {
        clearDraft();
        setDraftStatus("none");
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [story, keywords, exampleLoaded]);

  useEffect(() => {
    if (initialHasContent) {
      toast({
        title: "Draft restored",
        description: "Your words from last time are back on the page.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (suggestMode !== "related") {
      setLoadingSuggest(false);
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setLoadingSuggest(true);
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ story, exclude: keywords.filter((k) => k.trim()) }),
          signal: controller.signal,
        });
        const data = (await res.json()) as { suggestions: string[] };
        if (!controller.signal.aborted) setSuggestions(data.suggestions ?? []);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingSuggest(false);
      }
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [story, keywords, suggestMode]);

  const updateKeyword = useCallback((index: number, value: string) => {
    setExampleLoaded(false);
    setKeywords((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const clearKeyword = useCallback((index: number) => {
    setExampleLoaded(false);
    setKeywords((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  }, []);

  const addSuggestion = useCallback((word: string) => {
    setExampleLoaded(false);
    setKeywords((prev) => {
      if (prev.some((k) => k.toLowerCase().trim() === word.toLowerCase())) return prev;
      const emptyIndex = prev.findIndex((k, i) => !ANCHOR_SLOTS[i] && !k.trim());
      if (emptyIndex === -1) {
        const anchorOpen = !prev[0].trim() || !prev[1].trim();
        toast({
          title: anchorOpen ? "Only the anchors are open" : "All slots full",
          description: anchorOpen
            ? "The first two slots are your anchor — type what you are and your name by hand."
            : "Clear a slot to add a new keyword.",
        });
        return prev;
      }
      const next = [...prev];
      next[emptyIndex] = word;
      return next;
    });
  }, [toast]);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(story).then(() => {
      toast({ title: "Copied", description: "Your brand story is on the clipboard." });
    });
  }, [story, toast]);

  const handleExportTxt = useCallback(() => {
    const lower = story.toLowerCase();
    const filled = keywords.map((k) => k.trim()).filter(Boolean);
    const lines: string[] = [
      "STORYLINER — BRAND STORY",
      "========================",
      "",
      story.trim() || "(no story yet)",
      "",
      `— ${story.length} / ${MAX_STORY_LENGTH} characters`,
      "",
    ];
    if (filled.length) {
      lines.push("KEYWORDS  ([x] = woven into the story)", "----------------------------------------");
      for (const k of filled) {
        lines.push(`${lower.includes(k.toLowerCase()) ? "[x]" : "[ ]"} ${k}`);
      }
      lines.push("");
    }
    lines.push(`Exported from Storyliner · ${new Date().toLocaleDateString()}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const slug =
      (keywords[1] || "brand")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "brand";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-story.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Saved your brand story as a .txt file." });
  }, [story, keywords, toast]);

  const handleReset = useCallback(() => {
    if (exampleLoaded && preExampleDraft.current) {
      const restored = preExampleDraft.current;
      preExampleDraft.current = null;
      setKeywords([...restored.keywords]);
      setStory(restored.story);
      setExampleLoaded(false);
      toast({
        title: "Your draft is back",
        description: "We brought back the words you had before the example.",
      });
      return;
    }
    preExampleDraft.current = null;
    setKeywords(Array(TOTAL_KEYWORDS).fill(""));
    setStory("");
    setExampleLoaded(false);
    clearDraft();
    setDraftStatus("none");
    toast({ title: "Cleared", description: "A blank page. Begin again." });
  }, [exampleLoaded, toast]);

  const loadExample = useCallback(() => {
    if (exampleLoaded) return;
    const hasContent =
      story.trim().length > 0 || keywords.some((k) => k.trim().length > 0);
    preExampleDraft.current = hasContent ? { story, keywords: [...keywords] } : null;
    setKeywords([...EXAMPLE_KEYWORDS]);
    setStory(EXAMPLE_STORY);
    setExampleLoaded(true);
    toast({
      title: "A perfect example",
      description: hasContent
        ? "Don McLean — your own draft is safe; hit Clear example to bring it back."
        : "Don McLean — anchored, honest, and woven into 150 characters.",
    });
  }, [exampleLoaded, story, keywords, toast]);

  const scrollToWorkshop = useCallback(() => {
    document
      .getElementById("workshop")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const storyPicks = useMemo(
    () => extractStoryKeywords(story, keywords),
    [story, keywords],
  );
  const visibleSuggestions = (suggestMode === "story" ? storyPicks : suggestions)
    .filter((s) => !keywords.some((k) => k.toLowerCase().trim() === s.toLowerCase()))
    .slice(0, 8);

  const leftSlots = [0, 1, 2, 3];
  const rightSlots = [4, 5, 6, 7];

  const renderSlots = (indices: number[]) =>
    indices.map((index) => {
      const match = matchedKeywords.find((m) => m.index === index);
      return (
        <KeywordSlot
          key={index}
          index={index}
          value={keywords[index]}
          matched={!!match?.matched}
          anchor={ANCHOR_SLOTS[index]}
          onChange={(v) => updateKeyword(index, v)}
          onClear={() => clearKeyword(index)}
        />
      );
    });

  return (
    <div className="min-h-screen bg-background">
      {showCelebration && <DancingUnicorns onDismiss={() => setShowCelebration(false)} />}

      {/* Top brand strip */}
      <div className="border-b border-border/60">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-70 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              Storyliner
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
              the foundation
            </span>
          </div>
          <a
            href="https://www.intellectualresistance.com"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-intellectual-resistance"
            className="group flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="hidden sm:inline">A project of</span> intellectual resistance
            <ArrowUpRight className="w-3 h-3 opacity-50 transition-opacity group-hover:opacity-100" />
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero */}
        <header className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center pt-14 pb-12 lg:pt-20 lg:pb-16 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div>
            <Eyebrow>Logic · Reason · A story that shows its work</Eyebrow>
            <h1 className="font-display text-[2.6rem] leading-[1.04] sm:text-6xl font-bold mt-5 text-foreground">
              Before the logo.
              <br />
              Before the domain.
              <br />
              <span className="text-primary">The story.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl">
              This is the part almost everyone skips. A real brand begins with a single,
              deliberate statement — who you are, what you believe, and the exact words a
              stranger would type to find you. We build it the way a Disney writers' room
              engineers a film — a hook, a turn, a payoff — using{" "}
              <span className="text-foreground font-medium">2,500 years of logic</span> from
              Aristotle, compressed into 160 characters.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>160 characters</span>
              <span className="text-border">/</span>
              <span>8 keywords</span>
              <span className="text-border">/</span>
              <span>ethos · pathos · logos</span>
            </div>
            <div className="mt-9">
              <Button
                size="lg"
                onClick={scrollToWorkshop}
                data-testid="button-enter-workshop"
                className="group"
              >
                Enter the workshop
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-primary/10 blur-3xl rounded-full" />
            <img
              src={aristotleImg}
              alt="An engraving of Aristotle framed by the golden ratio"
              data-testid="img-aristotle"
              width={800}
              height={800}
              fetchpriority="high"
              decoding="async"
              className="w-full max-w-md mx-auto rounded-xl border border-border/60 shadow-2xl"
            />
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Aristotle, c. 350 BC — the original story engineer
            </p>
          </div>
        </header>

        <div className="flex justify-center pb-8 -mt-2">
          <button
            type="button"
            onClick={scrollToWorkshop}
            aria-label="Scroll down to the workshop"
            data-testid="button-scroll-workshop"
            className="text-success transition-colors hover:text-success/80 animate-bounce"
          >
            <ChevronDown className="w-7 h-7" />
          </button>
        </div>

        {/* The Window — the workshop */}
        <section id="workshop" className="scroll-mt-6 py-10 border-t border-border/60">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>The window · Write the story</Eyebrow>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mt-4 text-foreground">
                The keywords are the frame. The story is the window.
              </h2>
            </div>
            <Button
              data-testid="button-load-example"
              variant="outline"
              size="sm"
              onClick={loadExample}
              disabled={exampleLoaded}
              className="border-primary/50 text-primary hover:text-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              See a perfect example
            </Button>
          </div>

          {/* Suggestion chips */}
          <Card className="p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
                Suggested keywords
              </span>
              {loadingSuggest && (
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin ml-1" />
              )}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  data-testid="button-suggest-from-story"
                  variant={suggestMode === "story" ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setSuggestMode("story")}
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  From my story
                </Button>
                <Button
                  data-testid="button-suggest-related"
                  variant={suggestMode === "related" ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setSuggestMode("related")}
                >
                  Related words
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">
                  {suggestMode === "related"
                    ? loadingSuggest
                      ? "Finding related words…"
                      : "No related words yet — keep writing."
                    : "Write your story, then these pull straight from your own words."}
                </span>
              ) : (
                visibleSuggestions.map((word) => (
                  <button
                    key={word}
                    type="button"
                    data-testid={`suggestion-${word}`}
                    onClick={() => addSuggestion(word)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm font-medium text-foreground hover-elevate transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                    {word}
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Framed layout: slots | story | slots */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_200px] gap-4 items-stretch">
            <div className="order-2 lg:order-none grid grid-cols-2 lg:grid-cols-1 gap-3">
              {renderSlots(leftSlots)}
            </div>

            <Card
              className={`order-1 lg:order-none p-6 sm:p-7 flex flex-col transition-all duration-500 ${
                isSuccess
                  ? "border-success/60 shadow-[0_0_36px_hsl(150_50%_45%/0.28)]"
                  : "shadow-xl"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-foreground">Your brand story</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  meta-description length
                </span>
              </div>

              <Textarea
                data-testid="textarea-story"
                placeholder="Open with a hook, name the change you bring, land on the payoff — all in one breath."
                value={story}
                onChange={(e) => {
                  setExampleLoaded(false);
                  setStory(e.target.value.slice(0, MAX_STORY_LENGTH));
                }}
                className={`flex-1 min-h-[190px] resize-none text-lg leading-relaxed bg-transparent transition-all duration-300 ${
                  isSuccess ? "border-success/60" : ""
                }`}
              />

              <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  <span
                    data-testid="text-char-count"
                    className={`font-mono text-sm tabular-nums ${
                      story.length >= MAX_STORY_LENGTH ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {story.length} / {MAX_STORY_LENGTH}
                  </span>
                </div>
                {isSuccess && (
                  <Badge className="bg-success text-success-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    The stars aligned
                  </Badge>
                )}
              </div>

              <div className="mt-3" data-testid="meter-length">
                <div className="relative h-1 w-full rounded-full bg-muted">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                      story.length > 120 ? "bg-primary" : "bg-success"
                    }`}
                    style={{
                      width: `${Math.min(100, (story.length / MAX_STORY_LENGTH) * 100)}%`,
                    }}
                  />
                  <div
                    className="absolute -top-1 -bottom-1 w-px bg-foreground/40"
                    style={{ left: `${(120 / MAX_STORY_LENGTH) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span data-testid="text-length-zone">
                    {story.length === 0
                      ? "every character earns its place"
                      : story.length <= 120
                        ? "fits in full on phones"
                        : "full on desktop · phones show ~120"}
                  </span>
                  <span>phone ~120 · desktop ~160</span>
                </div>
              </div>

              <div
                data-testid="status-draft"
                className="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"
              >
                {exampleLoaded ? (
                  <>
                    <Save className="w-3 h-3" />
                    viewing the example · your draft is safe
                  </>
                ) : draftStatus === "restored" ? (
                  <>
                    <Check className="w-3 h-3 text-success" />
                    draft restored from this browser
                  </>
                ) : draftStatus === "saved" ? (
                  <>
                    <Check className="w-3 h-3 text-success" />
                    saved on this device
                  </>
                ) : draftStatus === "failed" ? (
                  <>
                    <TriangleAlert className="w-3 h-3 text-destructive" />
                    couldn't save in this browser — copy your story to be safe
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    saved on this device as you type
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
                <Button
                  data-testid="button-copy"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  disabled={!story.trim()}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  data-testid="button-export-txt"
                  variant="outline"
                  size="sm"
                  onClick={handleExportTxt}
                  disabled={!story.trim()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export .txt
                </Button>
                <Button
                  data-testid="button-save"
                  variant="default"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={!story.trim() || saveMutation.isPending}
                  className={
                    isSuccess && !exampleLoaded
                      ? "animate-pulse-glow ring-2 ring-success/70"
                      : ""
                  }
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                  data-testid="button-reset"
                  variant={exampleLoaded ? "default" : "outline"}
                  size="sm"
                  onClick={handleReset}
                  className={
                    exampleLoaded
                      ? "ring-2 ring-primary/50 shadow-[0_0_18px_hsl(38_92%_50%/0.4)]"
                      : ""
                  }
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {exampleLoaded ? "Clear example" : "Reset"}
                </Button>
              </div>
            </Card>

            <div className="order-3 lg:order-none grid grid-cols-2 lg:grid-cols-1 gap-3">
              {renderSlots(rightSlots)}
            </div>
          </div>

          {/* Live appeals — Aristotle, under glass, updating as you type */}
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Aristotle's appeals · live
              </span>
              <span className="text-[11px] text-muted-foreground/80">
                what your words signal right now
              </span>
            </div>
            <div
              data-testid="live-appeals"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {coach.appeals.map((a) => (
                <div
                  key={a.key}
                  data-testid={`live-appeal-${a.key}`}
                  className="rounded-lg border border-border/60 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{a.label}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                      {a.level === 0 ? "—" : `${a.level}/3`}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${liveAppealColors[a.key]}`}
                      style={{ width: `${a.score}%` }}
                    />
                  </div>
                  <p
                    data-testid={`live-appeal-why-${a.key}`}
                    className="mt-1.5 text-[11px] text-muted-foreground leading-snug"
                  >
                    {a.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stars Aligned — the reality check */}
        <section className="py-12 border-t border-border/60">
          <div className="mb-8 max-w-2xl">
            <Eyebrow>Stars aligned · The reality check</Eyebrow>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-4 text-foreground">
              You don't game search. You face the truth, then tell it clearly.
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Here's the part almost everyone forgets: you don't have to chase keywords. Be
              honestly, publicly who you say you are — at the address you list, reachable for
              exactly what you offer — and everything lines up. Google can simply show you to the
              people already looking. Keywords aren't a bet on the market; they're just you, said
              plainly.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              But honest cuts both ways. The thing you're known for may not be the thing you wish
              you were known for — and that's the reality check. If it's how the world finds you,
              it earns a slot, like it or not. These eight words are the chunks that make you what
              you are. Name them honestly, and you'll rarely think about keywords again.
            </p>
          </div>

          <div
            data-testid="callout-no-cheating"
            className="mb-8 flex gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-5 sm:p-6"
          >
            <div className="flex items-center justify-center w-9 h-9 shrink-0 rounded-md bg-destructive/12 border border-destructive/25">
              <TriangleAlert className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-foreground mb-2">
                The ugly elephant: don't pay anyone to cheat
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is where it gets dangerous. Don't hire a shady PR firm or an SEO "growth"
                shop to game your way up. An AI slop shop will cheat, and cheat, and cheat —
                spinning fake reviews, junk backlinks, and machine-written filler with your name
                on it. Search engines catch it, and when they do, the penalty lands on{" "}
                <em>you</em>: your real listings sink and the internet's memory of your brand gets
                darker, not brighter.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                There's no shortcut around being who you say you are. Tell the truth clearly, and
                let it compound. That's the only growth that doesn't get taken away.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRINCIPLES.map((p) => {
              const Icon = p.icon;
              return (
                <Card
                  key={p.title}
                  data-testid={`principle-${p.title}`}
                  className="p-5 hover-elevate transition-all"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/12 border border-primary/20 mb-4">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Progress + Coach */}
        <section className="py-12 border-t border-border/60 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`p-6 transition-all duration-500 ${isSuccess ? "border-success/60" : ""}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
                  Keywords woven in
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {isSuccess
                    ? "Anchored, honest, and working inside one sentence. The unicorns approve."
                    : `Weave in ${REQUIRED_KEYWORDS - matchedCount} more keyword${
                        REQUIRED_KEYWORDS - matchedCount !== 1 ? "s" : ""
                      } to align the stars.`}
                </p>
              </div>
              <div className="flex items-baseline gap-1 shrink-0">
                <span
                  data-testid="text-matched-count"
                  className={`font-display text-4xl font-bold tabular-nums ${
                    isSuccess ? "text-success" : "text-primary"
                  }`}
                >
                  {matchedCount}
                </span>
                <span className="text-muted-foreground font-mono text-sm">/ {REQUIRED_KEYWORDS}</span>
              </div>
            </div>

            <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isSuccess ? "bg-success" : "bg-primary"
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <span>{filledKeywords} of {TOTAL_KEYWORDS} slots filled</span>
              <span>{matchedCount} in the story</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
              {matchedKeywords.filter((k) => k.keyword.trim()).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Add keywords to the frame, then weave them into your story.
                </p>
              ) : (
                matchedKeywords.map(
                  ({ index, keyword, matched }) =>
                    keyword.trim() && (
                      <Badge
                        key={index}
                        data-testid={`badge-keyword-${index}`}
                        variant={matched ? "default" : "outline"}
                        className={`px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                          matched
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {matched ? (
                          <Check className="w-3 h-3 mr-1.5" />
                        ) : (
                          <X className="w-3 h-3 mr-1.5 opacity-50" />
                        )}
                        {keyword}
                      </Badge>
                    )
                )
              )}
            </div>
          </Card>

          <StoryCoachPanel
            result={coach}
            story={story}
            keywords={keywords.filter((k) => k.trim())}
            aiEnabled={aiEnabled}
            onApplyRewrite={(rewrite) => {
              setExampleLoaded(false);
              setStory(rewrite.slice(0, MAX_STORY_LENGTH));
            }}
          />
        </section>

        {/* The Method */}
        <section className="py-12 border-t border-border/60 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-center">
          <div className="relative order-2 lg:order-none">
            <div className="absolute inset-0 -z-10 bg-primary/10 blur-3xl rounded-full" />
            <img
              src={aristotleImg}
              alt="Engraving of Aristotle"
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className="w-full max-w-xs mx-auto rounded-xl border border-border/60 shadow-xl opacity-95"
            />
          </div>
          <div className="order-1 lg:order-none">
            <Eyebrow>The method · 2,500 years of logic</Eyebrow>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-4 text-foreground">
              Disney didn't invent this. They borrowed it.
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Every story that moves people stands on three appeals and one shape. Your 160
              characters need all of them — even compressed into a single breath.
            </p>
            <div className="mt-6 space-y-4">
              {APPEALS_EXPLAINED.map((a) => (
                <div key={a.label} className="flex gap-4">
                  <div className="shrink-0 w-16 pt-0.5">
                    <span className="font-display text-base font-bold text-primary">{a.label}</span>
                    <span className="block font-serif text-sm text-muted-foreground">{a.greek}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed border-l border-border pl-4">
                    {a.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              + a shape — beginning · middle · end
            </p>
          </div>
        </section>

        <footer className="py-10 border-t border-border/60 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Tiny stories, told with ethos, pathos &amp; logos
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            The foundation you build before everything else.
          </p>

          {/* Lineage — a quiet echo of the Intellectual Resistance corporate tree */}
          <div
            className="mt-8 flex flex-col items-center"
            data-testid="lineage-intellectual-resistance"
          >
            <a
              href="https://www.intellectualresistance.com"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-lineage-parent"
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Intellectual Resistance
              <ArrowUpRight className="w-2.5 h-2.5 opacity-50" />
            </a>
            <span className="my-1.5 h-4 w-px bg-primary/20" aria-hidden="true" />
            <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Storyliner
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
