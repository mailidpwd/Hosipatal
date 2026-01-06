import { createServer } from "http";
import { WebSocketServer } from "ws";
import { env } from "@hosipatal/env/server";
import { testConnection } from "./db";

// Import the Hono app
import { app } from "./index";

// Create HTTP server for local development
const httpServer = createServer(async (req, res) => {
  try {
    // Convert Node.js request to Fetch API Request
    const protocol = (req.socket as any).encrypted ? "https" : "http";
    const host = req.headers.host || "localhost:3000";
    const url = `${protocol}://${host}${req.url}`;

    // Read body if present
    let body: Buffer | undefined;
    if (req.method && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve) => {
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          if (chunks.length > 0) {
            body = Buffer.concat(chunks);
          }
          resolve();
        });
        req.on("error", () => resolve());
      });
    }

    // Create headers
    const headers = new Headers();
    if (req.headers) {
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) {
          if (typeof value === "string") {
            headers.set(key, value);
          } else if (Array.isArray(value)) {
            headers.set(key, value.join(", "));
          }
        }
      });
    }

    // Create Fetch API Request
    const requestInit: RequestInit = {
      method: req.method || "GET",
      headers,
    };
    if (body) {
      (requestInit as any).body = body;
    }

    const request = new Request(url, requestInit);

    // Handle with Hono app
    const response = await app.fetch(request);

    // Write response
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== "content-encoding" &&
        lowerKey !== "transfer-encoding" &&
        lowerKey !== "connection" &&
        lowerKey !== "content-length"
      ) {
        res.setHeader(key, value);
      }
    });

    // Stream response body
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (error: any) {
    console.error("Server error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      res.end(`Internal Server Error: ${error?.message || "Unknown error"}`);
    }
  }
});

// WebSocket server (development only)
const wss = new WebSocketServer({
  server: httpServer,
  path: "/ws",
});

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
  ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
  
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      } else if (data.type === "subscribe") {
        ws.send(JSON.stringify({
          type: "subscribed",
          channel: data.channel,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error("WebSocket error:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "heartbeat", timestamp: Date.now() }));
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);
});

// SSE endpoint (development only)
httpServer.on("request", (req, res) => {
  if (req.url === "/sse" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const sendSSE = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendSSE({ type: "connected", timestamp: Date.now() });

    const interval = setInterval(() => {
      if (!res.destroyed && !res.closed) {
        sendSSE({ type: "heartbeat", timestamp: Date.now() });
      } else {
        clearInterval(interval);
      }
    }, 10000);

    req.on("close", () => {
      clearInterval(interval);
      if (!res.destroyed) {
        res.end();
      }
    });
  }
});

// Start server
const PORT = env.WS_PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`\n🚀 Development server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server on ws://localhost:${PORT}/ws`);
  console.log(`📨 SSE endpoint on http://localhost:${PORT}/sse`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);

  // Test MongoDB connection
  testConnection()
    .then((result) => {
      if (result.success) {
        console.log("✅ MongoDB:", result.message);
      } else {
        console.warn("⚠️  MongoDB:", result.message);
      }
    })
    .catch((error) => {
      console.warn("⚠️  MongoDB connection test failed:", error.message);
    });
});

