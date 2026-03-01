import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ProfilePill } from "@/components/ProfileBanner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <nav className="border-b border-cyan-300/15 px-6 py-3 sticky top-0 z-50 bg-background/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-cyan-400/15 border border-cyan-300/30 flex items-center justify-center cyber-glow">
              <AlertTriangle className="w-3.5 h-3.5 text-cyan-300" />
            </div>
            <span className="font-display text-base text-foreground tracking-[0.1em]">DealBreakr</span>
            <span className="text-[9px] font-mono bg-fuchsia-500/10 text-fuchsia-300 px-1 py-0.5 rounded border border-fuchsia-400/30">AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <ProfilePill />
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              [ New Analysis ]
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-cyan-300/10 px-6 py-3">
        <p className="text-center text-[10px] text-muted-foreground/40 font-mono">
          DealBreakr AI — Not legal or financial advice. Always consult licensed professionals.
        </p>
      </footer>
    </div>
  );
}
