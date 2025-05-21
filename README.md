# Next.js Upmind & Braze Integration Project

This project demonstrates integrating Upmind (for user management and backend services) and Braze (for marketing automation and user engagement) into a Next.js application using the App Router, TypeScript, and Tailwind CSS.

## Overview

The primary goal is to provide a robust foundation for user registration, login, and subsequent user data synchronization with Braze, including custom attributes and subscription group management based on Upmind notification preferences.

## Prerequisites

- Node.js (LTS version recommended)
- npm, yarn, pnpm, or bun as your package manager

## Getting Started

### 1. Installation

Clone the repository and install the dependencies:

```bash
# Example using npm
npm install

# Example using yarn
yarn install
```

### 2. Environment Variables

Create a `.env.local` file in the root of the project by copying the `.env.example` file (if one exists) or by creating it from scratch. Populate it with the necessary API keys and endpoint URLs:

```env
# Upmind Configuration
UPMIND_API_KEY="your_upmind_api_key_here" # Server-side Upmind API Key
NEXT_PUBLIC_UPMIND_API_BASE_URL="https://api.upmind.io" # Upmind API base URL (public)
UPMIND_CLIENT_ID="your_upmind_client_id" # Upmind Client ID for specific flows if needed
UPMIND_USERNAME="your_upmind_service_account_username" # For server-to-server auth if applicable
UPMIND_PASSWORD="your_upmind_service_account_password" # For server-to-server auth if applicable
UPMIND_ORIGIN="https://yourfrontenddomain.com" # Origin header for Upmind API calls
UPMIND_REFERER="https://yourfrontenddomain.com" # Referer header for Upmind API calls

# Braze Configuration
NEXT_PUBLIC_BRAZE_API_KEY="your_braze_sdk_api_key_for_client_side" # Braze SDK API Key (publicly visible)
BRAZE_REST_API_KEY="your_braze_rest_api_key_for_server_side" # Braze REST API Key (server-side only)
NEXT_PUBLIC_BRAZE_SDK_ENDPOINT="your_braze_sdk_endpoint_url" # e.g., https://sdk.iad-03.braze.com
BRAZE_REST_API_ENDPOINT="your_braze_rest_api_endpoint_url" # e.g., https://rest.iad-03.braze.com

# Other
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api" # Base URL for your Next.js API routes during development
```

**Note:** Obtain these keys and endpoints from your Upmind and Braze dashboards/account managers.

### 3. Running the Development Server

Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Code Quality and Documentation

This project emphasizes high code quality and thorough documentation to ensure maintainability and ease of understanding.

-   **TypeScript**: The entire frontend and backend API routes are written in TypeScript, providing strong typing and reducing runtime errors.
-   **TSDoc Comments**: Comprehensive TSDoc comments are used for all components, services, API routes, functions, and type definitions. These comments are designed to be read directly in the code and can also be used by tools like [TypeDoc](https://typedoc.org/) to generate external HTML documentation.
-   **ESLint**: The project is configured with ESLint to enforce code style and catch potential issues early. Regular linting (`npm run lint`) is encouraged.
-   **Shared Types**: Common type definitions are centralized in the `src/types/` directory to promote reusability and consistency (e.g., `src/types/card.ts`).

## Project Structure Highlights

- `src/app/api/`: Contains backend API routes (e.g., `auth/register/route.ts`, `auth/login/route.ts`).
- `src/components/`: Reusable React components (e.g., `auth/RegisterForm.tsx`, `dashboard/PromoCard.tsx`).
- `src/lib/services/`: Houses service classes for interacting with external APIs.
  - `upmind.ts`: `UpmindService` class for all Upmind API communications.
  - `braze.ts`: `BrazeService` class for client-side Braze Web SDK interactions.
- `src/config/`: Configuration files (e.g., `brazeConfig.ts` for mapping Upmind preferences to Braze subscription groups).
- `src/types/`: Centralized TypeScript type definitions (e.g., `card.ts` for shared card data structures).

## Extending Functionality

### Upmind Service (`src/lib/services/upmind.ts`)

The `UpmindService` class encapsulates all interactions with the Upmind API. It handles tasks like user registration, login, and fetching user-specific data.

**To add new Upmind API functionality:**

1.  **Identify the Upmind API Endpoint:** Refer to the Upmind API documentation for the endpoint, required parameters, and expected response.
2.  **Add a New Method:** Create a new public method within the `UpmindService` class.
    -   This method should accept necessary parameters (e.g., user ID, payload).
    -   It should use the private `_fetchFromUpmind` helper method or make direct `fetch` calls, ensuring proper headers (including `Authorization` if needed, `Origin`, `Referer`) are set.
    -   Define clear TypeScript interfaces for request payloads and expected API responses to ensure type safety.
3.  **Handle Responses:** Process the API response, transforming it into a standardized format (e.g., `{ success: true, data: ... }` or `{ success: false, error: ... }`) if necessary.
4.  **Update API Routes:** If the new Upmind functionality needs to be exposed via a backend API route in your Next.js app, create or update the relevant route in `src/app/api/` to call your new service method.

**Example Structure for a new method:**

```typescript
// In src/lib/services/upmind.ts

// Define interfaces for the new endpoint's request and response
interface NewUpmindFeatureRequest {
  // ... request parameters
}

interface NewUpmindFeatureResponseData {
  // ... expected data fields
}

interface NewUpmindFeatureApiResponse extends UpmindBaseResponse {
  data?: NewUpmindFeatureResponseData;
}

// ... inside UpmindService class
public async newUpmindFeature(params: NewUpmindFeatureRequest): Promise<UpmindServiceResponse<NewUpmindFeatureResponseData>> {
  try {
    // Replace with actual endpoint and method
    const response = await this._fetchFromUpmind<NewUpmindFeatureApiResponse>(
      '/path/to/new/feature',
      'POST',
      params
    );

    if (response.status === 'ok' && response.data) {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.error || 'Failed to perform new feature' };
    }
  } catch (error: any) {
    // ... error handling
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
```

### Braze Service (`src/lib/services/braze.ts`)

The `BrazeService` class manages interactions with the Braze Web SDK on the client-side. This includes initializing the SDK, identifying users, logging custom events, setting user attributes, and managing subscription group states.

**To add new Braze interactions:**

1.  **Identify Braze SDK Method:** Refer to the Braze Web SDK documentation for the appropriate method (e.g., `braze.logCustomEvent()`, `braze.getUser().setCustomAttribute()`, `braze.getUser().setSubscriptionGroupState()`).
2.  **Add a New Method to `BrazeService`:**
    -   Create a new public static method in the `BrazeService` class (as it's designed to be used statically after initialization).
    -   Ensure the Braze SDK is initialized (`BrazeService.isInitialized`) before calling any SDK methods.
    -   The method should accept necessary parameters (e.g., event name, properties, attribute name/value, group ID, state).
3.  **Call from Components:** Use the new `BrazeService` method from your React components where the interaction is needed.

**Example for logging a new custom event:**

```typescript
// In src/lib/services/braze.ts

// ... inside BrazeService class
public static logNewCustomEvent(eventName: string, eventProperties?: object): boolean {
  if (!this.isInitialized || !braze) {
    console.warn('Braze SDK not initialized. Cannot log event:', eventName);
    return false;
  }
  try {
    braze.logCustomEvent(eventName, eventProperties);
    console.log(`Braze: Logged custom event '${eventName}'`, eventProperties);
    return true;
  } catch (error) {
    console.error(`Braze: Error logging custom event '${eventName}':`, error);
    return false;
  }
}
```

**Key Methods in `BrazeService`:**

-   `initialize(apiKey, baseUrl, options)`: Initializes the Braze SDK. Called once at application startup.
-   `changeUser(userId, attributes?, subscriptionUpdates?)`: Changes the active Braze user, sets their attributes, and updates subscription group states. This is crucial after login/registration.
-   `logCustomEvent(eventName, eventProperties)`: Logs a custom event.
-   `setUserAttribute(attributeName, value)`: Sets a single custom attribute for the current user.
-   `updateSubscriptionGroups(subscriptionStates)`: Updates the state (subscribed/unsubscribed) for multiple subscription groups.

## API Routes (`src/app/api/`)

Next.js API routes handle backend logic. This project uses them as a bridge between the frontend and the Upmind service, ensuring sensitive operations and API keys are kept server-side.

-   `/api/auth/register`: Handles user registration requests from the frontend. It calls `UpmindService.register()`.
-   `/api/auth/login`: Handles user login requests. It calls `UpmindService.login()`.
-   Other routes can be added to interact with services or perform backend tasks.

When adding new backend functionality that involves Upmind or other server-side logic, create a new API route and call the appropriate service methods from within it.

## Linting and Formatting

This project is set up with ESLint and Prettier (or defaults from `create-next-app`). Ensure you follow the linting rules and format your code before committing.

```bash
# Lint check (example)
npm run lint

# Format check (example, if prettier is configured)
npm run format
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
