"use client";

import { MessageCircleQuestion, FileText, Search, AlertCircle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActionItemProps {
  category: "question" | "document" | "inspection";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
}

const CATEGORY_CONFIG = {
  question: { icon: <MessageCircleQuestion className="w-4 h-4" />, label: "Ask", color: "text-sky-400" },
  document: { icon: <FileText className="w-4 h-4" />, label: "Request", color: "text-violet-400" },
  inspection: { icon: <Search className="w-4 h-4" />, label: "Inspect", color: "text-amber-400" },
};

const PRIORITY_CONFIG = {
  critical: { icon: <AlertCircle className="w-3 h-3" />, bg: "bg-red-500/15 text-red-400 border-red-500/30", label: "Critical" },
  high: { icon: <ArrowUp className="w-3 h-3" />, bg: "bg-orange-500/15 text-orange-400 border-orange-500/30", label: "High" },
  medium: { icon: <ArrowRight className="w-3 h-3" />, bg: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Medium" },
  low: { icon: <ArrowDown className="w-3 h-3" />, bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Low" },
};

export function ActionItemCard({ category, priority, title, description }: ActionItemProps) {
  const cat = CATEGORY_CONFIG[category];
  const pri = PRIORITY_CONFIG[priority];

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.02]",
      priority === "critical" && "border-red-500/20 animate-pulse-glow",
      priority !== "critical" && "border-white/10",
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-md bg-white/5", cat.color)}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] gap-1", pri.bg)}>
              {pri.icon}
              {pri.label}
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              {cat.label}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
