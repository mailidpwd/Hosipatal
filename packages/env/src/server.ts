import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CORS_ORIGIN: z.string().default("http://localhost:3002"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    SESSION_SECRET: z.string().min(32).optional(),
    WS_PORT: z.coerce.number().default(3001).optional(),
    DATABASE_URL: z.string().url().optional(),
  },
  clientPrefix: "PUBLIC_",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
