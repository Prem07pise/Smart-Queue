import React, { useState } from 'react';
import { Sparkles, TrendingUp, Users, Clock, Lightbulb, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueAI } from '@/hooks/useQueueAI';

interface AIOptimizationPanelProps {
  totalWaiting: number;
  servedToday: number;
  avgServiceTime: number;
}

export const AIOptimizationPanel: React.FC<AIOptimizationPanelProps> = ({
  totalWaiting,
  servedToday,
  avgServiceTime,
}) => {
  const { isLoading, optimization, getOptimizationSuggestions } = useQueueAI();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGetSuggestions = () => {
    getOptimizationSuggestions({ totalWaiting, servedToday, avgServiceTime });
    setIsExpanded(true);
  };

  const impactColor = {
    high: 'bg-success/10 text-success border-success/30',
    medium: 'bg-warning/10 text-warning border-warning/30',
    low: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <div className="p-4 rounded-xl bg-card border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Queue Optimizer</h3>
            <p className="text-xs text-muted-foreground">Get smart recommendations</p>
          </div>
        </div>
        <Button
          onClick={handleGetSuggestions}
          disabled={isLoading}
          size="sm"
          className="gap-1"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Optimize
            </>
          )}
        </Button>
      </div>

      {optimization && isExpanded && (
        <div className="space-y-4 animate-slide-up">
          {/* Suggestions */}
          {optimization.suggestions && optimization.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-1">
                <Lightbulb className="w-4 h-4 text-warning" />
                Suggestions
              </h4>
              {optimization.suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${impactColor[suggestion.impact]}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-background">
                      {suggestion.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Peak Hours */}
          {optimization.peakHours && optimization.peakHours.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Peak Hours</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {optimization.peakHours.map((hour, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    {hour}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Staffing Recommendation */}
          {optimization.staffingRecommendation && (
            <div className="p-3 bg-info/10 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-info" />
                <span className="text-sm font-medium text-foreground">Staffing</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {optimization.staffingRecommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
