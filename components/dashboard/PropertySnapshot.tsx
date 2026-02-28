"use client";

import { Bed, Bath, Ruler, TreePine, Calendar, Car, Building, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { PropertySnapshot as SnapshotType } from "@/types";

interface Props {
  snapshot: SnapshotType;
  address: string;
  listPrice?: number | null;
}

export function PropertySnapshot({ snapshot, address, listPrice }: Props) {
  const stats = [
    { icon: <Bed className="w-4 h-4" />, label: "Beds", value: snapshot.beds ?? "—" },
    { icon: <Bath className="w-4 h-4" />, label: "Baths", value: snapshot.baths ?? "—" },
    { icon: <Ruler className="w-4 h-4" />, label: "Sq Ft", value: formatNumber(snapshot.sqft) },
    { icon: <TreePine className="w-4 h-4" />, label: "Lot", value: snapshot.lotSqft ? `${formatNumber(snapshot.lotSqft)} sqft` : "—" },
    { icon: <Calendar className="w-4 h-4" />, label: "Year Built", value: snapshot.yearBuilt ?? "—" },
    { icon: <Car className="w-4 h-4" />, label: "Garage", value: snapshot.garage ?? "—" },
    { icon: <Building className="w-4 h-4" />, label: "HOA", value: snapshot.hoa ? `${formatCurrency(snapshot.hoa)}/mo` : "None" },
    { icon: <Landmark className="w-4 h-4" />, label: "Assessed", value: formatCurrency(snapshot.taxAssessedValue) },
  ];

  return (
    <Card className="cyber-panel">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-display">{address}</CardTitle>
            {snapshot.zoning && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">{snapshot.zoning}</p>
            )}
          </div>
          {listPrice && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(listPrice)}</p>
              {snapshot.sqft && (
                <p className="text-xs text-muted-foreground font-mono">
                  {formatCurrency(Math.round(listPrice / snapshot.sqft))}/sqft
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center p-2 rounded-md bg-cyan-500/[0.06] border border-cyan-300/15">
              <div className="text-muted-foreground mb-1">{stat.icon}</div>
              <p className="text-xs font-medium text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Last sale info */}
        {snapshot.lastSalePrice && (
          <div className="mt-3 pt-3 border-t border-cyan-300/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>Last Sold</span>
            <span className="font-mono">
              {formatCurrency(snapshot.lastSalePrice)} on {snapshot.lastSaleDate ?? "unknown"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
