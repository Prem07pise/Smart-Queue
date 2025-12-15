import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QueueItem {
  id: string;
  queueNumber: string;
  name: string;
  phone: string;
  joinedAt: number;
  position: number;
  estimatedWait: number;
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled';
  verificationCode: string;
  verifiedAt: number | null;
  notifiedAt?: number | null;
}

export interface AdminStats {
  totalWaiting: number;
  averageServiceTime: number;
  peopleServedToday: number;
  currentlyServing: { queueNumber: string; name: string; phone: string } | null;
}

interface QueueContextType {
  queue: QueueItem[];
  stats: AdminStats;
  isQueuePaused: boolean;
  addToQueue: (name: string, phone: string) => QueueItem | null;
  removeFromQueue: (id: string) => void;
  callNext: () => QueueItem | null;
  markAsServing: (id: string) => void;
  completeService: (id: string) => void;
  cancelFromQueue: (id: string) => void;
  toggleQueuePause: () => void;
  findByPhone: (phone: string) => QueueItem | undefined;
  findByQueueNumber: (queueNumber: string) => QueueItem | undefined;
  verifyQRCode: (data: { queueNumber: string; phone: string; timestamp: number }) => QueueItem | null;
  getPositionForItem: (id: string) => number;
  searchQueue: (query: string) => QueueItem[];
  notifyCustomer: (id: string) => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const generateQueueNumber = (count: number): string => {
  return `Q${String(count).padStart(3, '0')}`;
};

const generateVerificationCode = (queueNumber: string, phone: string, timestamp: number): string => {
  return JSON.stringify({ queueNumber, phone, timestamp });
};


export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueCounter, setQueueCounter] = useState(1);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [peopleServedToday, setPeopleServedToday] = useState(0);
  const [averageServiceTime, setAverageServiceTime] = useState(5);
  const { toast } = useToast();
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const getWaitingQueue = useCallback(() => {
    return queue.filter(item => item.status === 'waiting');
  }, [queue]);

  const updatePositions = useCallback((items: QueueItem[]): QueueItem[] => {
    let waitingPosition = 1;
    return items.map(item => {
      if (item.status === 'waiting') {
        return {
          ...item,
          position: waitingPosition++,
          estimatedWait: waitingPosition * averageServiceTime,
        };
      }
      return item;
    });
  }, [averageServiceTime]);

  const stats: AdminStats = {
    totalWaiting: getWaitingQueue().length,
    averageServiceTime,
    peopleServedToday,
    currentlyServing: queue.find(item => item.status === 'serving') 
      ? { 
          queueNumber: queue.find(item => item.status === 'serving')!.queueNumber,
          name: queue.find(item => item.status === 'serving')!.name,
          phone: queue.find(item => item.status === 'serving')!.phone,
        }
      : null,
  };

  const addToQueue = useCallback((name: string, phone: string): QueueItem | null => {
    // Treat an existing entry as a duplicate only when both phone and name match
    const existingItem = queue.find(item =>
      item.phone === phone &&
      item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      ['waiting', 'called', 'serving'].includes(item.status)
    );

    if (existingItem) {
      return null;
    }

    const queueNumber = generateQueueNumber(queueCounter);
    const joinedAt = Date.now();
    const waitingCount = getWaitingQueue().length;

    const newItem: QueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      queueNumber,
      name,
      phone,
      joinedAt,
      position: waitingCount + 1,
      estimatedWait: (waitingCount + 1) * averageServiceTime,
      status: 'waiting',
      verificationCode: generateVerificationCode(queueNumber, phone, joinedAt),
      verifiedAt: null,
    };

    setQueue(prev => updatePositions([...prev, newItem]));
    setQueueCounter(prev => prev + 1);
    return newItem;
  }, [queue, queueCounter, averageServiceTime, getWaitingQueue, updatePositions]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => updatePositions(prev.filter(item => item.id !== id)));
  }, [updatePositions]);

  const callNext = useCallback((): QueueItem | null => {
    if (isQueuePaused) return null;
    
    const waitingItems = queue.filter(item => item.status === 'waiting');
    if (waitingItems.length === 0) return null;

    const nextItem = waitingItems[0];
    setQueue(prev => updatePositions(
      prev.map(item => 
        item.id === nextItem.id 
          ? { ...item, status: 'called' as const }
          : item
      )
    ));
    return nextItem;
  }, [queue, isQueuePaused, updatePositions]);

  const markAsServing = useCallback((id: string) => {
    setQueue(prev => updatePositions(
      prev.map(item => 
        item.id === id 
          ? { ...item, status: 'serving' as const, verifiedAt: Date.now() }
          : item
      )
    ));
  }, [updatePositions]);

  const completeService = useCallback((id: string) => {
    setQueue(prev => updatePositions(
      prev.map(item => 
        item.id === id 
          ? { ...item, status: 'completed' as const }
          : item
      )
    ));
    setPeopleServedToday(prev => prev + 1);
  }, [updatePositions]);

  const cancelFromQueue = useCallback((id: string) => {
    setQueue(prev => updatePositions(
      prev.map(item => 
        item.id === id 
          ? { ...item, status: 'cancelled' as const }
          : item
      )
    ));
  }, [updatePositions]);

  const toggleQueuePause = useCallback(() => {
    setIsQueuePaused(prev => !prev);
  }, []);

  const findByPhone = useCallback((phone: string): QueueItem | undefined => {
    return queue.find(item => item.phone === phone);
  }, [queue]);

  const findByQueueNumber = useCallback((queueNumber: string): QueueItem | undefined => {
    return queue.find(item => item.queueNumber === queueNumber);
  }, [queue]);

  const verifyQRCode = useCallback((data: { queueNumber: string; phone: string; timestamp: number }): QueueItem | null => {
    const item = queue.find(
      item => item.queueNumber === data.queueNumber && 
              item.phone === data.phone &&
              ['waiting', 'called'].includes(item.status)
    );
    return item || null;
  }, [queue]);

  const getPositionForItem = useCallback((id: string): number => {
    const waitingItems = queue.filter(item => item.status === 'waiting');
    const index = waitingItems.findIndex(item => item.id === id);
    return index === -1 ? 0 : index + 1;
  }, [queue]);

  const searchQueue = useCallback((query: string): QueueItem[] => {
    const lowerQuery = query.toLowerCase();
    return queue.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.phone.includes(query) ||
      item.queueNumber.toLowerCase().includes(lowerQuery)
    );
  }, [queue]);

  // Temporarily disable external SMS sending to avoid failing Edge Function calls.
  // This will mark the customer as notified locally and show a toast.
  const notifyCustomer = useCallback(async (id: string): Promise<void> => {
    const item = queue.find(q => q.id === id);
    if (!item) return;

    try {
      // Instead of calling the Supabase Edge Function, record notification locally.
      setQueue(prev => prev.map(q => 
        q.id === id ? { ...q, notifiedAt: Date.now() } : q
      ));

      toast({
        title: 'Notification recorded',
        description: `Notification recorded for ${item.name} (SMS disabled).`,
      });
    } catch (error: any) {
      console.error('Failed to record notification:', error);
      toast({
        title: 'Notification Failed',
        description: error?.message || 'Could not record notification',
        variant: 'destructive',
      });
    }
  }, [queue, toast]);

  // Auto-notify customers when they reach top 3 positions
  useEffect(() => {
    const waitingItems = queue.filter(item => item.status === 'waiting');
    const top3 = waitingItems.slice(0, 3);

    top3.forEach(item => {
      // Only notify if not already notified and has a valid phone
      if (!item.notifiedAt && !notifiedIdsRef.current.has(item.id) && item.phone) {
        notifiedIdsRef.current.add(item.id);
        notifyCustomer(item.id);
      }
    });
  }, [queue, notifyCustomer]);

  return (
    <QueueContext.Provider value={{
      queue,
      stats,
      isQueuePaused,
      addToQueue,
      removeFromQueue,
      callNext,
      markAsServing,
      completeService,
      cancelFromQueue,
      toggleQueuePause,
      findByPhone,
      findByQueueNumber,
      verifyQRCode,
      getPositionForItem,
      searchQueue,
      notifyCustomer,
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
