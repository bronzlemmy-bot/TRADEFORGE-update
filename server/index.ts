
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Allow a standalone Vite client or deployed frontend to call the API.
const configuredClientOrigin = process.env.CLIENT_ORIGIN;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isLocalDevelopmentOrigin =
    origin === "http://localhost:5173" ||
    origin === "http://127.0.0.1:5173";

  const isAllowedOrigin =
    Boolean(origin) &&
    (origin === configuredClientOrigin ||
      (!configuredClientOrigin && isLocalDevelopmentOrigin));

  if (isAllowedOrigin && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    );
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(isAllowedOrigin ? 204 : 403);
  }

  next();
});

// Middleware for logging API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);

  res.json = (bodyJson: any) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;

    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    log(logLine);
  });

  next();
});

(async () => {
  // Register all routes
  const server = await registerRoutes(app);

  // Global error handler
  app.use(
    (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      log(`Error: ${message}`);
      // Do not throw in production; server keeps running
    },
  );

  // Vite dev server in development, static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Port configuration
  const DEFAULT_PORT = 5000;
  const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

  server
    .listen({ port }, () => {
      log(`Server running on http://localhost:${port}`);
    })
    .on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        log(
          `Port ${port} is already in use. The backend may already be running at http://localhost:${port}; stop the existing server or set PORT to another port.`,
        );
      } else {
        log(`Failed to start server on port ${port}: ${err.message}`);
      }

      process.exit(1);
    });
})();
