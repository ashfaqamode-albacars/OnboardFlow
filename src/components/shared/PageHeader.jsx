import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PageHeader({ 
  title, 
  description, 
  action, 
  actionLabel, 
  actionIcon: ActionIcon,
  children,
  className 
}) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {description && (
            <p className="text-slate-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {children}
          {action && actionLabel && (
            <Button onClick={action} className="bg-emerald-600 hover:bg-emerald-700">
              {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}