import React, { useState } from 'react';
import { User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueue } from '@/context/QueueContext';
import { useToast } from '@/hooks/use-toast';

interface RegistrationFormProps {
  onSuccess: (item: any) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToQueue, findByPhone } = useQueue();
  const { toast } = useToast();

  const validateName = (value: string): string | undefined => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    if (!value.trim()) return 'Phone number is required';
    if (!/^\d+$/.test(value)) return 'Phone number can only contain digits';
    if (value.length !== 10) return 'Phone number must be exactly 10 digits';
    return undefined;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(value);
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: validatePhone(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameError = validateName(name);
    const phoneError = validatePhone(phone);
    
    setErrors({ name: nameError, phone: phoneError });
    
    if (nameError || phoneError) return;

    setIsSubmitting(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const existingItem = findByPhone(phone);
    if (existingItem && ['waiting', 'called', 'serving'].includes(existingItem.status)) {
      // Only treat as duplicate when both name and phone match (case-insensitive)
      if (existingItem.name.trim().toLowerCase() === name.trim().toLowerCase()) {
        toast({
          title: 'Already in Queue',
          description: `Phone number ${phone} is already registered for ${existingItem.name}. Queue number: ${existingItem.queueNumber}`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      // If phone matches but name differs, allow registration (QueueContext now enforces name+phone duplicates)
    }

    const newItem = addToQueue(name.trim(), phone);
    
    if (newItem) {
      toast({
        title: 'Successfully Joined Queue!',
        description: `Your queue number is ${newItem.queueNumber}`,
      });
      onSuccess(newItem);
    } else {
      toast({
        title: 'Error',
        description: 'Unable to join the queue. Please try again.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const isFormValid = !validateName(name) && !validatePhone(phone);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={handleNameChange}
          className={`h-12 text-base ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-foreground flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="Enter 10-digit phone number"
          value={phone}
          onChange={handlePhoneChange}
          className={`h-12 text-base ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.phone}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {phone.length}/10 digits
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-medium gap-2 bg-primary hover:bg-primary/90 shadow-glow-primary"
        disabled={!isFormValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Joining Queue...
          </>
        ) : (
          <>
            Join Queue
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>
    </form>
  );
};
