import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Zap, Shield } from 'lucide-react';
import { RegistrationForm } from '@/components/RegistrationForm';
import { QueueTicket } from '@/components/QueueTicket';
import { Button } from '@/components/ui/button';
import { QueueItem } from '@/context/QueueContext';

const Index = () => {
  const navigate = useNavigate();
  const [registeredItem, setRegisteredItem] = useState<QueueItem | null>(null);

  const handleSuccess = (item: QueueItem) => {
    setRegisteredItem(item);
  };

  const handleViewStatus = () => {
    if (registeredItem) {
      navigate(`/status/${registeredItem.id}`);
    }
  };

  const handleNewRegistration = () => {
    setRegisteredItem(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 no-print">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SmartQueue</h1>
              <p className="text-xs text-muted-foreground">Digital Queue System</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="text-sm"
          >
            Admin Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!registeredItem ? (
          <div className="max-w-lg mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero mb-4 shadow-glow-primary">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Join the Queue
              </h2>
              <p className="text-muted-foreground">
                Skip the physical line. Register now and we'll notify you when it's your turn.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-medium text-foreground">Fast & Easy</p>
              </div>
              <div className="text-center p-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-info/10 mb-2">
                  <Clock className="w-5 h-5 text-info" />
                </div>
                <p className="text-xs font-medium text-foreground">Real-time Updates</p>
              </div>
              <div className="text-center p-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 mb-2">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <p className="text-xs font-medium text-foreground">QR Verified</p>
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-card rounded-2xl border shadow-lg p-6">
              <RegistrationForm onSuccess={handleSuccess} />
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Success Message */}
            <div className="text-center mb-6 no-print">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                You're in the Queue!
              </h2>
              <p className="text-muted-foreground">
                Your ticket has been generated. Keep it safe.
              </p>
            </div>

            {/* Ticket */}
            <QueueTicket item={registeredItem} onViewStatus={handleViewStatus} />

            {/* New Registration */}
            <div className="mt-6 text-center no-print">
              <Button
                variant="ghost"
                onClick={handleNewRegistration}
                className="text-muted-foreground"
              >
                Register another person
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12 no-print">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 SmartQueue. Digital Queue Management System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;