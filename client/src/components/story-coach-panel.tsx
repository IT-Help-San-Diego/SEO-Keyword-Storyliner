import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Check,
  Circle,
  Lightbulb,
  Sparkles,
  Wand2,
  Search,
  Loader2,
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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold text-foreground">Story Coach</h3>
        <span className="hidden sm:inline text-xs text-muted-foreground ml-1">
          Aristotle, in 160 characters
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Craft
          </span>
          <span
            data-testid="text-craft-score"
            className="font-display text-xl font-bold text-primary tabular-nums"
          >
            {result.score}
          </span>
        </div>
      </div>

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
                <p className="text-xs text-muted-foreground">{beat.hint}</p>
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
                <span className="text-sm font-medium text-foreground">{appeal.label}</span>
                <span className="text-xs text-muted-foreground">{appeal.blurb}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${appealColors[appeal.key]}`}
                  style={{ width: `${appeal.score}%` }}
                />
              </div>
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
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Word Polish
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
            placeholder="Find a punchier word…"
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
                <Badge
                  key={s}
                  variant="outline"
                  className="text-xs font-normal"
                  data-testid={`synonym-${s}`}
                >
                  {s}
                </Badge>
              ))
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        {aiEnabled ? (
          <>
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
                AI request failed. Check your endpoint settings.
              </p>
            )}
          </>
        ) : (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Wand2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              AI rewrites are off — you're using the free built-in coach. Add a free Gemini key
              or your own LM Studio/Ollama endpoint to turn on AI coaching.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
