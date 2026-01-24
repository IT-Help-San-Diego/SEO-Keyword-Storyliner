import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface KeywordBadgeProps {
  keyword: string;
  matched: boolean;
  index: number;
}

export function KeywordBadge({ keyword, matched, index }: KeywordBadgeProps) {
  return (
    <Badge
      data-testid={`badge-keyword-${index}`}
      variant={matched ? "default" : "outline"}
      className={`
        px-3 py-1.5 text-sm font-medium transition-all duration-300
        ${matched 
          ? "bg-success text-success-foreground border-success" 
          : "bg-muted/50 text-muted-foreground border-muted-foreground/20"
        }
      `}
    >
      {matched ? (
        <Check className="w-3 h-3 mr-1.5" />
      ) : (
        <X className="w-3 h-3 mr-1.5 opacity-50" />
      )}
      {keyword}
    </Badge>
  );
}
