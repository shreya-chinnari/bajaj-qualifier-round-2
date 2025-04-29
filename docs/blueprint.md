# **App Name**: Dynamic Form Handler

## Core Features:

- User Authentication: User login/registration with roll number and name using POST /create-user API.
- Dynamic Form Rendering & Navigation: Dynamically render form sections and fields based on the structure received from GET /get-form API. Implement next/previous section navigation with validation.
- Dynamic Form Validation: Implement dynamic validation based on API response (/get-form), including required, minLength, maxLength, etc. Display validation errors.

## Style Guidelines:

- Primary color: White or light grey for background.
- Secondary color: Dark grey or black for text.
- Accent: Teal (#008080) for interactive elements (buttons, links).
- Clean and simple layout with clear separation of form sections.
- Use a single-column layout for form fields within each section to improve readability.
- Use a simple sans-serif font for readability.

## Original User Request:
Create this app in React, TypeScript, API integration, dynamic form rendering. Please complete the task in react or . Build a React-based application that allows a student to:

Login by entering:

Roll Number
Name
Register the user by calling a POST /create-user API.

Fetch a dynamic form structure using GET /get-form API after successful login.

Render the form dynamically based on the structure received.

Validate inputs dynamically based on the /get-form API response (e.g., required, minLength, minLength etc.).

There will be multiple Sections in the form, each section has to be validated seperately. User shouldn't be allowed to move to next section if the current sectioin is invalid.

Each section will have a prev and next button, only the last section will have Submit button.

On final/last form submission, simply console.log the collected form data.

📚 Form Data Structure
When you call /get-form, you will receive a JSON structured like this:

interface FormResponse {
  message: string;
  form: {
    formTitle: string;
    formId: string;
    version: string;
    sections: FormSection[];
  };
}

interface FormSection {
  sectionId: number;
  title: string;
  description: string;
  fields: FormField[];
}

interface FormField {
  fieldId: string;
  type: "text" | "tel" | "email" | "textarea" | "date" | "dropdown" | "radio" | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  dataTestId: string;
  validation?: {
    message: string;
  };
  options?: Array<{
    value: string;
    label: string;
    dataTestId?: string;
  }>;
  maxLength?: number;
  minLength?: number;
}Use this structure to render the form dynamically.
You should not hardcode any field.

🛠 Requirements
Use React, bonus points for TypeScript.
Render form sections and fields dynamically based on API data.
Implement validation as per the field metadata.
Display validation errors properly.
On form submit, log the collected data to the console.
UI: Keep it clean and simple, nothing fancy.
Focus more on Functionality than UI.  📡 API Endpoints
POST /create-user — Registers the user (expects roll number and name).
- curl --location 'https://dynamic-form-generator-9rl7.onrender.com/create-user' \
        --header 'Content-Type: application/json' \
        --header 'Content-Type: application/json' \
        --data '{
            "rollNumber": {INPUT_ROLL_NUMBER},
            "name": {INPUT_NAME}
        }'
GET /get-form — Returns the dynamic form structure. (expects roll number)
- curl --location 'https://dynamic-form-generator-9rl7.onrender.com/get-form?rollNumber={INPUT_ROLL_NUMBER}'
  