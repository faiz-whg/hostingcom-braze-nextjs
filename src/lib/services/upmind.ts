/**
 * @file Upmind Service
 * @description This service handles interactions with the Upmind API, primarily for user registration and login.
 * It includes type definitions for API requests and responses and encapsulates API call logic.
 * It is intended to be used as a singleton throughout the application.
 */
import axios from 'axios';

/**
 * @interface UpmindErrorData
 * @description Represents the structure of error data that might be returned by the Upmind API within an error response.
 */
interface UpmindErrorData {
  error?: { message?: string };
  message?: string;
  // Add other properties if known
}

/**
 * @interface CustomError
 * @description Extends the standard Error object to include potential HTTP status and additional data from API errors.
 */
interface CustomError extends Error {
  status?: number;
  data?: UpmindErrorData;
}

/**
 * @interface RawUpmindActualApiResponse
 * @description Defines the structure of the raw JSON response directly from the Upmind API, for example, after a client registration call.
 * Upmind's API might have its own 'status', 'data', and 'error' fields at the top level.
 */
interface RawUpmindActualApiResponse {
  status: string; // e.g., "ok" or "error"
  data?: { // This is the actual client/user object from Upmind
    id?: string | number; // The client's ID in Upmind.
    org_id?: string; // Organization ID, if applicable.
    public_name?: string; // Public display name.
    image_url?: string | null; // URL for the client's image.
    // Potentially other fields Upmind returns for a client.
    [key: string]: unknown; // Allows for other fields Upmind might return for a client.
  };
  total?: null | number;
  error?: null | string | object; // Upmind might use this for its own error reporting
  messages?: Array<unknown>; // Upmind might send messages here
  [key: string]: unknown; // Allow other top-level properties from Upmind's response
}

/**
 * @export
 * @interface UpmindSuccessfulRegistrationData
 * @description Defines the structure of the `data` field within our service's successful registration response (`UpmindServiceSuccessResponse`).
 * This is a processed/normalized version of the client data received from Upmind, ensuring `id` is a string.
 */
export interface UpmindSuccessfulRegistrationData {
  id: string; // Upmind client ID, ensured to be string by the service
  // Potentially other fields that Upmind returns for a client and we want to use:
  // email?: string;
  // firstname?: string;
  // lastname?: string;
  // status?: string; // e.g., 'active', 'pending'
  // ... any other relevant fields from the actual Upmind client object
  [key: string]: unknown; // Allow other properties from Upmind's response
}

/**
 * @export
 * @interface UpmindServiceSuccessResponse
 * @description Represents the structure of a successful response from methods in `UpmindService` (e.g., `register`).
 * It standardizes the success response format for the application.
 */
export interface UpmindServiceSuccessResponse {
  status: 'ok';
  data: UpmindSuccessfulRegistrationData;
  message?: string;
}

/**
 * @export
 * @interface UpmindServiceErrorResponse
 * @description Represents the structure of an error response from methods in `UpmindService`.
 * It standardizes the error response format, including an error message and optional original error data from Upmind.
 */
export interface UpmindServiceErrorResponse {
  status: 'error';
  error: string; // Error message
  data?: UpmindErrorData | null | Record<string, unknown>; // Original error data from Upmind, if any
  message?: string;
}

/**
 * @export
 * @type UpmindServiceResponse
 * @description A union type representing either a successful or an error response from `UpmindService` methods.
 */
export type UpmindServiceResponse = UpmindServiceSuccessResponse | UpmindServiceErrorResponse;

/**
 * @interface UpmindLoginResponse
 * @description Defines the expected structure of the data returned by Upmind's OAuth token endpoint upon successful login.
 */
export interface UpmindLoginResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string | null;
  refresh_token: string;
  // Add other properties if Upmind returns more, e.g., user_id, client_id
  [key: string]: unknown; // Allow other properties
}

/**
 * @deprecated This interface is likely superseded by `UpmindSuccessfulRegistrationData` used within `UpmindServiceSuccessResponse`.
 * Consider removing if `UpmindSuccessfulRegistrationData` adequately covers the necessary fields from Upmind's raw registration success response.
 */
/*
interface UpmindRegisterResponse {
  id: string | number; 
  [key: string]: unknown; 
}
*/

/**
 * @interface UserData
 * @description Defines the structure for user data required for registration or login operations.
 */
interface UserData {
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  phone?: string | null;
  phone_code?: string | null;
  phone_country_code?: string | null;
  username?: string;
}

/**
 * @export
 * @class UpmindService
 * @description Provides methods to interact with the Upmind API for operations like user registration and login.
 */
export class UpmindService {
  private loginUrl: string; // URL for Upmind's OAuth token endpoint.
  private registerUrl: string; // URL for Upmind's client registration endpoint.
  private headers: Record<string, string>; // Common HTTP headers for Upmind API requests.

  /**
   * @constructor
   * @description Initializes the UpmindService.
   * Sets the API endpoint URLs (currently hardcoded, consider moving to environment variables for flexibility).
   * Configures default HTTP headers, including 'Origin' and 'Referer' which are critical for Upmind API access
   * and are sourced from environment variables (UPMIND_ORIGIN, UPMIND_REFERER).
   */
  constructor() {
    // TODO: Consider moving these Upmind API URLs to environment variables.
    this.loginUrl = process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL ? `${process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL}/oauth/access_token` : 'https://api.upmind.io/oauth/access_token';
    this.registerUrl = process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL ? `${process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL}/api/clients/register` : 'https://api.upmind.io/api/clients/register';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd', // Axios handles gzip decompression by default.
      'Accept-Language': 'en-US,en;q=0.9',
      // 'Origin' and 'Referer' headers are often critical for Upmind API requests to prevent CSRF and validate the source.
      // These should be configured in environment variables (.env.local) to match allowed domains in Upmind settings.
      // For local development, these might be 'http://localhost:3000'.
      'Origin': process.env.UPMIND_ORIGIN || 'https://analyd.com', // Default fallback if env var is not set.
      'Referer': process.env.UPMIND_REFERER || 'https://analyd.com/', // Default fallback if env var is not set.
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36' // Standard User-Agent.
    };
  }

  /**
   * @async
   * @method register
   * @description Registers a new user (client) with the Upmind API.
   * @param {UserData} userData - The user data for registration (email, name, password, etc.).
   * @returns {Promise<UpmindServiceResponse>} A promise that resolves to an `UpmindServiceResponse` object,
   * indicating success (with normalized client data) or failure (with an error message).
   * Successful registration via this service checks for `status: 'ok'` and a valid `id` in Upmind's direct API response data.
   */
  async register(userData: UserData): Promise<UpmindServiceResponse> {
    const registrationPayload = {
      email: userData.email,
      firstname: userData.firstname,
      lastname: userData.lastname,
      phone: userData.phone || null,
      phone_code: userData.phone_code || null,
      phone_country_code: userData.phone_country_code || null,
      username: userData.username || userData.email,
      password: userData.password,
    };
    console.log('Upmind Registration request payload:', JSON.stringify(registrationPayload, null, 2));

    try {
      const upmindHttpResult = await axios.post<RawUpmindActualApiResponse>(
        this.registerUrl,
        registrationPayload,
        { headers: this.headers }
      );
      console.log('Upmind API raw success response:', JSON.stringify(upmindHttpResult.data, null, 2));

      const actualUpmindFullResponse = upmindHttpResult.data; // This is of type RawUpmindActualApiResponse

      // Validate the Upmind API's response structure for success.
      // According to Upmind API conventions,
      // a successful registration should have top-level 'status: "ok"'
      // and a 'data' object containing the client details, including an 'id'.
      if (
        actualUpmindFullResponse &&
        actualUpmindFullResponse.status === 'ok' && // Upmind's own status field
        actualUpmindFullResponse.data && // Check if the nested 'data' (client object) exists
        (typeof actualUpmindFullResponse.data.id === 'string' || typeof actualUpmindFullResponse.data.id === 'number')
      ) {
        // Successfully received and validated the client data from Upmind.
        const clientDataFromUpmind = actualUpmindFullResponse.data; // This is the nested client object from Upmind.

        // Normalize the received client data into our UpmindSuccessfulRegistrationData structure.
        // This ensures consistency for the rest of the application (e.g., 'id' as a string).
        const processedClientData: UpmindSuccessfulRegistrationData = {
          ...clientDataFromUpmind, // Spread all properties from Upmind's client object
          id: clientDataFromUpmind.id!.toString(), // Ensure ID is string and non-null (bang operator is safe due to checks above)
        };

        return {
          status: 'ok', // Standardized success status for our service.
          data: processedClientData, // The normalized client data.
          message: 'User registered successfully with Upmind via service.' // Optional success message.
        };
      } else {
        // This 'else' block handles scenarios where the Upmind API returns an HTTP 2xx status,
        // but the response body does not conform to the expected success structure (e.g., missing 'status: "ok"' or 'data.id').
        let detailedErrorMessage = 'Upmind API call succeeded (HTTP 2xx) but the response content was unexpected or indicated an internal Upmind error.'; 
        if (actualUpmindFullResponse) {
            if (actualUpmindFullResponse.status !== 'ok') {
                detailedErrorMessage = `Upmind API reported status: '${actualUpmindFullResponse.status}'.`;
                if (actualUpmindFullResponse.error) {
                    const errorDetails = typeof actualUpmindFullResponse.error === 'string' ? actualUpmindFullResponse.error : JSON.stringify(actualUpmindFullResponse.error);
                    detailedErrorMessage += ` Error details: ${errorDetails}`;
                }
            } else if (!actualUpmindFullResponse.data) {
                detailedErrorMessage = "Upmind API response status was 'ok' but the 'data' field (client object) is missing.";
            } else if (typeof actualUpmindFullResponse.data.id !== 'string' && typeof actualUpmindFullResponse.data.id !== 'number') {
                detailedErrorMessage = "Upmind API response 'data' field is present but 'id' is missing or not a string/number.";
            }
        } else {
            detailedErrorMessage = "Upmind API call succeeded (HTTP 2xx) but the response body was empty or malformed.";
        }
        
        console.error('Upmind service: Issue processing successful Upmind API response. Raw response:', actualUpmindFullResponse, 'Generated error message:', detailedErrorMessage);
        return {
          status: 'error', // Standardized error status for our service.
          error: detailedErrorMessage, // The generated detailed error message.
          data: actualUpmindFullResponse // Include the raw Upmind response for further debugging if needed.
        };
      }
    } catch (error: unknown) {
      // This block handles network errors or HTTP status codes indicating failure (e.g., 4xx, 5xx) from the Upmind API.
      console.error('Upmind service: Error during registration call to Upmind API.', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response.data as UpmindErrorData;
        const errorMessage = errorData?.error?.message || errorData?.message || 'Registration failed with Upmind API.';
        return {
          status: 'error',
          error: errorMessage,
          data: errorData
        };
      } else {
        let message = 'Upmind registration service encountered an unknown error.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        return {
          status: 'error',
          error: message,
          data: null
        };
      }
    }
  }

  /**
   * @async
   * @method login
   * @description Authenticates a user with Upmind using username and password (OAuth password grant type).
   * @param {string} password - The user's password.
   * @param {string} username - The user's username (typically email).
   * @returns {Promise<UpmindLoginResponse | UpmindServiceErrorResponse>} A promise that resolves to Upmind's login response
   * (containing access_token, etc.) on success, or an `UpmindServiceErrorResponse` on failure.
   */
  async login(username: string, password: string): Promise<UpmindLoginResponse | UpmindServiceErrorResponse> {
    try {
      const payload = { username, password, grant_type: 'password' };
      const response = await axios.post(this.loginUrl, payload, { headers: this.headers });
      return response.data as UpmindLoginResponse;
    } catch (error: unknown) { // Use 'unknown' for error here
      this.handleError(error);
      throw error;
    }
  }

  /**
   * @async
   * @method refreshToken
   * @description Refreshes an OAuth access token using a refresh token with Upmind.
   * @param {string} refreshToken - The refresh token obtained during a previous login.
   * @returns {Promise<UpmindLoginResponse | UpmindServiceErrorResponse>} A promise that resolves to Upmind's login response
   * (containing a new access_token, etc.) on success, or an `UpmindServiceErrorResponse` on failure.
   * Note: The current implementation re-throws errors after `handleError`, which then might be caught by a higher-level caller.
   * Consider returning a standardized `UpmindServiceErrorResponse` directly like in the `register` method for consistency.
   */
  async refreshToken(refreshToken: string): Promise<UpmindLoginResponse | UpmindServiceErrorResponse> {
    try {
      const response = await axios.post(this.loginUrl, {
        grant_type: 'refresh_token', refresh_token: refreshToken,
      }, { headers: this.headers });
      return response.data;
    } catch (error: unknown) { // Use 'unknown' for error here
      this.handleError(error);
      throw error;
    }
  }

  /**
   * @private
   * @method handleError
   * @description A centralized private error handler for Upmind API interactions within this service.
   * It processes Axios errors and other error types, creating a custom error object with status and data.
   * This method always throws an error, intended to be caught by the calling public method or a global error handler.
   * Note: While the `register` method has integrated its error handling to return a `UpmindServiceErrorResponse`,
   * `login` and `refreshToken` still utilize this re-throwing `handleError` method.
   * For consistency, `login` and `refreshToken` could be updated to return `UpmindServiceErrorResponse` directly.
   * @param {unknown} error - The error object caught, typically from an Axios request.
   * @throws {CustomError} Throws a standardized `CustomError` object containing details from the Upmind API error or a generic service error.
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as UpmindErrorData;
      const errorMessage = errorData?.error?.message || errorData?.message || 'Authentication failed with Upmind';
      const customError: CustomError = new Error(errorMessage);
      customError.status = error.response.status;
      customError.data = errorData;
      console.error(`Upmind API Error: Status ${customError.status}, Message: ${customError.message}`, customError.data);
      throw customError;
    } else {
      let message = 'Upmind authentication request failed';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      const customError: CustomError = new Error(message);
      customError.status = 500; // Default status for non-API errors
      console.error(`Upmind Service Error: Message: ${message}`, error);
      throw customError;
    }
  }
}

/**
 * Singleton instance of the UpmindService.
 * This instance is exported to ensure a single point of interaction with the Upmind API throughout the application.
 */
/**
 * @constant upmindService
 * @description Singleton instance of the {@link UpmindService}.
 * This instance is exported to ensure a single, consistent point of interaction
 * with the Upmind API throughout the application.
 */
const upmindService = new UpmindService();
export default upmindService;
