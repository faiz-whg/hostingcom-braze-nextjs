/**
 * @file API Route: /api/auth/register
 * @description Handles user registration requests. It receives user data, validates it, and then calls the `upmindService.register`
 * method to create a new user account with the Upmind platform. It returns a JSON response indicating the outcome of the registration attempt.
 */
import { NextResponse } from 'next/server';
import upmindService, {
    UpmindServiceResponse, // Union type for Upmind service responses
    // UpmindServiceSuccessResponse & UpmindServiceErrorResponse are part of the UpmindServiceResponse discriminated union.
    // TypeScript infers the specific type based on checking the 'status' property.
    // UpmindSuccessfulRegistrationData is the type of 'result.data' on success.
} from '@/lib/services/upmind';

/**
 * @interface RegisterRequestBody
 * @description Defines the expected structure of the JSON request body for the registration endpoint.
 * It's similar to `UserData` in `upmind.ts` but defined separately to decouple the API contract
 * from the service's internal types if desired.
 */
interface RegisterRequestBody {
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  phone?: string | null;
  phone_code?: string | null;
  phone_country_code?: string | null;
  username?: string; // Optional, UpmindService will default to email if not provided
}

/**
 * @export
 * @async
 * @function POST
 * @description Handles POST requests to register a new user.
 * It expects user details in the request body, calls the Upmind registration service,
 * and returns a JSON response.
 * @param {Request} request - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js API response.
 */
export async function POST(request: Request) {
  try {
    const body: RegisterRequestBody = await request.json();

    // Basic validation for required fields. Consider using a validation library (e.g., Zod) for more robust checks.
    if (!body.email || !body.firstname || !body.lastname || !body.password) {
      return NextResponse.json({ success: false, error: 'Missing required fields (email, firstname, lastname, password).' }, { status: 400 });
    }

    // Call the Upmind service to register the user.
    // The `RegisterRequestBody` is compatible with the `UserData` type expected by `upmindService.register`.
    const result: UpmindServiceResponse = await upmindService.register(body);
    
    // Process the response from the Upmind service.
    // If 'result.status' is 'ok', the registration with Upmind was successful (as per Upmind API's own success criteria like having status 'ok' and a user ID).
  
    if (result.status === 'ok') {
        // TypeScript infers 'result' as UpmindServiceSuccessResponse here due to the discriminated union.
        // 'result.data' contains the UpmindSuccessfulRegistrationData, including the new user's ID.
        return NextResponse.json({ 
            success: true, // Indicates success to the client application.
            data: result.data, // The Upmind client data.
            message: result.message || 'User registered successfully with Upmind.' 
        });
    } else {
        // TypeScript infers 'result' as UpmindServiceErrorResponse here.
        // 'result.error' contains the error message from the Upmind service (which might originate from Upmind API or the service itself).
        const errorMessage = result.error || 'Registration with Upmind service failed.';
        console.warn('Upmind registration via service failed. Full result from upmindService:', result);
        // For Upmind service-level errors (e.g., Upmind API returned an error, or unexpected response structure),
        // this API route still returns an HTTP 200 OK, but with 'success: false' in the JSON body.
        // The client application is responsible for checking the 'success' flag.
        // The 'result.data' here might contain the raw error response from Upmind for debugging.
        return NextResponse.json({ success: false, error: errorMessage, data: result.data || null }, { status: 200 });
    }

  } catch (error: unknown) {
    // This catch block handles unexpected errors during request processing (e.g., `request.json()` failure) or if upmindService.register itself throws an unhandled exception
    // (though upmindService is designed to return UpmindServiceErrorResponse for known errors).
    console.error('Register API Error (Outer Catch Block):', error);
    // Attempt to create a structured error response.
    const err = error as {
        status?: number;
        message?: string;
        data?: {
            error?: { message?: string };
            message?: string;
            [key: string]: unknown; // Allow other properties on data
        }
    };
    // The UpmindService's methods are designed to return structured error responses rather than throwing, 
    // so this catch block is more for unexpected issues within the API route itself (e.g., request parsing issues).
    const status = err.status || 500; // Default to 500 Internal Server Error if status is not available.
    const errorMessage = err.data?.error?.message || err.data?.message || err.message || 'An unexpected error occurred during registration.';
    const responseData = err.data; // Include additional data if available on the error object.
    return NextResponse.json({ success: false, error: errorMessage, data: responseData }, { status });
  }
}
