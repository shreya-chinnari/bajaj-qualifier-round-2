/**
 * Represents a form field option.
 */
export interface FormFieldOption {
  /**
   * The value of the option.
   */
  value: string;
  /**
   * The label of the option.
   */
  label: string;
  /**
   * The data test ID of the option.
   */
  dataTestId?: string;
}

/**
 * Represents a form field validation rule.
 */
export interface FormFieldValidation {
  /**
   * The validation message.
   */
  message: string;
}

/**
 * Represents a form field.
 */
export interface FormField {
  /**
   * The ID of the field.
   */
  fieldId: string;
  /**
   * The type of the field.
   */
  type: "text" | "tel" | "email" | "textarea" | "date" | "dropdown" | "radio" | "checkbox";
  /**
   * The label of the field.
   */
  label: string;
  /**
   * The placeholder of the field.
   */
  placeholder?: string;
  /**
   * Whether the field is required.
   */
  required: boolean;
  /**
   * The data test ID of the field.
   */
  dataTestId: string;
  /**
   * The validation rules of the field.
   */
  validation?: FormFieldValidation;
  /**
   * The options of the field (for dropdown, radio, checkbox).
   */
  options?: FormFieldOption[];
  /**
   * The maximum length of the field.
   */
  maxLength?: number;
  /**
   * The minimum length of the field.
   */
  minLength?: number;
}

/**
 * Represents a form section.
 */
export interface FormSection {
  /**
   * The ID of the section.
   */
  sectionId: number;
  /**
   * The title of the section.
   */
  title: string;
  /**
   * The description of the section.
   */
  description: string;
  /**
   * The fields of the section.
   */
  fields: FormField[];
}

/**
 * Represents a form.
 */
export interface Form {
  /**
   * The title of the form.
   */
  formTitle: string;
  /**
   * The ID of the form.
   */
  formId: string;
  /**
   * The version of the form.
   */
  version: string;
  /**
   * The sections of the form.
   */
  sections: FormSection[];
}

/**
 * Represents a form response.
 */
export interface FormResponse {
  /**
   * The message of the response.
   */
  message: string;
  /**
   * The form of the response.
   */
  form: Form;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dynamic-form-generator-9rl7.onrender.com';


/**
 * Asynchronously retrieves a form by roll number using the /get-form API.
 *
 * @param rollNumber The roll number of the user.
 * @returns A promise that resolves to a FormResponse object.
 * @throws Throws an error if the API call fails or the response format is incorrect.
 */
export async function getForm(rollNumber: string): Promise<FormResponse> {
  console.log('Attempting to fetch form for roll number:', rollNumber);
  try {
    const response = await fetch(`${API_BASE_URL}/get-form?rollNumber=${encodeURIComponent(rollNumber)}`);

    console.log('API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
      console.error('API Error:', errorData);
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    const responseData: FormResponse = await response.json();
    console.log('API Response Data:', responseData);


    // Basic validation of the response structure
    if (!responseData || typeof responseData !== 'object' || !responseData.form || !Array.isArray(responseData.form.sections)) {
       console.error('Invalid form structure received:', responseData);
      throw new Error('Invalid form structure received from API.');
    }

    return responseData;
  } catch (error) {
    console.error('Error fetching form:', error);
     // Re-throw the error to be caught by the calling component
    if (error instanceof Error) {
      throw new Error(`Failed to fetch form: ${error.message}`);
    } else {
       throw new Error('An unknown error occurred while fetching the form.');
    }
  }
}
