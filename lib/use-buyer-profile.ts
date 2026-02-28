/**
 * lib/use-buyer-profile.ts
 *
 * React hook for loading, saving, and checking if a buyer
 * profile exists. Uses localStorage for hackathon simplicity.
 *
 * DROP-IN: import { useBuyerProfile } from "@/lib/use-buyer-profile"
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { BuyerProfile } from "@/types/buyer-profile";

const STORAGE_KEY = "dealbreakr_buyer_profile";

export function useBuyerProfile() {
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Save
  const saveProfile = useCallback((p: BuyerProfile) => {
    setProfile(p);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Clear
  const clearProfile = useCallback(() => {
    setProfile(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return {
    profile,
    hasProfile: profile !== null,
    loaded,
    saveProfile,
    clearProfile,
  };
}
