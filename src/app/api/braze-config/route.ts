// API Route: /api/braze-config
import { NextResponse } from 'next/server';

import { UPMIND_TO_BRAZE_MAP } from '@/config/brazeConfig';

/**
 * @async
 * @function GET
 * @description Handles GET requests to the `/api/braze-config` endpoint.
 * This endpoint provides server-side Braze configurations that might be needed by the client,
 * such as the mapping between Upmind notification preferences and Braze subscription group IDs.
 * The primary Braze API key and SDK endpoint are expected to be available client-side via
 * `NEXT_PUBLIC_` environment variables and are not served by this endpoint.
 *
 * It relies on `UPMIND_TO_BRAZE_MAP` imported from `@/config/brazeConfig.ts`.
 * - If `UPMIND_TO_BRAZE_MAP` is defined, it returns a JSON response with `success: true` and the
 *   `subscriptionGroups` (which is the `UPMIND_TO_BRAZE_MAP`).
 * - If `UPMIND_TO_BRAZE_MAP` is not defined or empty, it logs an error and returns a 500 server error
 *   with `success: false` and an error message.
 * - For other unexpected errors, it logs the error and returns a 500 server error.
 *
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js API response object containing Braze configuration data or an error message.
 */
export async function GET() {
  try {
    // The NEXT_PUBLIC_BRAZE_API_KEY and NEXT_PUBLIC_BRAZE_SDK_ENDPOINT are already available client-side
    // This route will provide other necessary configurations, like subscription group mappings.
    
    if (!UPMIND_TO_BRAZE_MAP) {
        console.error('Braze UPMIND_TO_BRAZE_MAP is not defined or empty in @/config/brazeConfig.ts');
        return NextResponse.json({ success: false, error: 'Braze subscription group configuration is missing on the server.' }, { status: 500 });
    }

    console.log('API /api/braze-config called, returning subscription group mappings.');
    return NextResponse.json({ success: true, subscriptionGroups: UPMIND_TO_BRAZE_MAP });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Braze Config API Error:', err.message);
    // For this specific error, we always return status 500 and a generic message.
    // We don't seem to use error.status here.
    return NextResponse.json({ success: false, error: 'Failed to retrieve Braze configuration.' }, { status: 500 });
  }
}
