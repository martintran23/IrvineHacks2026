import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <nav className="border-b border-white/5 px-6 py-3 sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="font-display text-base text-foreground">DealBreakr</span>
            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1 py-0.5 rounded border border-red-500/20">AI</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
          >
            ← New Analysis
          </Link>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/5 px-6 py-3">
        <p className="text-center text-[10px] text-muted-foreground/40 font-mono">
          DealBreakr AI — Not legal or financial advice. Always consult licensed professionals.
        </p>
      </footer>
    </div>
  );
}
