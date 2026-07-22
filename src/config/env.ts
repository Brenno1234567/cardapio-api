import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().default("file:local.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175"),
  JWT_SECRET: z.string().min(16).default("change-this-secret-before-deploy"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@ervadoce.com"),
  SEED_ADMIN_PASSWORD: z.string().min(6).default("123456")
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

