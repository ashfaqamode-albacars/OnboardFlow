import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, AlertCircle, Truck } from 'lucide-react';

const statusConfig = {
  pending: { 
    label: 'Pending', 
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock
  },
  approved: { 
    label: 'Approved', 
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2
  },
  rejected: { 
    label: 'Rejected', 
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle
  },
  completed: { 
    label: 'Completed', 
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle2
  },
  in_progress: { 
    label: 'In Progress', 
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock
  },
  overdue: { 
    label: 'Overdue', 
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle
  },
  delivered: { 
    label: 'Delivered', 
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Truck
  },
  not_started: { 
    label: 'Not Started', 
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Clock
  },
};

export default function StatusBadge({ status, showIcon = true }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn("font-medium gap-1.5", config.className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}