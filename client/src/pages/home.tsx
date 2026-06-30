import { useState, useMemo, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { DancingUnicorns } from "@/components/dancing-unicorns";
import { StoryCoachPanel } from "@/components/story-coach-panel";
import { analyzeStory } from "@/lib/story-coach";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import aristotleImg from "@assets/generated_images/aristotle_engraving.png";

const MAX_STORY_LENGTH = 160;
const REQUIRED_KEYWORDS = 6;
const TOTAL_KEYWORDS = 8;

interface AnchorConfig {
  label: string;
  placeholder: string;
  hint: string;
}

const ANCHOR_SLOTS: Record<number, AnchorConfig> = {
  0: {
    label: "Anchor · what",
    placeholder: "what you are + where",
    hint: 'your core category — e.g. "IT support, San Diego"',
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
          {anchor ? anchor.label : String(index + 1).padStart(2, "0")}
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
  const [keywords, setKeywords] = useState<string[]>(Array(TOTAL_KEYWORDS).fill(""));
  const [story, setStory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
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

  useEffect(() => {
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
  }, [story, keywords]);

  const updateKeyword = useCallback((index: number, value: string) => {
    setKeywords((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const clearKeyword = useCallback((index: number) => {
    setKeywords((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  }, []);

  const addSuggestion = useCallback((word: string) => {
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

  const handleReset = useCallback(() => {
    setKeywords(Array(TOTAL_KEYWORDS).fill(""));
    setStory("");
    toast({ title: "Cleared", description: "A blank page. Begin again." });
  }, [toast]);

  const scrollToWorkshop = useCallback(() => {
    document
      .getElementById("workshop")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const visibleSuggestions = suggestions
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
      {isSuccess && <DancingUnicorns />}

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
          <Badge
            variant="outline"
            data-testid="badge-ai-status"
            className={`font-mono text-[10px] uppercase tracking-[0.15em] ${
              aiEnabled ? "border-success/60 text-success" : "text-muted-foreground"
            }`}
          >
            {aiEnabled ? "AI coach · on" : "Free coach"}
          </Badge>
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
          <div className="mb-8">
            <Eyebrow>The window · Write the story</Eyebrow>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-4 text-foreground">
              The keywords are the frame. The story is the window.
            </h2>
          </div>

          {/* Suggestion chips */}
          <Card className="p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
                Suggested keywords
              </span>
              <span className="text-xs text-muted-foreground">
                — click to drop one into an open slot
              </span>
              {loadingSuggest && (
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin ml-1" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">
                  {loadingSuggest ? "Reading your story…" : "Start writing to get tailored suggestions."}
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
                onChange={(e) => setStory(e.target.value.slice(0, MAX_STORY_LENGTH))}
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
                  data-testid="button-save"
                  variant="default"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={!story.trim() || saveMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </Button>
                <Button data-testid="button-reset" variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </Card>

            <div className="order-3 lg:order-none grid grid-cols-2 lg:grid-cols-1 gap-3">
              {renderSlots(rightSlots)}
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
                    ? "Six of eight, working inside one sentence. The unicorns approve."
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
            onApplyRewrite={(rewrite) => setStory(rewrite.slice(0, MAX_STORY_LENGTH))}
          />
        </section>

        {/* The Method */}
        <section className="py-12 border-t border-border/60 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-center">
          <div className="relative order-2 lg:order-none">
            <div className="absolute inset-0 -z-10 bg-primary/10 blur-3xl rounded-full" />
            <img
              src={aristotleImg}
              alt="Engraving of Aristotle"
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
        </footer>
      </div>
    </div>
  );
}
