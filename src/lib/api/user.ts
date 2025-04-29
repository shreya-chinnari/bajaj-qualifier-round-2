/**
 * Represents user information.
 */
export interface User {
  /**
   * The user's roll number.
   */
  rollNumber: string;
  /**
   * The user's name.
   */
  name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dynamic-form-generator-9rl7.onrender.com';

/**
 * Asynchronously registers a user by calling the /create-user API.
 *
 * @param user The user to register.
 * @returns A promise that resolves to true if the registration was successful, false otherwise.
 * @throws Throws an error if the API call fails.
 */
export async function createUser(user: User): Promise<boolean> {
  console.log('Attempting to create user:', user);
  try {
    const response = await fetch(`${API_BASE_URL}/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    console.log('API Response Status:', response.status);
    const responseData = await response.json();
    console.log('API Response Data:', responseData);


    if (!response.ok) {
       // Log detailed error from API if available
      console.error('API Error:', responseData);
      throw new Error(responseData.message || `API request failed with status ${response.status}`);
    }

    // Assuming a successful creation returns a specific message or status
    // Adjust this check based on the actual API success response
    return responseData.message === "User created successfully" || response.status === 200 || response.status === 201;
  } catch (error) {
    console.error('Error creating user:', error);
    // Re-throw the error to be caught by the calling component
    if (error instanceof Error) {
      throw new Error(`Failed to register user: ${error.message}`);
    } else {
       throw new Error('An unknown error occurred during user registration.');
    }
  }
}
