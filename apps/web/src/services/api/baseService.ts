import { client } from '@/utils/orpc';
import type { AppRouterClient } from '@hosipatal/api/routers/index';

/**
 * Base API service with session handling and error management
 * All API services should extend or use this base service
 */
export class BaseService {
  protected client: AppRouterClient;

  constructor() {
    // Use the orpc client directly - it can be called without .query() or .mutate()
    this.client = client;
  }

  /**
   * Handle API errors with retry logic
   * Simplified version without global abort signals to prevent race conditions
   */
  protected async handleRequest<T>(
    request: () => Promise<T>,
    retries = 3
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Execute the request
        const result = await request();
        return result;
      } catch (error: any) {
        lastError = error;

        // Log error details for debugging (only first attempt to avoid spam)
        if (attempt === 0) {
          console.warn(`[BaseService] Request failed (attempt ${attempt + 1}/${retries + 1}):`, error?.message || error);
        }

        // Handle session expiry - don't retry
        if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
          throw new Error('Session expired. Please login again.');
        }

        // Handle ORPC/API errors - these have response data, don't retry 4xx errors
        if (error?.data || error?.response) {
          const errorMessage = error?.data?.message || error?.message || 'Request failed';
          throw new Error(errorMessage);
        }

        // Handle orpc-specific client errors - don't retry
        if (error?.message?.includes('is not a function')) {
          console.error('ORPC client error:', error);
          throw new Error('API configuration error. Please refresh the page and try again.');
        }

        // Handle network errors - retry with exponential backoff
        const isNetworkError =
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('NetworkError') ||
          error?.message?.includes('Network request failed') ||
          error?.code === 'NETWORK_ERROR' ||
          error?.name === 'NetworkError' ||
          error?.name === 'TypeError';

        if (isNetworkError && attempt < retries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          if (isNetworkError) {
            throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
          }
          const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
          throw new Error(errorMessage);
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Check if user is authenticated
   */
  protected isAuthenticated(): boolean {
    // Session is managed via cookies, so we check by attempting a request
    // This will be enhanced when AuthContext is implemented
    return true;
  }
}
