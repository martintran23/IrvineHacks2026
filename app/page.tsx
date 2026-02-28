"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, AlertTriangle, FileWarning, Shield, Zap, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertySearch } from "@/components/PropertySearch";

// Static example addresses for "Try an example" — no mock analysis; clicking runs real analysis
const EXAMPLE_PROPERTIES = [
  {
    address: "42 Shadowridge, Irvine, CA 92618",
    listingText: "Beautiful 4BR/3BA home in Irvine. 2,450 sqft of living space.",
    listPrice: 1100000,
  },
  {
    address: "518 Jasmine Ave, Costa Mesa, CA 92627",
    listingText: "Well-maintained 3BR/2BA in Costa Mesa. Move-in ready.",
    listPrice: 1050000,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [listingText, setListingText] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(overrideAddress?: string, overrideText?: string, overridePrice?: number) {
    const addr = overrideAddress || address;
    if (!addr || addr.length < 5) {
      setError("Please enter a valid property address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addr,
          listingText: overrideText || listingText || undefined,
          listPrice: overridePrice || (listPrice ? parseFloat(listPrice) : undefined),
        }),
      });

      let data: { error?: string; details?: string; id?: string };
      try {
        data = await res.json();
      } catch {
        data = { error: res.status === 500 ? "Server error" : "Request failed" };
      }

      if (!res.ok) {
        const message = data.details ?? data.error ?? "Analysis failed";
        setError(typeof message === "string" ? message : "Analysis failed");
        setLoading(false);
        return;
      }

      router.push(`/results/${data.id}`);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-cyan-300/15 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-cyan-400/15 border border-cyan-300/30 flex items-center justify-center cyber-glow">
              <AlertTriangle className="w-4 h-4 text-cyan-300" />
            </div>
            <span className="font-display text-lg text-foreground tracking-[0.1em]">DealBreakr</span>
            <span className="text-[10px] font-mono bg-fuchsia-500/10 text-fuchsia-300 px-1.5 py-0.5 rounded border border-fuchsia-400/30">AI</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono hidden sm:block">
            Built for IrvineHacks 2026
          </p>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center mb-12">
          {/* Decorative badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 mb-6 cyber-glow">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="text-xs font-mono text-cyan-200">Neural Due Diligence Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-foreground leading-[1.1] mb-4">
            Cross-examine any listing
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-300">before you trust it.</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Paste an address. We extract every claim, check it against public records,
            and build you a buyer war room with questions, docs to request, and inspection priorities.
          </p>
        </div>

        {/* Search form */}
        <div className="max-w-xl w-full">
          <div className="relative">
            <div className="pr-36">
              <PropertySearch
                initialAddress={address}
                onAddressChange={(newAddress) => setAddress(newAddress)}
                onSelectProperty={(property) => {
                  setAddress(property.address);
                  if (property.listPrice) {
                    setListPrice(property.listPrice.toString());
                  }
                  if (property.listingText) {
                    setListingText(property.listingText);
                  }
                  // Auto-analyze when a property is selected
                  setTimeout(() => {
                    handleAnalyze(property.address, property.listingText, property.listPrice);
                  }, 100);
                }}
              />
            </div>
            <Button
              onClick={() => handleAnalyze()}
              disabled={loading || !address || address.length < 5}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:brightness-110 text-slate-950 gap-2 z-10 border border-cyan-200/40 cyber-glow"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Analyze <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="text-xs text-rose-300 mt-2 text-center font-mono">{error}</p>
          )}

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground mt-3 font-mono block mx-auto transition-colors"
          >
            {showAdvanced ? "— Hide options" : "+ Paste listing text & price"}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-3 animate-fade-up" style={{ animationDuration: "0.3s" }}>
              <textarea
                value={listingText}
                onChange={(e) => setListingText(e.target.value)}
                placeholder="Paste the listing description here (optional)…"
                rows={4}
                className="w-full p-4 cyber-panel rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 resize-none"
              />
              <input
                type="text"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="List price (e.g. 1100000)"
                className="w-full h-11 px-4 cyber-panel rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
              />
            </div>
          )}
        </div>

        {/* Example properties */}
        <div className="max-w-xl w-full mt-12">
          <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em] text-center mb-4">
            Try an example
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLE_PROPERTIES.map((prop, idx) => (
              <button
                key={idx}
                onClick={() => handleAnalyze(prop.address, prop.listingText, prop.listPrice)}
                disabled={loading}
                className="group text-left p-4 rounded-xl border border-cyan-300/15 bg-cyan-500/[0.04] hover:border-fuchsia-400/35 hover:bg-fuchsia-500/[0.08] transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-300" />
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    Click to analyze
                  </span>
                </div>
                <p className="text-sm text-foreground font-medium">{prop.address}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {prop.listingText?.slice(0, 100)}…
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/50 group-hover:text-fuchsia-300 transition-colors">
                  <Zap className="w-3 h-3" />
                  <span className="font-mono">Analyze this property</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl w-full mt-20 mb-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <FileWarning className="w-5 h-5 text-cyan-300" />, title: "Claim Extraction", desc: "Every listing claim is identified, categorized, and tagged with a verdict." },
            { icon: <Shield className="w-5 h-5 text-fuchsia-300" />, title: "Evidence Cross-Check", desc: "Claims are compared against property records, comps, permits, and public data." },
            { icon: <AlertTriangle className="w-5 h-5 text-amber-300" />, title: "Buyer War Room", desc: "Get questions to ask, documents to request, and inspection priorities." },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-xl cyber-panel">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-display text-base text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-300/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] text-muted-foreground/40 font-mono">
          <span>DealBreakr AI © 2026</span>
          <span>Disclaimer: Not legal or financial advice. Always consult professionals.</span>
        </div>
      </footer>
    </div>
  );
}
