import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, Users, Bell, LogOut, Ticket, AlertTriangle, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QueueItem, useQueue } from '@/context/QueueContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useQueueAI } from '@/hooks/useQueueAI';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface LiveStatusDisplayProps {
  item: QueueItem;
  onShowTicket: () => void;
  onLeaveQueue: () => void;
}

export const LiveStatusDisplay: React.FC<LiveStatusDisplayProps> = ({
  item,
  onShowTicket,
  onLeaveQueue,
}) => {
  const { queue, cancelFromQueue, stats } = useQueue();
  const { toast } = useToast();
  const { isLoading: aiLoading, prediction, predictWaitTime } = useQueueAI();
  const [showAlert, setShowAlert] = useState(false);
  const [lastPosition, setLastPosition] = useState(item.position);
  const [hasFetchedPrediction, setHasFetchedPrediction] = useState(false);

  // Get updated item from queue
  const currentItem = queue.find(q => q.id === item.id);
  
  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const currentPosition = currentItem ? 
    waitingQueue.findIndex(q => q.id === currentItem.id) + 1 : 0;

  const totalWaiting = waitingQueue.length;
  const progressValue = totalWaiting > 0 
    ? ((totalWaiting - currentPosition + 1) / totalWaiting) * 100 
    : 100;

  const isNearFront = currentPosition > 0 && currentPosition <= 3;
  const isCalled = currentItem?.status === 'called';
  const isServing = currentItem?.status === 'serving';

  // Fetch AI prediction for wait time
  useEffect(() => {
    if (currentPosition > 0 && !hasFetchedPrediction && currentItem?.status === 'waiting') {
      predictWaitTime({
        queueSize: totalWaiting,
        avgServiceTime: stats.averageServiceTime,
        servedToday: stats.peopleServedToday,
      });
      setHasFetchedPrediction(true);
    }
  }, [currentPosition, hasFetchedPrediction, currentItem?.status, totalWaiting, stats, predictWaitTime]);

  // Calculate estimated wait - use AI prediction if available, otherwise fallback
  const estimatedWaitMinutes = prediction?.predictedWaitMinutes ?? (currentPosition * 5);

  useEffect(() => {
    if (currentPosition < lastPosition && currentPosition > 0) {
      toast({
        title: 'Position Updated!',
        description: `You moved from #${lastPosition} to #${currentPosition}`,
      });
    }
    setLastPosition(currentPosition);
  }, [currentPosition, lastPosition, toast]);

  useEffect(() => {
    if (isNearFront && !showAlert) {
      setShowAlert(true);
      toast({
        title: "You're Almost Up!",
        description: `You're #${currentPosition} in line. Please get ready!`,
        duration: 10000,
      });
    }
  }, [isNearFront, showAlert, currentPosition, toast]);

  useEffect(() => {
    if (isCalled) {
      toast({
        title: "It's Your Turn!",
        description: 'Please proceed to the counter now.',
        duration: 30000,
      });
    }
  }, [isCalled, toast]);

  const handleLeaveQueue = () => {
    if (currentItem) {
      cancelFromQueue(currentItem.id);
      onLeaveQueue();
    }
  };

  const qrData = JSON.stringify({
    queueNumber: item.queueNumber,
    phone: item.phone,
    timestamp: item.joinedAt,
  });

  if (!currentItem || ['completed', 'cancelled'].includes(currentItem.status)) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          You're no longer in the queue
        </h2>
        <p className="text-muted-foreground mb-6">
          Your queue session has ended or been cancelled.
        </p>
        <Button onClick={onLeaveQueue} className="gap-2">
          Join Queue Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Status Alert */}
      {(isCalled || isServing) && (
        <div className={`p-4 rounded-lg border-2 animate-pulse-ring ${
          isCalled 
            ? 'bg-warning/10 border-warning' 
            : 'bg-primary/10 border-primary'
        }`}>
          <div className="flex items-center gap-3">
            <Bell className={`w-6 h-6 ${isCalled ? 'text-warning' : 'text-primary'}`} />
            <div>
              <p className={`font-semibold ${isCalled ? 'text-warning' : 'text-primary'}`}>
                {isCalled ? "It's Your Turn!" : 'Being Served'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isCalled 
                  ? 'Please proceed to the counter immediately.'
                  : 'Your service is in progress.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Near Front Alert */}
      {isNearFront && !isCalled && !isServing && (
        <div className="p-4 rounded-lg bg-info/10 border border-info/30">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-info" />
            <p className="text-sm font-medium text-info">
              You're almost up! Please be ready.
            </p>
          </div>
        </div>
      )}

      {/* Queue Number Card */}
      <div className="text-center p-6 bg-card rounded-xl border shadow-lg">
        <p className="text-sm text-muted-foreground mb-2">Your Queue Number</p>
        <p className="font-mono text-6xl font-bold text-primary mb-4">
          {item.queueNumber}
        </p>
        <StatusBadge status={currentItem.status} />
      </div>

      {/* Position & Progress */}
      {currentItem.status === 'waiting' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Position</span>
              </div>
              <p className="text-3xl font-bold text-foreground">#{currentPosition}</p>
              <p className="text-xs text-muted-foreground">of {totalWaiting}</p>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                {prediction ? (
                  <Brain className="w-4 h-4 text-primary" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span className="text-sm">{prediction ? 'AI Est.' : 'Est. Wait'}</span>
              </div>
              {aiLoading && !prediction ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground">~{estimatedWaitMinutes}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </>
              )}
              {prediction && (
                <div className="absolute top-1 right-1">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* AI Prediction Details */}
          {prediction && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">AI Prediction</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  prediction.confidence === 'high' 
                    ? 'bg-success/20 text-success' 
                    : prediction.confidence === 'medium'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {prediction.confidence} confidence
                </span>
              </div>
              {prediction.recommendation && (
                <p className="text-xs text-muted-foreground">{prediction.recommendation}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-3" />
          </div>
        </div>
      )}

      {/* QR Code */}
      <div className="flex flex-col items-center p-6 bg-card rounded-xl border">
        <p className="text-sm text-muted-foreground mb-3">Show this when called</p>
        <QRCodeSVG
          value={qrData}
          size={160}
          level="H"
          includeMargin
          className="rounded-lg"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onShowTicket}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Ticket className="w-4 h-4" />
          View Ticket
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4" />
              Leave Queue
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave Queue?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to leave the queue? You'll lose your position and will need to rejoin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLeaveQueue} className="bg-destructive hover:bg-destructive/90">
                Leave Queue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
