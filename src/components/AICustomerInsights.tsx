import React, { useEffect, useState } from 'react';
import { Sparkles, MessageCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueAI } from '@/hooks/useQueueAI';

interface AICustomerInsightsProps {
  position: number;
  estimatedWait: number;
}

export const AICustomerInsights: React.FC<AICustomerInsightsProps> = ({
  position,
  estimatedWait,
}) => {
  const { isLoading, insights, getCustomerInsights } = useQueueAI();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!hasLoaded && position > 0) {
      getCustomerInsights({ position, estimatedWait });
      setHasLoaded(true);
    }
  }, [position, estimatedWait, getCustomerInsights, hasLoaded]);

  const handleRefresh = () => {
    getCustomerInsights({ position, estimatedWait });
  };

  if (isLoading && !insights) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Getting insights...</span>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-foreground">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-7 w-7"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {insights.message && (
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{insights.message}</p>
          </div>
        )}

        {insights.tip && (
          <div className="p-3 bg-info/10 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-info mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-info">Waiting Tip</p>
                <p className="text-sm text-foreground mt-0.5">{insights.tip}</p>
              </div>
            </div>
          </div>
        )}

        {insights.funFact && (
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-xs font-medium text-accent mb-1">Fun Fact</p>
            <p className="text-sm text-foreground">{insights.funFact}</p>
          </div>
        )}
      </div>
    </div>
  );
};
