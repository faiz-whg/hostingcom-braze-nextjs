// API Route: /api/auth/login
import { NextResponse } from 'next/server';
import upmindService, { UpmindLoginResponse, UpmindServiceErrorResponse } from '@/lib/services/upmind'; // Ensure correct path

/**
 * @interface LoginRequestBody
 * @description Defines the expected structure for the login request body.
 */
interface LoginRequestBody {
  /** @property {string} username - The user's username, typically their email address for Upmind. */
  username: string;
  /** @property {string} password - The user's password. */
  password: string;
}

/**
 * @async
 * @function POST
 * @description Handles POST requests to the `/api/auth/login` endpoint.
 * It expects a JSON body with `username` (email) and `password`.
 * It calls the `upmindService.login` method to authenticate the user with Upmind.
 * - On successful authentication and if an `access_token` is present in the Upmind response,
 *   it returns a JSON response with `success: true` and the Upmind response data.
 * - If Upmind responds with a 2xx status but the `access_token` is missing, it returns `success: false`
 *   with an error message indicating unexpected data, and a 200 or 500 status.
 * - If `username` or `password` are missing in the request, it returns a 400 error.
 * - For other errors (e.g., Upmind service errors, network issues), it logs the error
 *   and returns a JSON response with `success: false` and an appropriate error message and status code.
 * @param {Request} request - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js API response object.
 */
export async function POST(request: Request) {
  try {
    const body: LoginRequestBody = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required.' }, { status: 400 });
    }

    const result = await upmindService.login(username, password);

    // Type guard to check if it's a UpmindLoginResponse by presence and type of access_token
    if (result && typeof result === 'object' && 'access_token' in result && typeof (result as UpmindLoginResponse).access_token === 'string') {
      const loginSuccessResponse = result as UpmindLoginResponse; // Explicit type cast after guard
      return NextResponse.json({ success: true, data: loginSuccessResponse, message: 'Login successful.' });
    } else {
      // This is either an UpmindServiceErrorResponse or an unexpected success response without access_token
      const errorResponse = result as UpmindServiceErrorResponse; // Type assertion for clarity
      console.warn('Upmind login failed or returned unexpected data:', errorResponse);
      
      // Check if it's a structured error from our UpmindService (which it should be if not a login success)
      if (errorResponse && errorResponse.status === 'error' && typeof errorResponse.error === 'string') {
        // Consider using a more specific status code if available from errorResponse, e.g., errorResponse.statusCode
        return NextResponse.json({ success: false, error: errorResponse.error, data: errorResponse.data }, { status: 500 }); 
      }
      // Fallback for truly unexpected scenarios (e.g., Upmind changed API, login didn't throw, but response is malformed)
      return NextResponse.json({ 
        success: false, 
        error: 'Login attempt completed but received an unexpected data format from the authentication service.', 
        data: errorResponse // Send back what was received for debugging
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Login API Error:', error);
    // Assert error to a more specific type to access its properties
    const err = error as {
        status?: number;
        message?: string;
        data?: {
            error?: { message?: string };
            message?: string;
            [key: string]: unknown; // Allow other properties on data
        }
    };
    const status = err.status || 500;
    const errorMessage = err.data?.error?.message || err.data?.message || err.message || 'Login failed.';
    const responseData = err.data; 
    return NextResponse.json({ success: false, error: errorMessage, data: responseData }, { status });
  }
}
