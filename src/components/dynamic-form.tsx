'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
           fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: field.validation?.message || 'Invalid date format (YYYY-MM-DD)'});
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
                fieldSchema = fieldSchema.optional();
            }
           break;

        default:
          fieldSchema = z.any();
      }

      // Add required validation if not checkbox (checkbox handles required differently)
      if (field.required && field.type !== 'checkbox') {
        if (fieldSchema instanceof z.ZodString) {
          fieldSchema = fieldSchema.min(1, { message: field.validation?.message || `${field.label} is required` });
        } else {
           // For non-string types that are required (though less common in this spec)
           // This might need adjustment based on actual non-string required types
          fieldSchema = fieldSchema.refine(val => val !== null && val !== undefined && val !== '', {
               message: field.validation?.message || `${field.label} is required`,
            });
        }
      } else if (!field.required && field.type !== 'checkbox') {
        // Make non-required fields optional
         fieldSchema = fieldSchema.optional();
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

  const onSubmit = (data: z.infer<typeof validationSchema>) => {
     // Final validation is implicitly handled by react-hook-form's handleSubmit
     console.log('Form submitted successfully!');
     console.log('Collected Form Data:', data);

     // Show success toast
     toast({
        title: "Success!",
        description: "Form submitted successfully!",
        variant: "default", // or 'success' if you have that variant
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
              <>
                {field.type === 'text' && <Input id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'email' && <Input type="email" id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'tel' && <Input type="tel" id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'textarea' && <Textarea id={field.fieldId} placeholder={field.placeholder} {...RHFfield} data-testid={field.dataTestId} />}
                {field.type === 'date' && <Input type="date" id={field.fieldId} {...RHFfield} data-testid={field.dataTestId} />}
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
                     <div className="flex items-center space-x-2 pt-2"> {/* Added pt-2 for alignment */}
                      <Checkbox
                        id={field.fieldId}
                        checked={!!RHFfield.value} // Ensure value is treated as boolean
                        onCheckedChange={RHFfield.onChange}
                        data-testid={field.dataTestId}
                        />
                        {/* Label is handled by FormLabel above, this is for the checkbox itself */}
                    </div>
                 )}
              </>
            </FormControl>
            {field.placeholder && field.type !== 'radio' && field.type !== 'checkbox' && field.type !== 'dropdown' && (
               <UIFormDescription>
                  {/* Display placeholder as description only if needed, RHF handles input placeholder */}
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
        <CardTitle className="text-2xl font-bold mb-2">{formStructure.formTitle} (v{formStructure.version})</CardTitle>
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
                // Use form.handleSubmit here for the submit button
                <Button type="button" onClick={form.handleSubmit(onSubmit)} className="bg-accent hover:bg-accent/90">Submit</Button>
              ) : (
                <Button type="button" onClick={handleNext} className="bg-accent hover:bg-accent/90">
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

    