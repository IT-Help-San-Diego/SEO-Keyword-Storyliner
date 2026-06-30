import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Check,
  Circle,
  Lightbulb,
  Sparkles,
  Wand2,
  Search,
  Loader2,
  Copy,
  Info,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CoachResult } from "@/lib/story-coach";

interface StoryCoachPanelProps {
  result: CoachResult;
  story: string;
  keywords: string[];
  aiEnabled: boolean;
  onApplyRewrite: (rewrite: string) => void;
}

const appealColors: Record<string, string> = {
  ethos: "bg-chart-1",
  pathos: "bg-chart-2",
  logos: "bg-success",
};

export function StoryCoachPanel({
  result,
  story,
  keywords,
  aiEnabled,
  onApplyRewrite,
}: StoryCoachPanelProps) {
  const [word, setWord] = useState("");
  const [synonyms, setSynonyms] = useState<string[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const thesaurus = useMutation({
    mutationFn: async (w: string) => {
      const res = await apiRequest("GET", `/api/thesaurus?word=${encodeURIComponent(w)}`);
      return (await res.json()) as { synonyms: string[] };
    },
    onSuccess: (data) => setSynonyms(data.synonyms),
  });

  const aiCoach = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/coach", { story, keywords });
      return (await res.json()) as { tips?: string[]; rewrite?: string };
    },
  });

  const copyWord = (s: string) => {
    navigator.clipboard.writeText(s).then(() => {
      setCopied(s);
      window.setTimeout(() => setCopied((c) => (c === s ? null : c)), 1200);
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Story Coach</h3>
        <span className="hidden sm:inline text-xs text-muted-foreground ml-1">
          Aristotle, in 160 characters
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            title="A rough heuristic from the signals below — a guide, not a grade."
          >
            craft signal
          </span>
          <span
            data-testid="text-craft-score"
            className="font-display text-xl font-bold text-primary tabular-nums"
            title="A rough heuristic from the signals below — a guide, not a grade."
          >
            {result.score}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-5 flex items-start gap-1.5">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        A transparent lens — it shows what it found in your words, not a verdict.
      </p>

      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
          Story Arc
        </p>
        <div className="space-y-2">
          {result.arc.map((beat) => (
            <div
              key={beat.key}
              data-testid={`arc-${beat.key}`}
              className={`flex items-start gap-3 rounded-md p-2.5 transition-colors ${
                beat.present ? "bg-success/10" : "bg-muted/50"
              }`}
            >
              {beat.present ? (
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
              )}
              <div>
                <span
                  className={`text-sm font-medium ${
                    beat.present ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {beat.label}
                </span>
                {beat.present && beat.evidence ? (
                  <p
                    data-testid={`arc-evidence-${beat.key}`}
                    className="text-xs text-success/90"
                  >
                    found: <span className="font-medium">"{beat.evidence}"</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{beat.hint}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
          Aristotle's Appeals
        </p>
        <div className="space-y-3">
          {result.appeals.map((appeal) => (
            <div key={appeal.key} data-testid={`appeal-${appeal.key}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground" title={appeal.blurb}>
                  {appeal.label}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  {appeal.level === 0 ? "no signal" : `${appeal.level}/3`}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${appealColors[appeal.key]}`}
                  style={{ width: `${appeal.score}%` }}
                />
              </div>
              <p
                data-testid={`appeal-why-${appeal.key}`}
                className="text-xs text-muted-foreground mt-1"
              >
                {appeal.why}
              </p>
            </div>
          ))}
        </div>
      </div>

      {result.tips.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Coaching
          </p>
          <ul className="space-y-2">
            {result.tips.map((tip, i) => (
              <li
                key={i}
                data-testid={`tip-${i}`}
                className="text-sm text-foreground/90 flex items-start gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Thesaurus
        </p>
        <p className="text-[11px] text-muted-foreground mb-2">
          Look up a word, then click a result to copy it.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (word.trim()) thesaurus.mutate(word.trim());
          }}
        >
          <Input
            data-testid="input-thesaurus"
            placeholder="Look up a word…"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="h-9"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!word.trim() || thesaurus.isPending}
            data-testid="button-thesaurus"
          >
            {thesaurus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
          </Button>
        </form>
        {synonyms && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {synonyms.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No synonyms found.</span>
            ) : (
              synonyms.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => copyWord(s)}
                  data-testid={`synonym-${s}`}
                  className="group inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground hover-elevate transition-all"
                >
                  {copied === s ? (
                    <Check className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                  {copied === s ? "copied" : s}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" /> AI rewrite
          <span className="normal-case tracking-normal text-[10px] text-muted-foreground/80">
            (optional)
          </span>
        </p>
        {aiEnabled ? (
          <>
            <p className="text-[11px] text-muted-foreground mb-2.5">
              Rewrites your whole story to fit under 160 characters, weaving in your keywords.
            </p>
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={() => aiCoach.mutate()}
              disabled={aiCoach.isPending || !story.trim()}
              data-testid="button-ai-coach"
            >
              {aiCoach.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {aiCoach.isPending ? "Thinking…" : "Get AI rewrite"}
            </Button>
            {aiCoach.data?.tips && aiCoach.data.tips.length > 0 && (
              <ul className="space-y-1.5 mt-3">
                {aiCoach.data.tips.map((t, i) => (
                  <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {aiCoach.data?.rewrite && (
              <div className="mt-3 rounded-md bg-primary/5 border border-primary/20 p-3">
                <p className="text-sm text-foreground italic">"{aiCoach.data.rewrite}"</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => onApplyRewrite(aiCoach.data!.rewrite!.slice(0, 160))}
                  data-testid="button-apply-rewrite"
                >
                  Use this version
                </Button>
              </div>
            )}
            {aiCoach.isError && (
              <p className="text-xs text-destructive mt-2">
                The AI couldn't respond right now. The free Story Coach above still works.
              </p>
            )}
          </>
        ) : (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Wand2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              AI rewrites are turned off right now — the free Story Coach above still does the
              work.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
