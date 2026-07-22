import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOrigins, env } from "./config/env.js";
import { errorHandler } from "./common/errors.js";
import { routes } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "cardapio-api",
      endpoints: {
        health: "/health",
        restaurant: "/api/public/restaurant",
        categories: "/api/public/categories",
        products: "/api/public/products",
        login: "/api/auth/login"
      }
    });
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "cardapio-api",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api", routes);

  app.use((_req, res) => {
    res.status(404).json({
      error: "NotFound",
      message: "Rota não encontrada"
    });
  });

  app.use(errorHandler);

  return app;
}
