import { createContext } from "@hosipatal/api/context";
import { appRouter } from "@hosipatal/api/routers/index";
import { env } from "@hosipatal/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handle } from "@hono/node-server/vercel";

const app = new Hono();

// Add logger only in development
if (env.NODE_ENV === "development") {
  app.use(logger());
}

// CORS configuration - allow multiple production origins
const ALLOWED_ORIGINS = [
  env.CORS_ORIGIN, // Primary origin from env
  "https://hosipatal-web.vercel.app",
  "https://rdm-healthcare-web.vercel.app",
];

app.use(
  "/*",
  cors({
    origin: (origin) => {
      // Allow requests from localhost on any port in development
      if (env.NODE_ENV === "development") {
        if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
          return origin || env.CORS_ORIGIN;
        }
      }
      // In production, check against allowed origins list
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return origin;
      }
      // Fallback to env CORS_ORIGIN
      return env.CORS_ORIGIN;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Initialize handlers
export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error("[API Handler Error]:", error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error("[RPC Handler Error]:", error);
    }),
  ],
});

// Main request handler
app.use("/*", async (c, next) => {
  try {
    const context = await createContext({ context: c });

    // Try RPC handler first
    const rpcResult = await rpcHandler.handle(c.req.raw, {
      prefix: "/rpc",
      context: context,
    });

    if (rpcResult.matched) {
      return c.newResponse((rpcResult.response as any).body, rpcResult.response as any);
    }

    // Try API handler
    const apiResult = await apiHandler.handle(c.req.raw, {
      prefix: "/api-reference",
      context: context,
    });

    if (apiResult.matched) {
      return c.newResponse((apiResult.response as any).body, apiResult.response as any);
    }

    await next();
  } catch (error: any) {
    console.error("[Request Handler Error]:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: error?.message || "An unexpected error occurred",
      },
      500
    );
  }
});

// Health check endpoint
app.get("/", (c) => {
  return c.text("OK");
});

// Health check with optional DB status
app.get("/health", async (c) => {
  try {
    // Import testConnection only when needed (lazy load to avoid issues in serverless)
    const { testConnection } = await import("./db");
    const dbStatus = await testConnection();
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (error: any) {
    // Return ok status even if DB fails - server is still functional
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        success: false,
        message: error?.message || "Database connection not available",
      },
    });
  }
});

// Export app for use in dev-server
export { app };

// Export for Vercel serverless
export default handle(app);
