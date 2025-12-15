import React from 'react';
import { Clock, Phone, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled';
  className?: string;
}

const statusConfig = {
  waiting: {
    label: 'Waiting',
    icon: Clock,
    className: 'bg-info/15 text-info border-info/30',
  },
  called: {
    label: 'Called',
    icon: Phone,
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  serving: {
    label: 'Serving',
    icon: UserCheck,
    className: 'bg-primary/15 text-primary border-primary/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
      config.className,
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};
