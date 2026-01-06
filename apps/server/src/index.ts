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
import { getConnInfo } from "@hono/node-server/conninfo";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { testConnection } from "./db";

const app = new Hono();

app.use(logger());
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
      // In production, use the configured CORS_ORIGIN
      return env.CORS_ORIGIN;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse((rpcResult.response as any).body, rpcResult.response as any);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse((apiResult.response as any).body, apiResult.response as any);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

// Add health check endpoint with DB status
app.get("/health", async (c) => {
  try {
    const dbStatus = await testConnection();
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error: any) {
    return c.json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: {
        success: false,
        message: error.message || 'Database connection failed'
      }
    }, 500);
  }
});

// SSE endpoint for real-time updates - handle directly in HTTP server
// (Not using Hono app route to ensure proper SSE streaming)

// Create HTTP server for WebSocket support
// Use @hono/node-server adapter to convert Node.js requests to Fetch API
const httpServer = createServer(async (req, res) => {
  // Handle SSE endpoint directly (before Hono app processing)
  if (req.url === '/sse' && req.method === 'GET') {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    const sendSSE = (data: any, event?: string) => {
      const eventLine = event ? `event: ${event}\n` : '';
      const dataLine = `data: ${JSON.stringify(data)}\n\n`;
      try {
        res.write(eventLine + dataLine);
      } catch (error) {
        // Connection closed
      }
    };

    sendSSE({
      type: 'connected',
      timestamp: Date.now()
    });

    // Keep connection alive with periodic heartbeats
    const interval = setInterval(() => {
      try {
        if (!res.destroyed && !res.closed) {
          sendSSE({
            type: 'heartbeat',
            timestamp: Date.now()
          });
        } else {
          clearInterval(interval);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 10000);

    // Clean up on close
    req.on('close', () => {
      clearInterval(interval);
      if (!res.destroyed) {
        try {
          res.end();
        } catch (e) {
          // Already closed
        }
      }
    });

    req.on('aborted', () => {
      clearInterval(interval);
      if (!res.destroyed) {
        try {
          res.end();
        } catch (e) {
          // Already closed
        }
      }
    });

    return; // Don't process through Hono app
  }

  try {
    // Build URL
    let url: string;
    try {
      const protocol = (req.socket as any).encrypted ? 'https' : 'http';
      const host = req.headers.host || 'localhost:3000';
      url = `${protocol}://${host}${req.url}`;
    } catch (err: any) {
      console.error('Error building URL:', err);
      res.statusCode = 500;
      res.end('Internal Server Error: URL building failed');
      return;
    }

    // Read body if present (for POST/PUT requests)
    let body: Buffer | undefined;
    const needsBody = req.method && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';

    if (needsBody) {
      try {
        const chunks: Buffer[] = [];
        let bodyRead = false;

        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            if (!bodyRead) {
              bodyRead = true;
              resolve(); // Resolve even if no body data
            }
          }, 100); // Short timeout for empty bodies

          req.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          req.on('end', () => {
            clearTimeout(timeout);
            if (!bodyRead) {
              bodyRead = true;
              if (chunks.length > 0) {
                body = Buffer.concat(chunks);
              }
              resolve();
            }
          });

          req.on('error', (err) => {
            clearTimeout(timeout);
            if (!bodyRead) {
              bodyRead = true;
              console.error('Request body read error:', err);
              resolve(); // Resolve anyway to continue
            }
          });
        });
      } catch (err: any) {
        console.error('Error reading body:', err);
        // Continue without body
      }
    }

    // Create headers
    let headers: Headers;
    try {
      headers = new Headers();
      if (req.headers) {
        Object.entries(req.headers).forEach(([key, value]) => {
          if (value) {
            if (typeof value === 'string') {
              headers.append(key, value);
            } else if (Array.isArray(value)) {
              headers.append(key, value.join(', '));
            }
          }
        });
      }
    } catch (err: any) {
      console.error('Error creating headers:', err);
      res.statusCode = 500;
      res.end('Internal Server Error: Header creation failed');
      return;
    }

    // Create Fetch API Request
    let request: Request;
    try {
      const requestInit: RequestInit = {
        method: req.method || 'GET',
        headers,
      };

      if (body) {
        (requestInit as any).body = body;
      }

      request = new Request(url, requestInit);
    } catch (err: any) {
      console.error('Error creating Request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error: Request creation failed');
      return;
    }

    // Get connection info for Hono
    let connInfo: any;
    try {
      connInfo = getConnInfo({ req, res } as any);
    } catch (err: any) {
      console.error('Error getting connInfo:', err);
      // Continue without connInfo - Hono should handle it
      connInfo = undefined;
    }

    // Handle request with Hono app
    let response: Response;
    try {
      response = await app.fetch(request, connInfo);
    } catch (err: any) {
      console.error('Error in app.fetch:', err);
      console.error('Error stack:', err?.stack);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`Internal Server Error: ${err?.message || 'Request handling failed'}`);
      return;
    }

    // Write status and headers
    if (!res.headersSent) {
      res.statusCode = (response as any).status;
      ((response as any).headers as Headers).forEach((value: string, key: string) => {
        // Skip problematic headers that Node.js handles
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'content-encoding' &&
          lowerKey !== 'transfer-encoding' &&
          lowerKey !== 'connection' &&
          lowerKey !== 'content-length') {
          try {
            res.setHeader(key, value);
          } catch (e) {
            // Ignore header setting errors (e.g., invalid header values)
          }
        }
      });
    }

    // Stream response body
    if ((response as any).body) {
      const reader = ((response as any).body as ReadableStream<Uint8Array>).getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            if (value && value.length > 0) {
              res.write(Buffer.from(value));
            }
          }
        } catch (err) {
          console.error('Response stream error:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
          }
          try {
            res.end();
          } catch (e) {
            // Response already ended
          }
        }
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('Server request error:', err);
    console.error('Error stack:', err?.stack);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      try {
        res.end(`Internal Server Error: ${err?.message || 'Unknown error'}`);
      } catch (e) {
        // Response already ended or connection closed
      }
    } else {
      try {
        res.end();
      } catch (e) {
        // Response already ended
      }
    }
  }
});

// WebSocket server - attach to the HTTP server
const wss = new WebSocketServer({
  server: httpServer,
  path: '/ws',
});

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected from:', req.socket.remoteAddress);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    timestamp: Date.now()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('WebSocket message received:', data);

      // Handle different message types
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      } else if (data.type === 'subscribe') {
        // Handle subscription to channels (health, wallet, etc.)
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);
});

// Initialize database connection on startup
async function startServer() {
  try {
    // Start HTTP server with WebSocket support FIRST (don't wait for MongoDB)
    const PORT = 3000;
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server on ws://localhost:${PORT}/ws`);
      console.log(`📨 SSE endpoint on http://localhost:${PORT}/sse`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });

    // Test MongoDB connection in background (non-blocking)
    console.log('\n🔍 Testing MongoDB connection (non-blocking)...');
    testConnection()
      .then(dbTest => {
        if (dbTest.success) {
          console.log('✅ MongoDB Connection Test:', dbTest.message);
          if (dbTest.details) {
            console.log('   Database:', dbTest.details.database);
            console.log('   Server Version:', dbTest.details.serverVersion);
            console.log('   Collections:', dbTest.details.collections);
            console.log('   Data Size:', dbTest.details.dataSize);
          }
        } else {
          console.warn('⚠️  MongoDB Connection Test Failed:', dbTest.message);
          console.warn('   Server will continue but database features may not work.');
        }
      })
      .catch(error => {
        console.warn('⚠️  MongoDB Connection Test Error:', error.message || error);
        console.warn('   Server will continue but database features may not work.');
      });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
