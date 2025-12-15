import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  Play,
  Pause,
  Search,
  QrCode,
  Volume2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminStats } from '@/components/AdminStats';
import { AdminQueueList } from '@/components/AdminQueueList';
import { QRScanner } from '@/components/QRScanner';
import { AIPredictionCard } from '@/components/AIPredictionCard';
import { AIOptimizationPanel } from '@/components/AIOptimizationPanel';
import { useQueue } from '@/context/QueueContext';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { queue, stats, isQueuePaused, callNext, toggleQueuePause, searchQueue } = useQueue();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredQueue, setFilteredQueue] = useState(queue);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update filtered queue when search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredQueue(searchQueue(searchQuery));
    } else {
      setFilteredQueue(queue);
    }
  }, [searchQuery, queue, searchQueue]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = () => {
    const nextCustomer = callNext();
    if (nextCustomer) {
      toast({
        title: 'Calling Next Customer',
        description: `${nextCustomer.name} - ${nextCustomer.queueNumber}`,
      });
    } else if (isQueuePaused) {
      toast({
        title: 'Queue Paused',
        description: 'Resume the queue to call the next customer.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'No Customers Waiting',
        description: 'The queue is empty.',
      });
    }
  };

  const handleTogglePause = () => {
    toggleQueuePause();
    toast({
      title: isQueuePaused ? 'Queue Resumed' : 'Queue Paused',
      description: isQueuePaused
        ? 'New customers can now be called.'
        : 'No new customers will be called until resumed.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Queue Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/analytics')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span className="hidden sm:inline">Updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            {isQueuePaused && (
              <span className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
                Queue Paused
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-6">
          <AdminStats stats={stats} />
        </div>

        {/* AI Prediction Card */}
        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <AIPredictionCard
            queueSize={stats.totalWaiting}
            avgServiceTime={stats.averageServiceTime}
            servedToday={stats.peopleServedToday}
          />
          
          {/* Currently Serving */}
          {stats.currentlyServing && (
            <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary font-medium">Currently Serving</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.currentlyServing.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.currentlyServing.queueNumber} • XXX-XXX-{stats.currentlyServing.phone.slice(-4)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Volume2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Optimization Panel */}
        <div className="mb-6">
          <AIOptimizationPanel
            totalWaiting={stats.totalWaiting}
            servedToday={stats.peopleServedToday}
            avgServiceTime={stats.averageServiceTime}
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={handleCallNext}
            disabled={isQueuePaused}
            className="gap-2 bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
            size="lg"
          >
            <Volume2 className="w-5 h-5" />
            Call Next Customer
          </Button>
          <Button
            onClick={handleTogglePause}
            variant="outline"
            className={`gap-2 ${isQueuePaused ? 'border-success text-success hover:bg-success/10' : 'border-warning text-warning hover:bg-warning/10'}`}
          >
            {isQueuePaused ? (
              <>
                <Play className="w-4 h-4" />
                Resume Queue
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause Queue
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="queue" className="gap-2">
              <Clock className="w-4 h-4" />
              Queue List
            </TabsTrigger>
            <TabsTrigger value="scanner" className="gap-2">
              <QrCode className="w-4 h-4" />
              QR Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or queue number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Queue List */}
            <div className="bg-card rounded-xl border p-4">
              <AdminQueueList items={filteredQueue} />
            </div>
          </TabsContent>

          <TabsContent value="scanner">
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                QR Code Verification
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Scan or upload a customer's QR code to verify their identity and queue status.
              </p>
              <QRScanner />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;