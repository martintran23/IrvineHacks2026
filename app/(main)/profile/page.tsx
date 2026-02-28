/**
 * app/(main)/profile/page.tsx
 *
 * Buyer Match Profile creation page.
 * Users can fill this out before analyzing properties,
 * or they'll be prompted when viewing results.
 *
 * The profile is stored in localStorage (hackathon-simple)
 * and passed to the fit engine + Claude on every analysis.
 *
 * DROP-IN: create this file at app/(main)/profile/page.tsx
 */

"use client";

import { useRouter } from "next/navigation";
import { BuyerProfileWizard } from "@/components/BuyerProfileWizard";
import type { BuyerProfile } from "@/types/buyer-profile";

export default function ProfilePage() {
  const router = useRouter();

  function handleComplete(profile: BuyerProfile) {
    // Store in localStorage (hackathon approach — no extra DB needed)
    if (typeof window !== "undefined") {
      localStorage.setItem("dealbreakr_buyer_profile", JSON.stringify(profile));
    }
    // Redirect back to home with a success param
    router.push("/?profile=saved");
  }

  function handleSkip() {
    router.push("/");
  }

  // Load existing profile if any
  let existingProfile: Partial<BuyerProfile> | undefined;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("dealbreakr_buyer_profile");
      if (saved) existingProfile = JSON.parse(saved);
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
          <span className="text-xs font-mono text-fuchsia-200">Personalized Matching</span>
        </div>
        <h1 className="text-3xl font-display text-foreground mb-2">
          Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-300">Buyer Profile</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Tell us about your needs, budget, and lifestyle. We'll match every property
          against your profile and flag accessibility concerns automatically.
        </p>
      </div>

      <BuyerProfileWizard
        onComplete={handleComplete}
        onSkip={handleSkip}
        initialProfile={existingProfile}
      />
    </div>
  );
}
