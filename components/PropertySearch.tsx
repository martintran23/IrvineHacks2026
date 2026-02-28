"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Home, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PropertySearchResult {
  address: string;
  listPrice?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  distance?: number;
  listingText?: string;
  propertyType?: string;
}

interface PropertySearchProps {
  onSelectProperty: (property: PropertySearchResult) => void;
  initialAddress?: string;
  onAddressChange?: (address: string) => void;
}

export function PropertySearch({ onSelectProperty, initialAddress = "", onAddressChange }: PropertySearchProps) {
  const [query, setQuery] = useState(initialAddress);
  
  // Sync with parent when initialAddress changes
  useEffect(() => {
    if (initialAddress !== query) {
      setQuery(initialAddress);
    }
  }, [initialAddress]);
  const [results, setResults] = useState<PropertySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for properties when query changes
  useEffect(() => {
    if (query.length < 5) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?address=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.properties) {
          setResults(data.properties);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  function handleSelect(property: PropertySearchResult) {
    onSelectProperty(property);
    setQuery(property.address);
    setShowResults(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showResults || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            setSelectedIndex(-1);
            onAddressChange?.(newValue);
          }}
          onFocus={() => query.length >= 5 && results.length > 0 && setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Enter address or search area (e.g., 'Irvine, CA')…"
          className="w-full h-14 pl-12 pr-12 cyber-panel rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-cyan-300/40 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#070f24]/95 border border-cyan-300/25 rounded-xl shadow-2xl max-h-[400px] overflow-y-auto backdrop-blur-xl">
          <div className="p-2">
            <div className="text-[10px] font-mono text-muted-foreground/60 px-3 py-2 uppercase tracking-wider">
              Found {results.length} properties nearby
            </div>
            {results.map((property, index) => (
              <button
                key={index}
                onClick={() => handleSelect(property)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedIndex === index
                    ? "bg-cyan-500/10 border border-cyan-300/30"
                    : "bg-white/[0.02] border border-transparent hover:bg-fuchsia-500/[0.08]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-cyan-400/10 border border-cyan-300/20">
                    <Home className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {property.address}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {property.listPrice && (
                        <span className="text-xs font-mono text-fuchsia-300">
                          {formatCurrency(property.listPrice)}
                        </span>
                      )}
                      {property.beds && property.baths && (
                        <span className="text-xs text-muted-foreground">
                          {property.beds}BR / {property.baths}BA
                        </span>
                      )}
                      {property.sqft && (
                        <span className="text-xs text-muted-foreground">
                          {property.sqft.toLocaleString()} sqft
                        </span>
                      )}
                      {property.distance && (
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.distance.toFixed(1)} mi
                        </span>
                      )}
                    </div>
                    {property.listingText && (
                      <p className="text-xs text-muted-foreground/60 mt-1.5 line-clamp-1">
                        {property.listingText}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && results.length === 0 && !loading && query.length >= 5 && (
        <div className="absolute z-50 w-full mt-2 bg-[#070f24]/95 border border-cyan-300/25 rounded-xl p-4 text-center backdrop-blur-xl">
          <p className="text-sm text-muted-foreground">No properties found nearby</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Try a different address or area
          </p>
        </div>
      )}
    </div>
  );
}
