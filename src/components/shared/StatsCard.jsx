import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, icon: Icon, trend, trendUp, className, iconClassName }) {
  return (
    <Card className={cn("p-6 border-0 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-800">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              trendUp ? "text-emerald-600" : "text-red-500"
            )}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center",
            iconClassName || "bg-emerald-100"
          )}>
            <Icon className="h-6 w-6 text-emerald-600" />
          </div>
        )}
      </div>
    </Card>
  );
}