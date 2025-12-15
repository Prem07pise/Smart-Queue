import React from 'react';
import { Clock, Phone, User, MoreVertical, CheckCircle, XCircle, UserCheck, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QueueItem, useQueue } from '@/context/QueueContext';

interface AdminQueueListProps {
  items: QueueItem[];
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const maskPhone = (phone: string): string => {
  if (phone.length >= 10) {
    return `XXX-XXX-${phone.slice(-4)}`;
  }
  return phone;
};

export const AdminQueueList: React.FC<AdminQueueListProps> = ({ items }) => {
  const { markAsServing, completeService, cancelFromQueue, removeFromQueue, notifyCustomer } = useQueue();

  const activeItems = items.filter(item => 
    ['waiting', 'called', 'serving'].includes(item.status)
  );

  if (activeItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No customers in queue</h3>
        <p className="text-muted-foreground">Queue is empty. Waiting for new customers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeItems.map((item, index) => (
        <div
          key={item.id}
          className={`p-4 rounded-lg border transition-all ${
            item.status === 'serving' 
              ? 'bg-primary/5 border-primary/30 shadow-glow-primary' 
              : item.status === 'called'
              ? 'bg-warning/5 border-warning/30'
              : 'bg-card hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Queue Number */}
              <div className="text-center min-w-[60px]">
                <p className="font-mono text-2xl font-bold text-primary">
                  {item.queueNumber}
                </p>
                {item.status === 'waiting' && (
                  <p className="text-xs text-muted-foreground">#{item.position}</p>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-12 bg-border" />

              {/* Customer Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{maskPhone(item.phone)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeAgo(item.joinedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={item.status} />

              {/* Action Buttons */}
              {item.status === 'called' && (
                <Button
                  size="sm"
                  onClick={() => markAsServing(item.id)}
                  className="gap-1.5 bg-primary hover:bg-primary/90"
                >
                  <UserCheck className="w-4 h-4" />
                  Serve
                </Button>
              )}

              {item.status === 'serving' && (
                <Button
                  size="sm"
                  onClick={() => completeService(item.id)}
                  className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {item.status === 'waiting' && (
                    <>
                      <DropdownMenuItem onClick={() => notifyCustomer(item.id)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send SMS Notification
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => markAsServing(item.id)}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Mark as Serving
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => cancelFromQueue(item.id)}
                    className="text-warning"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel (No-show)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => removeFromQueue(item.id)}
                    className="text-destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove from Queue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
