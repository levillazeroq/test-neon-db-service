import { NextRequest, NextResponse } from "next/server";

/**
 * Validates the API key from the request headers.
 * If ZEROQ_API_KEY is not set in env, auth is skipped (local dev).
 *
 * @returns NextResponse with 401 if invalid, null if valid
 */
export const validateApiKey = (request: NextRequest): NextResponse | null => {
  const apiKey = process.env.ZEROQ_API_KEY;

  // Skip auth if no API key is configured (local dev)
  if (!apiKey) {
    return null;
  }

  const providedKey = request.headers.get("x-api-key");

  if (!providedKey || providedKey !== apiKey) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or missing API key" },
      { status: 401 },
    );
  }

  return null;
};

/** Standard error response for API routes */
export const apiErrorResponse = (
  error: unknown,
  status = 500,
): NextResponse => {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ success: false, error: message }, { status });
};
