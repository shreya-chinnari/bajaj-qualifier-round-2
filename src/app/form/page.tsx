'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DynamicForm } from '@/components/dynamic-form';
import { Form, FormSection, getForm } from '@/lib/api/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export default function FormPage() {
  const [formStructure, setFormStructure] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const rollNumber = sessionStorage.getItem('rollNumber');
    if (!rollNumber) {
      console.warn('Roll number not found in session storage, redirecting to login.');
      setError('You must log in first.');
      // Redirect to login page after a short delay to show error
      const timer = setTimeout(() => router.push('/'), 2000);
      return () => clearTimeout(timer);
    }

    const fetchForm = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching form for roll number: ${rollNumber}`);
        const response = await getForm(rollNumber);
        console.log('Form structure received:', response.form);
        setFormStructure(response.form);
      } catch (err) {
        console.error('Error fetching form structure:', err);
         const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while fetching the form.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [router]);

  const renderLoadingSkeleton = () => (
     <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
             <Skeleton className="h-8 w-3/4 mb-2" />
             <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-between mt-6">
                <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-24" />
            </div>
        </CardContent>
    </Card>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      {isLoading && renderLoadingSkeleton()}
      {error && (
         <Alert variant="destructive" className="w-full max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}
      {!isLoading && !error && formStructure && (
        <DynamicForm formStructure={formStructure} />
      )}
       {!isLoading && !error && !formStructure && !sessionStorage.getItem('rollNumber') && (
        <p>Redirecting to login...</p> // Placeholder while redirecting due to no roll number
       )}
        {!isLoading && !error && !formStructure && sessionStorage.getItem('rollNumber') && (
         <p>No form data found for this user.</p> // Case where API returns empty/invalid form
        )}
    </main>
  );
}
