import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PredictionResult {
  predictedWaitMinutes?: number;
  confidence?: 'high' | 'medium' | 'low';
  factors?: string[];
  recommendation?: string;
}

interface OptimizationResult {
  suggestions?: { title: string; description: string; impact: 'high' | 'medium' | 'low' }[];
  peakHours?: string[];
  staffingRecommendation?: string;
}

interface CustomerInsights {
  message?: string;
  tip?: string;
  funFact?: string;
}

export const useQueueAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const { toast } = useToast();

  const predictWaitTime = useCallback(async (queueData: {
    queueSize: number;
    avgServiceTime: number;
    servedToday: number;
  }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('queue-ai', {
        body: { type: 'predict_wait_time', queueData }
      });

      if (error) throw error;
      
      setPrediction(data.result);
      return data.result;
    } catch (error: any) {
      console.error('AI prediction error:', error);
      toast({
        title: 'AI Prediction Error',
        description: error.message || 'Failed to get AI prediction',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getOptimizationSuggestions = useCallback(async (queueData: {
    totalWaiting: number;
    servedToday: number;
    avgServiceTime: number;
  }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('queue-ai', {
        body: { type: 'optimize_queue', queueData }
      });

      if (error) throw error;
      
      setOptimization(data.result);
      return data.result;
    } catch (error: any) {
      console.error('AI optimization error:', error);
      toast({
        title: 'AI Optimization Error',
        description: error.message || 'Failed to get optimization suggestions',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getCustomerInsights = useCallback(async (queueData: {
    position: number;
    estimatedWait: number;
  }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('queue-ai', {
        body: { type: 'customer_insights', queueData }
      });

      if (error) throw error;
      
      setInsights(data.result);
      return data.result;
    } catch (error: any) {
      console.error('AI insights error:', error);
      toast({
        title: 'AI Insights Error',
        description: error.message || 'Failed to get customer insights',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    prediction,
    optimization,
    insights,
    predictWaitTime,
    getOptimizationSuggestions,
    getCustomerInsights,
  };
};
