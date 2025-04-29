"use client";

import type { FormEvent } from 'react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from 'lucide-react';

import { createUser } from '@/lib/api/user';

// Define the Zod schema for validation
const loginSchema = z.object({
  rollNumber: z.string().min(1, { message: 'Roll Number is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rollNumber: '',
      name: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    console.log('Login form submitted with:', values);

    try {
      const success = await createUser(values);
      console.log('User creation success:', success);

      if (success) {
        // Store roll number for the next page (consider using state management or localStorage for better persistence)
        sessionStorage.setItem('rollNumber', values.rollNumber);
        router.push('/form'); // Navigate to the dynamic form page
      } else {
         // This case might not be reached if createUser throws on failure, but good practice to handle
         setError('Registration failed. Please try again.');
      }
    } catch (err) {
        console.error('Login error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
        setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <FormField
          control={form.control}
          name="rollNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={field.name}>Roll Number</FormLabel>
              <FormControl>
                <Input
                  id={field.name}
                  placeholder="Enter your Roll Number"
                  {...field}
                  data-testid="rollNumber-input"
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={field.name}>Name</FormLabel>
              <FormControl>
                <Input
                  id={field.name}
                  placeholder="Enter your Name"
                  {...field}
                  data-testid="name-input"
                   aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Login / Register'
          )}
        </Button>
      </form>
    </Form>
  );
}
