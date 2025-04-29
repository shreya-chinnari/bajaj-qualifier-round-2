
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, startOfDay } from 'date-fns'; // Import date-fns function

import type { Form, FormSection, FormField as FormFieldType, FormFieldOption } from '@/lib/api/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form as UIForm, FormControl, FormDescription as UIFormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface DynamicFormProps {
  formStructure: Form;
}

// Helper to build Zod schema dynamically
const buildSchema = (sections: FormSection[]) => {
  let schemaShape = {};
  const today = startOfDay(new Date()); // Get today's date at midnight

  sections.forEach(section => {
    section.fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny = z.any(); // Default to any

      switch (field.type) {
        case 'text':
        case 'textarea':
          fieldSchema = z.string();
          if (field.minLength !== undefined) {
            fieldSchema = fieldSchema.min(field.minLength, { message: `${field.label} must be at least ${field.minLength} characters` });
          }
          if (field.maxLength !== undefined) {
            fieldSchema = fieldSchema.max(field.maxLength, { message: `${field.label} cannot exceed ${field.maxLength} characters` });
          }
          break;
        case 'email':
          fieldSchema = z.string().email({ message: field.validation?.message || 'Invalid email address' });
          break;
        case 'tel':
          // Basic phone validation (allows digits, spaces, hyphens, parentheses)
          fieldSchema = z.string().regex(/^[\d\s\-()+]*$/, { message: field.validation?.message || 'Invalid phone number format' });
           if (field.minLength !== undefined) {
            fieldSchema = fieldSchema.min(field.minLength, { message: `${field.label} must be at least ${field.minLength} characters` });
          }
          if (field.maxLength !== undefined) {
            fieldSchema = fieldSchema.max(field.maxLength, { message: `${field.label} cannot exceed ${field.maxLength} characters` });
          }
          break;
        case 'date':
           // Validate format YYYY-MM-DD first
           fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: field.validation?.message || 'Invalid date format (YYYY-MM-DD)'});
           // Add refinement to check if the date is not in the future (less than or equal to today)
           fieldSchema = fieldSchema.refine(dateStr => {
              try {
                // Check if date string is valid before creating Date object
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
                const inputDate = new Date(dateStr);
                // Add timezone offset to avoid issues across different timezones when comparing with startOfDay(new Date())
                const adjustedInputDate = new Date(inputDate.getTime() + inputDate.getTimezoneOffset() * 60000);
                return !isNaN(adjustedInputDate.getTime()) && adjustedInputDate <= today; // Allow today's date
              } catch (e) {
                return false; // Invalid date string
              }
           }, { message: field.validation?.message || `${field.label} cannot be a future date` });
           break;
        case 'dropdown':
        case 'radio':
          fieldSchema = z.string(); // Assuming value is stored as string
          break;
        case 'checkbox':
           // For a single checkbox, boolean. For multiple, array of strings.
           // Assuming single checkbox for simplicity here, adjust if needed.
           // If it's a group, the name should be consistent and value an array.
           fieldSchema = z.boolean();
           if (field.required) {
               // For single required checkbox
              fieldSchema = fieldSchema.refine(val => val === true, { message: field.validation?.message || `${field.label} is required` });
            } else {
                // Optional checkbox doesn't need specific validation beyond being boolean
                fieldSchema = fieldSchema.optional().default(false); // Default to false for optional checkboxes
            }
           break;

        default:
          fieldSchema = z.any();
      }

      // Add required validation if not checkbox (checkbox handles required differently)
      if (field.required && field.type !== 'checkbox') {
        if (fieldSchema instanceof z.ZodString) {
            // For string types, ensure it's not empty if required
            fieldSchema = fieldSchema.min(1, { message: field.validation?.message || `${field.label} is required` });
        } else {
           // For non-string types that are required (e.g., potentially future numeric types)
          fieldSchema = fieldSchema.refine(val => val !== null && val !== undefined && val !== '', {
               message: field.validation?.message || `${field.label} is required`,
            });
        }
      } else if (!field.required && field.type !== 'checkbox') {
        // Make non-required fields optional, unless they already are (like date with refine)
         if (!fieldSchema._def.typeName.includes('Optional')) {
            fieldSchema = fieldSchema.optional();
         }
      }


      schemaShape[field.fieldId] = fieldSchema;
    });
  });
  return z.object(schemaShape);
};


export function DynamicForm({ formStructure }: DynamicFormProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { toast } = useToast(); // Initialize toast
  const formRef = useRef<HTMLDivElement>(null); // Ref for scrolling
  const totalSections = formStructure.sections.length;
  const currentSection = formStructure.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === totalSections - 1;

   // Memoize the schema to avoid rebuilding on every render
  const validationSchema = useMemo(() => buildSchema(formStructure.sections), [formStructure.sections]);

  // Helper to generate default values
   const generateDefaultValues = () => {
    const defaults = {};
    formStructure.sections.forEach(section => {
      section.fields.forEach(field => {
        defaults[field.fieldId] = field.type === 'checkbox' ? false : ''; // Initialize checkboxes to false, others to empty string
      });
    });
    return defaults;
   };


  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange', // Validate on change for immediate feedback
    defaultValues: useMemo(generateDefaultValues, [formStructure]), // Use memoized default values
  });

   // Watch all form values - useful for debugging
   // const watchedValues = form.watch();
   // useEffect(() => {
   //   console.log("Form values changed:", watchedValues);
   //   console.log("Form errors:", form.formState.errors);
   // }, [watchedValues, form.formState.errors]);


  const handleNext = async () => {
    // Trigger validation only for fields in the current section
    const fieldsToValidate = currentSection.fields.map(f => f.fieldId) as (keyof z.infer<typeof validationSchema>)[];
    console.log("Fields to validate for next:", fieldsToValidate);
    const isValid = await form.trigger(fieldsToValidate);
    console.log(`Section ${currentSectionIndex + 1} validation status:`, isValid);

    if (isValid && currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
       // Scroll to top of form card when moving to next section
       if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
       }
    } else if (!isValid) {
        console.log("Section invalid, cannot proceed.", form.formState.errors);
        // Errors should automatically display due to RHF state
         toast({
            title: "Validation Error",
            description: "Please fix the errors in the current section before proceeding.",
            variant: "destructive",
        });
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      // Scroll to top of form card when moving to previous section
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
       }
    }
  };

 const onSubmit = async () => {
    // Trigger validation for the entire form one last time
    // It's often better to validate all fields on submit, even if section validation passed previously
    const isFormValid = await form.trigger(); // Validate all fields

    if (!isFormValid) {
      console.log('Final validation failed. Errors:', form.formState.errors);
      toast({
        title: "Submission Failed",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
       // Find the first section with an error and navigate to it
      let firstErrorSectionIndex = -1;
      for (let i = 0; i < formStructure.sections.length; i++) {
        const sectionFields = formStructure.sections[i].fields.map(f => f.fieldId);
        const hasError = sectionFields.some(fieldId => !!form.formState.errors[fieldId]);
        if (hasError) {
          firstErrorSectionIndex = i;
          break;
        }
      }
      // If an error exists in a previous section, navigate there
      if (firstErrorSectionIndex !== -1 && firstErrorSectionIndex !== currentSectionIndex) {
         setCurrentSectionIndex(firstErrorSectionIndex);
         if (formRef.current) {
            // Slight delay to ensure state update before scrolling
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
         }
      } else if (formRef.current) {
         // If error is in current section, just scroll to top of card
         formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      return; // Stop submission if validation fails
    }

    // If validation passes, get the form data
    const data = form.getValues();
    console.log('Form submitted successfully!');
    console.log('Collected Form Data:', data);

    // Show success toast
    toast({
      title: "Success!",
      description: "Form submitted successfully!",
      variant: "default", // Use default style for success
    });

    // Reset the form fields to their default values
    form.reset(generateDefaultValues());

    // Reset to the first section
    setCurrentSectionIndex(0);

    // Scroll to the top of the page/form
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


   const renderField = (field: FormFieldType, control) => {
    const fieldName = field.fieldId as keyof z.infer<typeof validationSchema>; // Type assertion
    return (
      <FormField
        control={control}
        name={fieldName}
        key={field.fieldId}
        render={({ field: RHFfield, fieldState }) => ( // Rename to RHFfield to avoid conflict
          <FormItem className="mb-4">
            <FormLabel htmlFor={field.fieldId} className={fieldState.error ? 'text-destructive' : ''}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              {/* Replace React.Fragment with a div to accept the id prop */}
              <div>
                {field.type === 'text' && <Input id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'email' && <Input type="email" id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'tel' && <Input type="tel" id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'textarea' && <Textarea id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'date' && <Input type="date" id={field.fieldId} {...RHFfield} data-testid={field.dataTestId} max={format(new Date(), 'yyyy-MM-dd')} />}
                {field.type === 'dropdown' && (
                  <Select onValueChange={RHFfield.onChange} value={RHFfield.value || ''} defaultValue={RHFfield.value || ''}>
                    <SelectTrigger id={field.fieldId} data-testid={field.dataTestId}>
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option: FormFieldOption) => (
                        <SelectItem key={option.value} value={option.value} data-testid={option.dataTestId}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === 'radio' && (
                    <RadioGroup
                        onValueChange={RHFfield.onChange}
                        value={RHFfield.value || ''}
                        defaultValue={RHFfield.value || ''}
                        className="flex flex-col space-y-1"
                        id={field.fieldId}
                         data-testid={field.dataTestId}
                    >
                        {field.options?.map((option: FormFieldOption) => (
                        <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                             <FormControl>
                            <RadioGroupItem value={option.value} id={`${field.fieldId}-${option.value}`} data-testid={option.dataTestId} />
                            </FormControl>
                            <FormLabel htmlFor={`${field.fieldId}-${option.value}`} className="font-normal">
                            {option.label}
                            </FormLabel>
                        </FormItem>
                        ))}
                    </RadioGroup>
                )}
                 {field.type === 'checkbox' && (
                     <div className="flex items-start space-x-2 pt-2"> {/* Use items-start for better alignment */}
                      <Checkbox
                        id={field.fieldId}
                        checked={!!RHFfield.value} // Ensure value is treated as boolean
                        onCheckedChange={(checked) => {
                            RHFfield.onChange(checked); // Pass the boolean directly
                        }}
                        data-testid={field.dataTestId}
                        />
                        {/* The main label is handled by FormLabel above.
                            If a specific label text is needed *only* next to the checkbox,
                            add it here, but usually the FormLabel is sufficient. */}
                    </div>
                 )}
              </div>
            </FormControl>
            {field.placeholder && field.type !== 'radio' && field.type !== 'checkbox' && field.type !== 'dropdown' && (
               <UIFormDescription>
                  {/* Placeholder is handled by the input itself */}
               </UIFormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };


  const progressValue = ((currentSectionIndex + 1) / totalSections) * 100;


  return (
    <Card ref={formRef} className="w-full max-w-2xl mx-auto shadow-xl">
       <CardHeader>
        {/* Removed version number */}
        <CardTitle className="text-2xl font-bold mb-2">{formStructure.formTitle}</CardTitle>
         <Progress value={progressValue} className="w-full h-2 mb-4" />
         <p className="text-sm text-muted-foreground text-center">{`Section ${currentSectionIndex + 1} of ${totalSections}`}</p>
         <Separator className="my-4" />
        <CardTitle className="text-xl font-semibold">{currentSection.title}</CardTitle>
        <CardDescription>{currentSection.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <UIForm {...form}>
          {/* Use a div instead of form tag here, trigger submit via button */}
          <div className="space-y-6">
            {currentSection.fields.map(field => renderField(field, form.control))}

            {/* Footer is outside the form fields mapping */}
            <CardFooter className="flex justify-between mt-8 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handlePrev} disabled={currentSectionIndex === 0}>
                Previous
              </Button>

              {isLastSection ? (
                // Use a regular button, handle submit logic in its onClick
                <Button type="button" onClick={onSubmit} className="bg-accent hover:bg-accent/90 text-accent-foreground">Submit</Button>
              ) : (
                <Button type="button" onClick={handleNext} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Next
                </Button>
              )}
            </CardFooter>
          </div>
        </UIForm>
      </CardContent>
    </Card>
  );
}
