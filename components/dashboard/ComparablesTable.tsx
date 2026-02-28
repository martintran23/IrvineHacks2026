"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ComparableProperty } from "@/types";

interface Props {
  comparables: ComparableProperty[];
  subjectPpsf?: number | null;
}

export function ComparablesTable({ comparables, subjectPpsf }: Props) {
  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono tracking-wide text-muted-foreground">
          COMPARABLE SALES
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-3 text-muted-foreground font-mono font-normal">Address</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-mono font-normal">Price</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-mono font-normal">Sqft</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-mono font-normal">$/sqft</th>
                <th className="text-right py-2 pl-2 text-muted-foreground font-mono font-normal">Sold</th>
              </tr>
            </thead>
            <tbody>
              {comparables.map((comp, i) => {
                const ppsfDiff = subjectPpsf ? ((subjectPpsf - comp.ppsf) / comp.ppsf) * 100 : null;
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 text-foreground">{comp.address}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-foreground">{formatCurrency(comp.price)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-muted-foreground">{comp.sqft.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-mono">
                      <span className="text-foreground">${comp.ppsf}</span>
                      {ppsfDiff !== null && (
                        <span className={`ml-1 text-[10px] ${ppsfDiff < -5 ? "text-red-400" : ppsfDiff > 5 ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {ppsfDiff > 0 ? "+" : ""}{ppsfDiff.toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pl-2 text-right text-muted-foreground">{comp.soldDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
