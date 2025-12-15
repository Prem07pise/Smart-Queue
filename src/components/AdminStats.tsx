import React from 'react';
import { Users, Clock, CheckCircle, UserCheck } from 'lucide-react';
import { AdminStats as AdminStatsType } from '@/context/QueueContext';

interface AdminStatsProps {
  stats: AdminStatsType;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Waiting */}
      <div className="p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.totalWaiting}</p>
            <p className="text-sm text-muted-foreground">Waiting</p>
          </div>
        </div>
      </div>

      {/* Currently Serving */}
      <div className="p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.currentlyServing?.queueNumber || '—'}
            </p>
            <p className="text-sm text-muted-foreground">Serving</p>
          </div>
        </div>
      </div>

      {/* Average Wait */}
      <div className="p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.averageServiceTime}m</p>
            <p className="text-sm text-muted-foreground">Avg. Service</p>
          </div>
        </div>
      </div>

      {/* Served Today */}
      <div className="p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.peopleServedToday}</p>
            <p className="text-sm text-muted-foreground">Served Today</p>
          </div>
        </div>
      </div>
    </div>
  );
};
