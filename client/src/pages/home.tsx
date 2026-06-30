import { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Check,
  Pencil,
  Copy,
  Save,
  RotateCcw,
  Plus,
  X,
  Zap,
  Loader2,
} from "lucide-react";
import { DancingUnicorns } from "@/components/dancing-unicorns";
import { StoryCoachPanel } from "@/components/story-coach-panel";
import { analyzeStory } from "@/lib/story-coach";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const MAX_STORY_LENGTH = 160;
const REQUIRED_KEYWORDS = 6;
const TOTAL_KEYWORDS = 8;

interface KeywordSlotProps {
  index: number;
  value: string;
  matched: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}

function KeywordSlot({ index, value, matched, onChange, onClear }: KeywordSlotProps) {
  const filled = value.trim().length > 0;
  return (
    <div
      data-testid={`slot-keyword-${index}`}
      className={`relative rounded-lg border p-2.5 transition-all duration-300 ${
        matched
          ? "border-success bg-success/10 shadow-[0_0_14px_hsl(160_84%_39%/0.25)]"
          : filled
            ? "border-border bg-card"
            : "border-dashed border-border bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Slot {index + 1}
        </span>
        {matched ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : filled ? (
          <button
            type="button"
            onClick={onClear}
            data-testid={`button-clear-slot-${index}`}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Plus className="w-3.5 h-3.5 text-muted-foreground/40" />
        )}
      </div>
      <Input
        data-testid={`input-keyword-${index}`}
        placeholder="keyword"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0 ${
          matched ? "text-success" : ""
        }`}
      />
    </div>
  );
}

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
      toast({ title: "Story saved!", description: "Your brand story has been saved successfully." });
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
      const emptyIndex = prev.findIndex((k) => !k.trim());
      if (emptyIndex === -1) {
        toast({
          title: "All slots full",
          description: "Clear a slot to add a new keyword.",
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
      toast({ title: "Copied!", description: "Your brand story has been copied to clipboard." });
    });
  }, [story, toast]);

  const handleReset = useCallback(() => {
    setKeywords(Array(TOTAL_KEYWORDS).fill(""));
    setStory("");
    toast({ title: "Reset complete", description: "All fields have been cleared." });
  }, [toast]);

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
          onChange={(v) => updateKeyword(index, v)}
          onClear={() => clearKeyword(index)}
        />
      );
    });

  return (
    <div className="min-h-screen bg-background">
      {isSuccess && <DancingUnicorns />}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-7 h-7 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Storyliner
            </h1>
            <Sparkles className="w-7 h-7 text-secondary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Build a tiny, compressed story about your brand — a beginning, a middle, and an end in
            160 characters. The keywords are the frame; the story is the window.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge
              variant="outline"
              data-testid="badge-ai-status"
              className={`text-xs font-normal ${aiEnabled ? "border-success text-success" : ""}`}
            >
              <Zap className="w-3 h-3 mr-1" />
              {aiEnabled ? "AI coach: on" : "Free coach"}
            </Badge>
          </div>
        </header>

        <section className="mb-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold text-foreground">Suggested keywords</span>
              <span className="text-xs text-muted-foreground">
                — click to drop into an open slot
              </span>
              {loadingSuggest && (
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin ml-1" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.length === 0 ? (
                <span className="text-sm text-muted-foreground italic">
                  {loadingSuggest ? "Finding ideas…" : "Start writing to get tailored suggestions."}
                </span>
              ) : (
                visibleSuggestions.map((word) => (
                  <button
                    key={word}
                    type="button"
                    data-testid={`suggestion-${word}`}
                    onClick={() => addSuggestion(word)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground hover-elevate transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                    {word}
                  </button>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)_210px] gap-4 items-stretch mb-6">
          <div className="order-2 lg:order-none grid grid-cols-2 lg:grid-cols-1 gap-3">
            {renderSlots(leftSlots)}
          </div>

          <Card
            className={`order-1 lg:order-none p-6 flex flex-col transition-all duration-500 ${
              isSuccess
                ? "border-success bg-gradient-to-br from-success/5 to-success/10 shadow-[0_0_30px_hsl(160_84%_39%/0.35)]"
                : "shadow-lg"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Your Brand Story</h2>
              <span className="text-xs text-muted-foreground">SERP description length</span>
            </div>

            <Textarea
              data-testid="textarea-story"
              placeholder="Open with a hook, hint at the change you bring, and land on the payoff — all in one breath."
              value={story}
              onChange={(e) => setStory(e.target.value.slice(0, MAX_STORY_LENGTH))}
              className={`flex-1 min-h-[180px] resize-none text-lg leading-relaxed transition-all duration-300 ${
                isSuccess ? "border-success" : ""
              }`}
            />

            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-muted-foreground" />
                <span
                  data-testid="text-char-count"
                  className={`text-sm font-medium ${
                    story.length >= MAX_STORY_LENGTH ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {story.length}/{MAX_STORY_LENGTH}
                </span>
              </div>
              {isSuccess && (
                <Badge className="bg-success text-success-foreground">
                  <Check className="w-3 h-3 mr-1" />
                  SEO Optimized
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
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
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`p-6 transition-all duration-500 ${isSuccess ? "border-success bg-success/5" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Keyword Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {isSuccess
                    ? "Your story is SEO-optimized — the unicorns approve!"
                    : `Weave in ${REQUIRED_KEYWORDS - matchedCount} more keyword${
                        REQUIRED_KEYWORDS - matchedCount !== 1 ? "s" : ""
                      } to celebrate.`}
                </p>
              </div>
              <div className="flex items-baseline gap-1 shrink-0">
                <span
                  data-testid="text-matched-count"
                  className={`text-3xl font-bold ${isSuccess ? "text-success" : "text-primary"}`}
                >
                  {matchedCount}
                </span>
                <span className="text-muted-foreground">/ {REQUIRED_KEYWORDS}</span>
              </div>
            </div>

            <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isSuccess ? "bg-success" : matchedCount >= 4 ? "bg-warning" : "bg-primary"
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {filledKeywords} of {TOTAL_KEYWORDS} slots filled
              </span>
              <span className="text-muted-foreground">{matchedCount} appearing in story</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
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
                            ? "bg-success text-success-foreground border-success"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {matched ? <Check className="w-3 h-3 mr-1.5" /> : <X className="w-3 h-3 mr-1.5 opacity-50" />}
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

        <footer className="mt-10 text-center animate-in fade-in duration-500">
          <p className="text-sm text-muted-foreground">
            Tiny stories, told with ethos, pathos &amp; logos.
          </p>
        </footer>
      </div>
    </div>
  );
}
