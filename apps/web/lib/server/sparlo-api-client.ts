import 'server-only';

/**
 * Get the Sparlo API base URL.
 * - In Railway production: uses internal networking (no port needed)
 * - Locally: uses SPARLO_API_URL or localhost:8000
 */
function getSparloApiUrl(): string {
  // Check if we should use Railway internal networking
  // SPARLO_BACKEND_HOST being set indicates Railway deployment
  const backendHost = process.env.SPARLO_BACKEND_HOST;
  if (backendHost) {
    // Railway internal networking requires the port
    const backendPort = process.env.SPARLO_BACKEND_PORT || '8080';
    return `http://${backendHost}.railway.internal:${backendPort}`;
  }
  return process.env.SPARLO_API_URL || 'http://localhost:8000';
}

interface SparloApiError extends Error {
  status?: number;
}

/**
 * Call the Sparlo backend API with proper authentication, timeouts, and error handling.
 */
export async function callSparloApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getSparloApiUrl();
  const url = `${baseUrl}${endpoint}`;

  console.log(`[Sparlo API] Calling: ${url}`);
  console.log(
    `[Sparlo API] SPARLO_BACKEND_HOST: ${process.env.SPARLO_BACKEND_HOST}`,
  );

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SPARLO_INTERNAL_API_KEY || '',
        ...options.headers,
      },
      // 3 minute timeout for long-running LLM chains
      signal: options.signal || AbortSignal.timeout(180000),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ detail: 'Request failed' }));
      const error: SparloApiError = new Error(
        errorBody.detail || 'API request failed',
      );
      error.status = response.status;
      throw error;
    }

    return response.json() as Promise<T>;
  } catch (error: unknown) {
    console.error(`[Sparlo API] Error calling ${url}:`, error);

    // Handle network-level errors with specific messages
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        const timeoutError: SparloApiError = new Error(
          'Request timeout - analysis taking longer than expected',
        );
        timeoutError.status = 504;
        throw timeoutError;
      }
      if (
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ECONNREFUSED'
      ) {
        const connError: SparloApiError = new Error(
          'Backend service unavailable',
        );
        connError.status = 503;
        throw connError;
      }
    }
    throw error;
  }
}
