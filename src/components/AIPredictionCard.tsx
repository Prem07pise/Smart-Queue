import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueAI } from '@/hooks/useQueueAI';

interface AIPredictionCardProps {
  queueSize: number;
  avgServiceTime: number;
  servedToday: number;
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({
  queueSize,
  avgServiceTime,
  servedToday,
}) => {
  const { isLoading, prediction, predictWaitTime } = useQueueAI();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!hasLoaded && queueSize > 0) {
      predictWaitTime({ queueSize, avgServiceTime, servedToday });
      setHasLoaded(true);
    }
  }, [queueSize, avgServiceTime, servedToday, predictWaitTime, hasLoaded]);

  const handleRefresh = () => {
    predictWaitTime({ queueSize, avgServiceTime, servedToday });
  };

  const confidenceColor = {
    high: 'text-success',
    medium: 'text-warning',
    low: 'text-muted-foreground',
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-info/5 border border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">AI Prediction</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && !prediction ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Analyzing queue...</span>
        </div>
      ) : prediction ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                ~{prediction.predictedWaitMinutes} min
              </p>
              <p className={`text-xs ${confidenceColor[prediction.confidence || 'medium']}`}>
                {prediction.confidence?.toUpperCase()} confidence
              </p>
            </div>
          </div>

          {prediction.factors && prediction.factors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prediction.factors.slice(0, 3).map((factor, i) => (
                <span key={i} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                  {factor}
                </span>
              ))}
            </div>
          )}

          {prediction.recommendation && (
            <div className="flex items-start gap-2 p-2 bg-info/10 rounded-lg">
              <Lightbulb className="w-4 h-4 text-info mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">{prediction.recommendation}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Click refresh to get AI predictions
        </p>
      )}
    </div>
  );
};
