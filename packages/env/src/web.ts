import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.string().url().default("http://127.0.0.1:3000"),
    VITE_WS_URL: z.string().url().optional(),
    VITE_SSE_URL: z.string().url().optional(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
