import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Pencil, Copy, Save, RotateCcw } from "lucide-react";
import { DancingUnicorns } from "@/components/dancing-unicorns";
import { KeywordBadge } from "@/components/keyword-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const MAX_STORY_LENGTH = 160;
const REQUIRED_KEYWORDS = 6;
const TOTAL_KEYWORDS = 8;

export default function Home() {
  const [keywords, setKeywords] = useState<string[]>(Array(TOTAL_KEYWORDS).fill(""));
  const [story, setStory] = useState("");
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!story.trim()) {
        throw new Error("Story is required");
      }
      if (story.length > MAX_STORY_LENGTH) {
        throw new Error(`Story must be ${MAX_STORY_LENGTH} characters or less`);
      }
      return apiRequest("POST", "/api/stories", { keywords, story });
    },
    onSuccess: () => {
      toast({
        title: "Story saved!",
        description: "Your brand story has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save your story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(story).then(() => {
      toast({
        title: "Copied!",
        description: "Your brand story has been copied to clipboard.",
      });
    });
  }, [story, toast]);

  const handleReset = useCallback(() => {
    setKeywords(Array(TOTAL_KEYWORDS).fill(""));
    setStory("");
    toast({
      title: "Reset complete",
      description: "All fields have been cleared.",
    });
  }, [toast]);

  const updateKeyword = useCallback((index: number, value: string) => {
    setKeywords(prev => {
      const newKeywords = [...prev];
      newKeywords[index] = value;
      return newKeywords;
    });
  }, []);

  const matchedKeywords = useMemo(() => {
    const storyLower = story.toLowerCase();
    return keywords.map((keyword, index) => {
      if (!keyword.trim()) return { index, keyword, matched: false };
      const keywordLower = keyword.toLowerCase().trim();
      const matched = storyLower.includes(keywordLower);
      return { index, keyword, matched };
    });
  }, [keywords, story]);

  const matchedCount = useMemo(() => 
    matchedKeywords.filter(k => k.matched).length,
  [matchedKeywords]);

  const filledKeywords = useMemo(() => 
    keywords.filter(k => k.trim()).length,
  [keywords]);

  const isSuccess = matchedCount >= REQUIRED_KEYWORDS;
  const progressPercentage = (matchedCount / REQUIRED_KEYWORDS) * 100;

  const getProgressColor = () => {
    if (isSuccess) return "bg-success";
    if (matchedCount >= 4) return "bg-warning";
    if (matchedCount >= 2) return "bg-secondary";
    return "bg-primary";
  };

  const getBorderGlow = () => {
    if (isSuccess) return "shadow-[0_0_30px_hsl(160_84%_39%/0.4)]";
    if (matchedCount >= 4) return "shadow-[0_0_20px_hsl(38_92%_50%/0.3)]";
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      {isSuccess && <DancingUnicorns />}
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Storyliner
            </h1>
            <Sparkles className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Craft your perfect brand story with SEO keywords. Enter your brand keywords below, 
            then write a story that incorporates at least 6 of them.
          </p>
        </header>

        <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">1</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Brand Keywords</h2>
            <span className="text-sm text-muted-foreground ml-2">
              ({filledKeywords} of {TOTAL_KEYWORDS} filled)
            </span>
          </div>
          
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {keywords.map((keyword, index) => {
                const match = matchedKeywords.find(m => m.index === index);
                return (
                  <div key={index} className="relative">
                    <Input
                      data-testid={`input-keyword-${index}`}
                      placeholder={`Keyword ${index + 1}`}
                      value={keyword}
                      onChange={(e) => updateKeyword(index, e.target.value)}
                      className={`transition-all duration-300 ${
                        match?.matched 
                          ? "border-success ring-2 ring-success/20 bg-success/5" 
                          : ""
                      }`}
                    />
                    <div 
                      className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                        match?.matched ? "opacity-100 scale-100" : "opacity-0 scale-0"
                      }`}
                    >
                      <Check className="w-4 h-4 text-success" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
              <span className="text-secondary-foreground font-semibold text-sm">2</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Your Brand Story</h2>
            <span className="text-sm text-muted-foreground ml-2">
              (SERP description length)
            </span>
          </div>

          <Card 
            className={`p-6 transition-all duration-500 ${getBorderGlow()} ${
              isSuccess ? "bg-gradient-to-br from-success/5 to-success/10 border-success" : ""
            }`}
          >
            <div className="relative">
              <Textarea
                data-testid="textarea-story"
                placeholder="Write your brand story here. Try to naturally incorporate your keywords to create a compelling description that works for SEO..."
                value={story}
                onChange={(e) => setStory(e.target.value.slice(0, MAX_STORY_LENGTH))}
                className={`min-h-[160px] resize-none text-base transition-all duration-300 ${
                  isSuccess ? "border-success" : ""
                }`}
              />
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                  <span className={`text-sm font-medium ${
                    story.length >= MAX_STORY_LENGTH ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {story.length}/{MAX_STORY_LENGTH} characters
                  </span>
                </div>
                <div className={`transition-all duration-300 ${isSuccess ? "opacity-100" : "opacity-0"}`}>
                  <Badge className="bg-success text-success-foreground">
                    <Check className="w-3 h-3 mr-1" />
                    SEO Optimized
                  </Badge>
                </div>
              </div>
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
                Copy Story
              </Button>
              <Button
                data-testid="button-save"
                variant="default"
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={!story.trim() || saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save Story"}
              </Button>
              <Button
                data-testid="button-reset"
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </Card>
        </section>

        <section className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Card className={`p-6 transition-all duration-500 ${isSuccess ? "border-success bg-success/5" : ""}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Keyword Progress
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isSuccess 
                    ? "Congratulations! Your story is SEO-optimized!" 
                    : `Use ${REQUIRED_KEYWORDS - matchedCount} more keyword${REQUIRED_KEYWORDS - matchedCount !== 1 ? 's' : ''} to complete your story`
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold transition-colors duration-300 ${isSuccess ? "text-success" : "text-primary"}`}>
                  {matchedCount}
                </span>
                <span className="text-muted-foreground text-lg">/ {REQUIRED_KEYWORDS}</span>
              </div>
            </div>

            <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-6">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {matchedKeywords.map(({ index, keyword, matched }) => (
                keyword.trim() && (
                  <KeywordBadge 
                    key={index} 
                    keyword={keyword} 
                    matched={matched}
                    index={index}
                  />
                )
              ))}
              {filledKeywords === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Enter keywords above to track them here
                </p>
              )}
            </div>
          </Card>
        </section>

        <footer className="mt-12 text-center animate-in fade-in duration-500 delay-500">
          <p className="text-sm text-muted-foreground">
            Inspired by Hemingway Editor's real-time feedback
          </p>
        </footer>
      </div>
    </div>
  );
}
