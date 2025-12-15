import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity,
  BarChart3,
  Brain,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueue } from '@/context/QueueContext';
import { useQueueAI } from '@/hooks/useQueueAI';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Generate mock historical data for demonstration
const generateHourlyData = () => {
  const hours = [];
  const currentHour = new Date().getHours();
  
  for (let i = 0; i < 12; i++) {
    const hour = (currentHour - 11 + i + 24) % 24;
    const isPeak = hour >= 10 && hour <= 14 || hour >= 17 && hour <= 19;
    hours.push({
      hour: `${hour}:00`,
      customers: Math.floor(Math.random() * 15) + (isPeak ? 20 : 5),
      avgWait: Math.floor(Math.random() * 10) + (isPeak ? 15 : 5),
      served: Math.floor(Math.random() * 12) + (isPeak ? 15 : 3),
    });
  }
  return hours;
};

const generateWeeklyData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    customers: Math.floor(Math.random() * 50) + 30,
    avgWait: Math.floor(Math.random() * 8) + 5,
  }));
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--muted))'];

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { queue, stats } = useQueue();
  const { isLoading, optimization, getOptimizationSuggestions } = useQueueAI();
  const [hourlyData, setHourlyData] = useState(generateHourlyData());
  const [weeklyData] = useState(generateWeeklyData());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Calculate real-time stats from queue
  const waitingCount = queue.filter(q => q.status === 'waiting').length;
  const servingCount = queue.filter(q => q.status === 'serving').length;
  const completedToday = stats.peopleServedToday;
  const avgServiceTime = stats.averageServiceTime;

  // Status distribution for pie chart
  const statusDistribution = [
    { name: 'Waiting', value: queue.filter(q => q.status === 'waiting').length },
    { name: 'Called', value: queue.filter(q => q.status === 'called').length },
    { name: 'Serving', value: queue.filter(q => q.status === 'serving').length },
    { name: 'Completed', value: queue.filter(q => q.status === 'completed').length },
  ].filter(d => d.value > 0);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setHourlyData(generateHourlyData());
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGetAIInsights = () => {
    getOptimizationSuggestions({
      totalWaiting: waitingCount,
      servedToday: completedToday,
      avgServiceTime,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-xs text-muted-foreground">Real-time queue insights</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </p>
            <Button variant="outline" size="sm" onClick={handleGetAIInsights} disabled={isLoading}>
              <Brain className={`w-4 h-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
              AI Insights
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Currently Waiting</p>
                  <p className="text-3xl font-bold text-foreground">{waitingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Being Served</p>
                  <p className="text-3xl font-bold text-foreground">{servingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Served Today</p>
                  <p className="text-3xl font-bold text-foreground">{completedToday}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Wait Time</p>
                  <p className="text-3xl font-bold text-foreground">{avgServiceTime}m</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Hourly Traffic */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hourly Traffic</CardTitle>
              <CardDescription>Customer flow over the last 12 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorCustomers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Wait Time Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wait Time Trends</CardTitle>
              <CardDescription>Average wait times throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgWait" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Weekly Overview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Overview</CardTitle>
              <CardDescription>Customer count by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="customers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
              <CardDescription>Queue status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {statusDistribution.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Panel */}
        {optimization && (
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
              </div>
              <CardDescription>Optimization recommendations based on queue patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optimization.suggestions && optimization.suggestions.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {optimization.suggestions.map((suggestion, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-card rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{suggestion.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          suggestion.impact === 'high' 
                            ? 'bg-success/20 text-success' 
                            : suggestion.impact === 'medium'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {suggestion.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {optimization.peakHours && optimization.peakHours.length > 0 && (
                  <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <h4 className="font-medium text-foreground mb-1">Peak Hours</h4>
                    <p className="text-sm text-muted-foreground">
                      {optimization.peakHours.join(', ')}
                    </p>
                  </div>
                )}

                {optimization.staffingRecommendation && (
                  <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <h4 className="font-medium text-foreground mb-1">Staffing</h4>
                    <p className="text-sm text-muted-foreground">
                      {optimization.staffingRecommendation}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
