import type { AppRouterClient } from "@hosipatal/api/routers/index";

import { env } from "@hosipatal/env/web";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// Notifications disabled - create a no-op toast function
const toast = {
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  loading: () => ({ dismiss: () => {} }),
  dismiss: () => {},
} as any;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Notifications disabled
      // if (!query.meta?.silent) {
      //   toast.error(`Error: ${error.message}`, {
      //     action: {
      //       label: "retry",
      //       onClick: query.invalidate,
      //     },
      //   });
      // }
      console.error('[QueryCache] Error:', error.message);
    },
  }),
  defaultOptions: {
    queries: {
      // Reduce aggressive refetching
      staleTime: 30000, // 30 seconds
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * (attemptIndex + 1), 5000),
    },
  },
});

// Log server URL for debugging
// Force 127.0.0.1 instead of localhost to avoid IPv6 resolution issues
const rawServerUrl = env.VITE_SERVER_URL;
const serverUrl = rawServerUrl?.includes('localhost')
  ? rawServerUrl.replace('localhost', '127.0.0.1')
  : (rawServerUrl || 'http://127.0.0.1:3000');
console.log('[ORPC Client] Initializing with server URL:', serverUrl);

export const link = new RPCLink({
  url: `${serverUrl}/rpc`,
  fetch: (url, options) => {
    // Simple fetch override - add credentials for CORS
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

// Export client for direct use if needed
export { client as orpcClient };
