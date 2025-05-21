// API Route: /api/health
import { NextResponse } from 'next/server';

/**
 * @async
 * @function GET
 * @description Handles GET requests to the `/api/health` endpoint.
 * This endpoint serves as a simple health check for the application's backend.
 * - On success, it returns a JSON response with `status: 'OK'` and the current `timestamp`.
 * - If an unexpected error occurs during the health check, it logs the error and returns a 500 server error
 *   with `success: false` and a generic error message.
 *
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js API response object indicating the health status or an error message.
 */
export async function GET() {
  try {
    console.log('API /api/health called');
    return NextResponse.json({ status: 'OK', timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Health API Error:', err.message);
    // Always returns status 500 and a generic message, similar to braze-config
    return NextResponse.json({ success: false, error: 'Health check failed.' }, { status: 500 });
  }
}
