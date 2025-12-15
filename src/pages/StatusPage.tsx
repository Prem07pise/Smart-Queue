import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveStatusDisplay } from '@/components/LiveStatusDisplay';
import { QueueTicket } from '@/components/QueueTicket';
import { AICustomerInsights } from '@/components/AICustomerInsights';
import { useQueue } from '@/context/QueueContext';

const StatusPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { queue } = useQueue();
  const [showTicket, setShowTicket] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const item = queue.find(q => q.id === id);
  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const currentPosition = item 
    ? waitingQueue.findIndex(q => q.id === item.id) + 1 
    : 0;

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLeaveQueue = () => {
    navigate('/');
  };

  const handleShowTicket = () => {
    setShowTicket(true);
  };

  const handleBackToStatus = () => {
    setShowTicket(false);
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Queue item not found</h2>
          <p className="text-muted-foreground mb-4">This queue entry may have been removed.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={showTicket ? handleBackToStatus : () => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SmartQueue</h1>
                <p className="text-xs text-muted-foreground">
                  {showTicket ? 'Your Ticket' : 'Live Status'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium text-foreground">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md">
        {showTicket ? (
          <QueueTicket item={item} onViewStatus={handleBackToStatus} />
        ) : (
          <div className="space-y-6">
            <LiveStatusDisplay
              item={item}
              onShowTicket={handleShowTicket}
              onLeaveQueue={handleLeaveQueue}
            />
            
            {/* AI Insights for waiting customers */}
            {item.status === 'waiting' && currentPosition > 0 && (
              <AICustomerInsights 
                position={currentPosition} 
                estimatedWait={currentPosition * 5} 
              />
            )}

            {/* AI message for being served */}
            {(item.status === 'serving' || item.status === 'called') && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-primary/10 border border-success/30 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <span className="text-lg">🎉</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {item.status === 'called' ? "You're up next!" : "Being served"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.status === 'called' 
                        ? 'Please proceed to the counter now.' 
                        : 'Thank you for your patience. We hope you have a great experience!'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StatusPage;