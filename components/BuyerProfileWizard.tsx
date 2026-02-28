/**
 * components/BuyerProfileWizard.tsx
 *
 * Multi-step wizard for creating a Buyer Match Profile.
 * Accessible-first design with keyboard navigation.
 *
 * 5 steps:
 *  1. Who You Are (situation + household)
 *  2. Accessibility & Disability Needs
 *  3. Budget
 *  4. Must-Haves & Dealbreakers
 *  5. Lifestyle & Space
 *
 * DROP-IN: import { BuyerProfileWizard } from "@/components/BuyerProfileWizard"
 */

"use client";

import { useState, useCallback } from "react";
import {
  User, Users, Accessibility, DollarSign, Heart, Home,
  ArrowRight, ArrowLeft, Check, ChevronDown, X,
  Baby, Glasses, Ear, Brain, Wind, Bone, Clock, Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BuyerProfile,
  BuyerSituation,
  HouseholdMember,
  AccessibilityNeed,
  PropertyFeature,
  CommuteMode,
} from "@/types/buyer-profile";
import {
  BUYER_SITUATION_LABELS,
  HOUSEHOLD_LABELS,
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_PROPERTY_REQS,
  FEATURE_LABELS,
} from "@/types/buyer-profile";

// ─── Props ─────────────────────────────────────────────────────────
interface WizardProps {
  onComplete: (profile: BuyerProfile) => void;
  onSkip?: () => void;
  initialProfile?: Partial<BuyerProfile>;
}

// ─── Default profile ───────────────────────────────────────────────
const DEFAULT_PROFILE: BuyerProfile = {
  situation: "first_time",
  householdMembers: ["solo"],
  householdSize: 1,
  accessibilityNeeds: ["none"],
  accessibilityNotes: "",
  budgetMin: 500000,
  budgetMax: 1000000,
  budgetStretch: 1200000,
  monthlyPaymentMax: 5000,
  mustHaves: [],
  niceToHaves: [],
  dealbreakers: [],
  commuteDestination: "",
  commuteMode: "driving",
  maxCommuteMinutes: 30,
  bedsMin: 2,
  bathsMin: 1,
  sqftMin: 1000,
  prioritizeOutdoorSpace: false,
  hasPets: false,
  petTypes: [],
};

const STEPS = [
  { icon: <User className="w-4 h-4" />, label: "About You" },
  { icon: <Accessibility className="w-4 h-4" />, label: "Accessibility" },
  { icon: <DollarSign className="w-4 h-4" />, label: "Budget" },
  { icon: <Heart className="w-4 h-4" />, label: "Features" },
  { icon: <Home className="w-4 h-4" />, label: "Lifestyle" },
];

export function BuyerProfileWizard({ onComplete, onSkip, initialProfile }: WizardProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<BuyerProfile>({
    ...DEFAULT_PROFILE,
    ...initialProfile,
  });

  const update = useCallback((patch: Partial<BuyerProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => onComplete(profile);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => i <= step && setStep(i)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all",
              i === step && "bg-cyan-400/15 text-cyan-300 border border-cyan-300/30",
              i < step && "text-emerald-400 cursor-pointer hover:bg-emerald-400/10",
              i > step && "text-muted-foreground/40 cursor-default",
            )}
          >
            {i < step ? <Check className="w-3 h-3" /> : s.icon}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
        <div className="flex-1" />
        {onSkip && (
          <button onClick={onSkip} className="text-xs text-muted-foreground/50 hover:text-muted-foreground font-mono transition-colors">
            Skip for now →
          </button>
        )}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 0 && <StepAboutYou profile={profile} update={update} />}
        {step === 1 && <StepAccessibility profile={profile} update={update} />}
        {step === 2 && <StepBudget profile={profile} update={update} />}
        {step === 3 && <StepFeatures profile={profile} update={update} />}
        {step === 4 && <StepLifestyle profile={profile} update={update} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={step === 0}
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={next}
            className="gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 hover:brightness-110"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={finish}
            className="gap-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:brightness-110"
          >
            <Sparkles className="w-4 h-4" /> Generate My Match Profile
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ─── Reusable multi-select chip ────────────────────────────────────
function Chip({
  selected,
  onClick,
  children,
  color = "cyan",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "cyan" | "fuchsia" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    cyan: "border-cyan-300/40 bg-cyan-400/15 text-cyan-200",
    fuchsia: "border-fuchsia-400/40 bg-fuchsia-400/15 text-fuchsia-200",
    emerald: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
    amber: "border-amber-400/40 bg-amber-400/15 text-amber-200",
    rose: "border-rose-400/40 bg-rose-400/15 text-rose-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-lg border text-xs font-mono transition-all text-left",
        selected ? colorMap[color] : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:bg-white/[0.04]",
      )}
    >
      {children}
    </button>
  );
}

// ─── Step 1: About You ─────────────────────────────────────────────
function StepAboutYou({ profile, update }: { profile: BuyerProfile; update: (p: Partial<BuyerProfile>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display text-foreground mb-1">Tell us about yourself</h2>
        <p className="text-sm text-muted-foreground">This helps us evaluate properties from your perspective.</p>
      </div>

      <div>
        <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-3 block">
          What best describes your situation?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(BUYER_SITUATION_LABELS) as [BuyerSituation, string][]).map(([key, label]) => (
            <Chip key={key} selected={profile.situation === key} onClick={() => update({ situation: key })}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-3 block">
          Who will live in this home? (select all)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(HOUSEHOLD_LABELS) as [HouseholdMember, string][]).map(([key, label]) => (
            <Chip
              key={key}
              color="fuchsia"
              selected={profile.householdMembers.includes(key)}
              onClick={() => {
                const current = profile.householdMembers;
                const next = current.includes(key)
                  ? current.filter((m) => m !== key)
                  : [...current, key];
                update({ householdMembers: next.length > 0 ? next : ["solo"] });
              }}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">
          Total people in household
        </label>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => update({ householdSize: n })}
              className={cn(
                "w-10 h-10 rounded-lg border text-sm font-mono transition-all",
                profile.householdSize === n
                  ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-200"
                  : "border-white/10 text-muted-foreground hover:border-white/20",
              )}
            >
              {n}{n === 8 ? "+" : ""}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Accessibility ─────────────────────────────────────────
function StepAccessibility({ profile, update }: { profile: BuyerProfile; update: (p: Partial<BuyerProfile>) => void }) {
  const iconMap: Partial<Record<AccessibilityNeed, React.ReactNode>> = {
    wheelchair_full: <Accessibility className="w-3.5 h-3.5" />,
    wheelchair_occasional: <Accessibility className="w-3.5 h-3.5" />,
    mobility_limited: <Bone className="w-3.5 h-3.5" />,
    visual_impairment: <Glasses className="w-3.5 h-3.5" />,
    hearing_impairment: <Ear className="w-3.5 h-3.5" />,
    sensory_sensitivity: <Brain className="w-3.5 h-3.5" />,
    chronic_fatigue: <Clock className="w-3.5 h-3.5" />,
    respiratory: <Wind className="w-3.5 h-3.5" />,
    cognitive: <Brain className="w-3.5 h-3.5" />,
    child_disability: <Baby className="w-3.5 h-3.5" />,
    aging_in_place: <Shield className="w-3.5 h-3.5" />,
  };

  const selectedNeeds = profile.accessibilityNeeds.filter((n) => n !== "none");
  const hasNeeds = selectedNeeds.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display text-foreground mb-1">Accessibility & Disability Needs</h2>
        <p className="text-sm text-muted-foreground">
          We'll flag properties that don't meet your needs and suggest modifications.
          Select all that apply to anyone in your household.
        </p>
      </div>

      <div>
        <div className="grid grid-cols-1 gap-2">
          {/* "None" option first */}
          <Chip
            selected={!hasNeeds}
            color="emerald"
            onClick={() => update({ accessibilityNeeds: ["none"] })}
          >
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              <span>No specific accessibility needs</span>
            </div>
          </Chip>

          {/* All needs except "none" */}
          {(Object.entries(ACCESSIBILITY_LABELS) as [AccessibilityNeed, string][])
            .filter(([key]) => key !== "none" && key !== "temporary_injury")
            .map(([key, label]) => (
              <Chip
                key={key}
                color="amber"
                selected={selectedNeeds.includes(key as typeof selectedNeeds[number])}
                onClick={() => {
                  let next: AccessibilityNeed[];
                  if (selectedNeeds.includes(key as typeof selectedNeeds[number])) {
                    next = selectedNeeds.filter((n) => n !== key);
                    if (next.length === 0) next = ["none"];
                  } else {
                    next = [...selectedNeeds, key];
                  }
                  update({ accessibilityNeeds: next });
                }}
              >
                <div className="flex items-center gap-2">
                  {iconMap[key] || <Accessibility className="w-3.5 h-3.5" />}
                  <span>{label}</span>
                </div>
              </Chip>
            ))}
        </div>
      </div>

      {/* Show what we'll look for based on selections */}
      {hasNeeds && (
        <div className="p-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04]">
          <p className="text-[10px] font-mono text-amber-300/70 uppercase tracking-wider mb-2">
            What we'll check for you
          </p>
          <div className="space-y-1">
            {selectedNeeds.slice(0, 3).flatMap((need) =>
              (ACCESSIBILITY_PROPERTY_REQS[need] || []).slice(0, 2).map((req, i) => (
                <p key={`${need}-${i}`} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">→</span> {req}
                </p>
              ))
            )}
            {selectedNeeds.length > 3 && (
              <p className="text-xs text-muted-foreground/50">
                + more requirements for {selectedNeeds.length - 3} additional needs
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">
          Anything else we should know? (optional)
        </label>
        <textarea
          value={profile.accessibilityNotes}
          onChange={(e) => update({ accessibilityNotes: e.target.value })}
          placeholder="E.g., 'My daughter uses a power wheelchair and needs a ceiling track hoist in her bedroom' or 'I need a home that can be adapted as my MS progresses'..."
          rows={3}
          className="w-full p-3 cyber-panel rounded-xl text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-amber-300/40 resize-none"
        />
      </div>
    </div>
  );
}

// ─── Step 3: Budget ────────────────────────────────────────────────
function StepBudget({ profile, update }: { profile: BuyerProfile; update: (p: Partial<BuyerProfile>) => void }) {
  const formatK = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display text-foreground mb-1">What's your budget?</h2>
        <p className="text-sm text-muted-foreground">We'll flag properties outside your range and estimate real costs.</p>
      </div>

      {[
        { label: "Minimum Budget", key: "budgetMin" as const, desc: "Won't consider homes below this" },
        { label: "Comfortable Maximum", key: "budgetMax" as const, desc: "Your preferred ceiling" },
        { label: "Absolute Stretch", key: "budgetStretch" as const, desc: "Only if it's perfect" },
      ].map(({ label, key, desc }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider">{label}</label>
            <span className="text-sm font-mono text-cyan-300">{formatK(profile[key])}</span>
          </div>
          <input
            type="range"
            min={100000}
            max={5000000}
            step={25000}
            value={profile[key]}
            onChange={(e) => update({ [key]: parseInt(e.target.value) })}
            className="w-full accent-cyan-400 h-2 rounded-full appearance-none bg-white/10 cursor-pointer"
          />
          <p className="text-[10px] text-muted-foreground/40 mt-1">{desc}</p>
        </div>
      ))}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider">
            Max Monthly Payment
          </label>
          <span className="text-sm font-mono text-cyan-300">${profile.monthlyPaymentMax.toLocaleString()}/mo</span>
        </div>
        <input
          type="range"
          min={1000}
          max={20000}
          step={250}
          value={profile.monthlyPaymentMax}
          onChange={(e) => update({ monthlyPaymentMax: parseInt(e.target.value) })}
          className="w-full accent-cyan-400 h-2 rounded-full appearance-none bg-white/10 cursor-pointer"
        />
        <p className="text-[10px] text-muted-foreground/40 mt-1">Including mortgage, taxes, insurance, and HOA</p>
      </div>
    </div>
  );
}

// ─── Step 4: Features ──────────────────────────────────────────────
function StepFeatures({ profile, update }: { profile: BuyerProfile; update: (p: Partial<BuyerProfile>) => void }) {
  // Auto-suggest must-haves based on accessibility needs
  const suggestedMustHaves: PropertyFeature[] = [];
  if (profile.accessibilityNeeds.some(n => ["wheelchair_full", "wheelchair_occasional", "mobility_limited"].includes(n))) {
    suggestedMustHaves.push("single_story", "wide_doorways", "accessible_bathroom", "no_step_entry");
  }
  if (profile.accessibilityNeeds.includes("aging_in_place")) {
    suggestedMustHaves.push("single_story", "near_medical");
  }
  if (profile.accessibilityNeeds.includes("sensory_sensitivity")) {
    suggestedMustHaves.push("quiet_street");
  }
  if (profile.accessibilityNeeds.includes("respiratory")) {
    suggestedMustHaves.push("central_ac");
  }

  const toggleFeature = (list: "mustHaves" | "niceToHaves" | "dealbreakers", feat: PropertyFeature) => {
    const current = profile[list];
    // Remove from other lists first
    const otherLists = (["mustHaves", "niceToHaves", "dealbreakers"] as const).filter(l => l !== list);
    const patches: Partial<BuyerProfile> = {};
    for (const other of otherLists) {
      if (profile[other].includes(feat)) {
        patches[other] = profile[other].filter(f => f !== feat);
      }
    }
    // Toggle in current list
    patches[list] = current.includes(feat) ? current.filter(f => f !== feat) : [...current, feat];
    update(patches);
  };

  const getFeatureStatus = (feat: PropertyFeature) => {
    if (profile.mustHaves.includes(feat)) return "must";
    if (profile.niceToHaves.includes(feat)) return "nice";
    if (profile.dealbreakers.includes(feat)) return "deal";
    return "none";
  };

  // Group features
  const groups = [
    { label: "Accessibility", features: ["single_story", "elevator", "wide_doorways", "accessible_bathroom", "roll_in_shower", "no_step_entry", "flat_lot", "laundry_main_floor"] as PropertyFeature[] },
    { label: "Space & Outdoors", features: ["garage", "yard", "pool", "home_office", "guest_suite"] as PropertyFeature[] },
    { label: "Location", features: ["good_schools", "walkable", "near_transit", "near_medical", "near_grocery", "quiet_street", "gated_community"] as PropertyFeature[] },
    { label: "Property Type", features: ["new_construction", "central_ac", "solar", "ev_charging", "low_maintenance", "pet_friendly", "low_hoa", "no_hoa"] as PropertyFeature[] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display text-foreground mb-1">What matters to you?</h2>
        <p className="text-sm text-muted-foreground">
          Click once for <span className="text-emerald-400">must-have</span>,
          twice for <span className="text-cyan-300">nice-to-have</span>,
          three times for <span className="text-rose-400">dealbreaker</span> (avoid).
        </p>
      </div>

      {/* Auto-suggested based on accessibility */}
      {suggestedMustHaves.length > 0 && (
        <div className="p-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04]">
          <p className="text-[10px] font-mono text-amber-300/70 uppercase tracking-wider mb-2">
            Suggested based on your accessibility needs
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedMustHaves.filter(f => !profile.mustHaves.includes(f)).map((feat) => (
              <button
                key={feat}
                onClick={() => toggleFeature("mustHaves", feat)}
                className="px-2 py-1 rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-200 text-xs font-mono hover:bg-amber-400/20 transition-colors"
              >
                + {FEATURE_LABELS[feat]}
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-2">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.features.map((feat) => {
              const status = getFeatureStatus(feat);
              return (
                <button
                  key={feat}
                  onClick={() => {
                    if (status === "none") toggleFeature("mustHaves", feat);
                    else if (status === "must") { update({ mustHaves: profile.mustHaves.filter(f => f !== feat) }); toggleFeature("niceToHaves", feat); }
                    else if (status === "nice") { update({ niceToHaves: profile.niceToHaves.filter(f => f !== feat) }); toggleFeature("dealbreakers", feat); }
                    else { update({ dealbreakers: profile.dealbreakers.filter(f => f !== feat) }); }
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all",
                    status === "must" && "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
                    status === "nice" && "border-cyan-300/40 bg-cyan-400/15 text-cyan-200",
                    status === "deal" && "border-rose-400/40 bg-rose-400/15 text-rose-200",
                    status === "none" && "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20",
                  )}
                >
                  {status === "must" && "✓ "}
                  {status === "nice" && "○ "}
                  {status === "deal" && "✕ "}
                  {FEATURE_LABELS[feat]}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="flex gap-4 text-[10px] font-mono text-muted-foreground/50">
        <span className="text-emerald-400">{profile.mustHaves.length} must-haves</span>
        <span className="text-cyan-300">{profile.niceToHaves.length} nice-to-haves</span>
        <span className="text-rose-400">{profile.dealbreakers.length} dealbreakers</span>
      </div>
    </div>
  );
}

// ─── Step 5: Lifestyle ─────────────────────────────────────────────
function StepLifestyle({ profile, update }: { profile: BuyerProfile; update: (p: Partial<BuyerProfile>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display text-foreground mb-1">Space & Lifestyle</h2>
        <p className="text-sm text-muted-foreground">Help us size up properties against your daily life.</p>
      </div>

      {/* Bed/Bath/Sqft */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">Min Beds</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => update({ bedsMin: n })}
                className={cn(
                  "flex-1 h-10 rounded-lg border text-sm font-mono transition-all",
                  profile.bedsMin === n ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-200" : "border-white/10 text-muted-foreground hover:border-white/20",
                )}
              >
                {n}+
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">Min Baths</label>
          <div className="flex gap-1">
            {[1, 1.5, 2, 2.5, 3].map((n) => (
              <button
                key={n}
                onClick={() => update({ bathsMin: n })}
                className={cn(
                  "flex-1 h-10 rounded-lg border text-xs font-mono transition-all",
                  profile.bathsMin === n ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-200" : "border-white/10 text-muted-foreground hover:border-white/20",
                )}
              >
                {n}+
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">Min Sqft</label>
          <input
            type="number"
            value={profile.sqftMin || ""}
            onChange={(e) => update({ sqftMin: parseInt(e.target.value) || 0 })}
            placeholder="1000"
            className="w-full h-10 px-3 cyber-panel rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          />
        </div>
      </div>

      {/* Commute */}
      <div>
        <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">
          Commute destination (optional)
        </label>
        <input
          type="text"
          value={profile.commuteDestination}
          onChange={(e) => update({ commuteDestination: e.target.value })}
          placeholder="e.g., UCI, Downtown LA, remote..."
          className="w-full h-10 px-3 cyber-panel rounded-lg text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">Commute mode</label>
          <div className="grid grid-cols-2 gap-1">
            {(["driving", "transit", "remote", "wheelchair_accessible_transit"] as CommuteMode[]).map((mode) => (
              <Chip
                key={mode}
                selected={profile.commuteMode === mode}
                onClick={() => update({ commuteMode: mode })}
              >
                {mode === "wheelchair_accessible_transit" ? "Accessible Transit" : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 block">
            Max commute: {profile.maxCommuteMinutes} min
          </label>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={profile.maxCommuteMinutes}
            onChange={(e) => update({ maxCommuteMinutes: parseInt(e.target.value) })}
            className="w-full accent-cyan-400 h-2 rounded-full appearance-none bg-white/10 cursor-pointer"
          />
        </div>
      </div>

      {/* Pets */}
      <div className="flex items-center gap-4">
        <Chip selected={profile.hasPets} color="fuchsia" onClick={() => update({ hasPets: !profile.hasPets })}>
          🐾 I have pets
        </Chip>
        {profile.hasPets && (
          <input
            type="text"
            value={profile.petTypes.join(", ")}
            onChange={(e) => update({ petTypes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="e.g., dog (large), 2 cats"
            className="flex-1 h-10 px-3 cyber-panel rounded-lg text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/40"
          />
        )}
      </div>

      <Chip
        selected={profile.prioritizeOutdoorSpace}
        color="emerald"
        onClick={() => update({ prioritizeOutdoorSpace: !profile.prioritizeOutdoorSpace })}
      >
        🌳 Outdoor space is a priority for me
      </Chip>
    </div>
  );
}
