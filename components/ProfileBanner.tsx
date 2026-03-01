/**
 * components/ProfileBanner.tsx
 *
 * Contextual banner that appears:
 * - On landing page: "Create your buyer profile for personalized matching"
 * - On results page: "Your profile is active — see your fit score below"
 * - Compact pill showing profile status
 *
 * DROP-IN: import { ProfileBanner, ProfilePill } from "@/components/ProfileBanner"
 */

"use client";

import Link from "next/link";
import {
  User, Sparkles, Accessibility, ArrowRight, Settings, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuyerProfile } from "@/lib/use-buyer-profile";
import { BUYER_SITUATION_LABELS, ACCESSIBILITY_LABELS } from "@/types/buyer-profile";

/** Full banner for the landing page */
export function ProfileBanner() {
  const { profile, hasProfile, loaded } = useBuyerProfile();

  if (!loaded) return null;

  if (hasProfile && profile) {
    const accessNeeds = profile.accessibilityNeeds.filter(n => n !== "none");
    return (
      <div className="max-w-xl w-full mx-auto mb-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04]">
          <div className="p-1.5 rounded-md bg-emerald-400/15">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-300">
              Profile Active — {BUYER_SITUATION_LABELS[profile.situation]}
              {accessNeeds.length > 0 && (
                <span className="text-emerald-400/60 ml-1">
                  · {accessNeeds.length} accessibility need{accessNeeds.length > 1 ? "s" : ""}
                </span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
              Every analysis will be personalized to your needs
            </p>
          </div>
          <Link
            href="/profile"
            className="text-[10px] font-mono text-emerald-400/60 hover:text-emerald-400 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto mb-6">
      <Link href="/profile">
        <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-fuchsia-400/15 bg-fuchsia-400/[0.03] hover:border-fuchsia-400/30 hover:bg-fuchsia-400/[0.06] transition-all cursor-pointer">
          <div className="p-1.5 rounded-md bg-fuchsia-400/15">
            <Sparkles className="w-4 h-4 text-fuchsia-300" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-fuchsia-200">
              Create your Buyer Profile for personalized matching
            </p>
            <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">
              Accessibility needs · Budget · Must-haves · Lifestyle
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-fuchsia-400/40 group-hover:text-fuchsia-300 transition-colors" />
        </div>
      </Link>
    </div>
  );
}

/** Compact pill for nav bars */
export function ProfilePill() {
  const { profile, hasProfile, loaded } = useBuyerProfile();

  if (!loaded) return null;

  if (hasProfile && profile) {
    const accessNeeds = profile.accessibilityNeeds.filter(n => n !== "none");
    return (
      <Link
        href="/profile"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] hover:bg-emerald-400/[0.12] transition-all"
      >
        <User className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-mono text-emerald-300">Profile</span>
        {accessNeeds.length > 0 && (
          <Accessibility className="w-3 h-3 text-amber-400" />
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-fuchsia-400/15 bg-fuchsia-400/[0.04] hover:bg-fuchsia-400/[0.08] transition-all"
    >
      <Sparkles className="w-3 h-3 text-fuchsia-300" />
      <span className="text-[10px] font-mono text-fuchsia-200">Create Profile</span>
    </Link>
  );
}
