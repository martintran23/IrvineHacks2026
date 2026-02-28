"use client";

import { useEffect, useState } from "react";
import { Search, FileSearch, Scale, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const STEPS = [
  { icon: <Search className="w-5 h-5" />, label: "Locating property records…" },
  { icon: <FileSearch className="w-5 h-5" />, label: "Extracting listing claims…" },
  { icon: <Scale className="w-5 h-5" />, label: "Cross-referencing public data…" },
  { icon: <ShieldCheck className="w-5 h-5" />, label: "Evaluating title & ownership…" },
  { icon: <AlertTriangle className="w-5 h-5" />, label: "Identifying contradictions…" },
  { icon: <CheckCircle2 className="w-5 h-5" />, label: "Building your war room…" },
];

export function AnalysisLoading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Animated scanner */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-2 border-red-500/30 rounded-xl" />
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan-line" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-display font-bold text-red-400/80">DB</span>
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-3 max-w-sm w-full">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-500 ${
              i <= step ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            }`}
          >
            <div
              className={`p-1.5 rounded-md transition-colors duration-300 ${
                i < step
                  ? "text-emerald-400 bg-emerald-500/10"
                  : i === step
                  ? "text-red-400 bg-red-500/10"
                  : "text-muted-foreground bg-white/5"
              }`}
            >
              {i < step ? <CheckCircle2 className="w-5 h-5" /> : s.icon}
            </div>
            <span
              className={`text-sm font-mono ${
                i < step ? "text-muted-foreground" : i === step ? "text-foreground" : "text-muted-foreground/40"
              }`}
            >
              {s.label}
            </span>
            {i === step && (
              <span className="ml-auto flex gap-1">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
