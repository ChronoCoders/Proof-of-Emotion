import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { requireAuth, loginHandler, logoutHandler, loginPageHandler } from "./middleware/auth";

// EmotionalChain - Proof of Emotion Blockchain Platform
// Initialize environment variables for Windows compatibility
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using in-memory SQLite for EmotionalChain');
  process.env.DATABASE_URL = 'sqlite://:memory:';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Windows-compatible network configuration
const isWindows = process.platform === 'win32';
const isDevelopment = process.env.NODE_ENV === 'development';

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'emotionalchain-session-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced logging middleware for EmotionalChain
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(`[EmotionalChain] ${logLine}`);
    }
  });

  next();
});

// CORS middleware for development
if (isDevelopment) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

(async () => {
  try {
    log("EmotionalChain PoE Blockchain Platform Starting...");
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Database: ${process.env.DATABASE_URL}`);
    log(`Platform: ${process.platform} ${isWindows ? '(Windows)' : ''}`);
    log(`Authentication: Enabled (chronocoder/talber1726)`);
    
    // PUBLIC ROUTES FIRST (before authentication)
    
    // Authentication routes (public)
    app.get('/login', loginPageHandler);
    app.post('/auth/login', loginHandler);
    app.post('/auth/logout', logoutHandler);

    // Health check (public)
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        platform: 'EmotionalChain PoE v2.0.0 with AI',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mlEngine: 'Enabled'
      });
    });

    // Register all API routes FIRST (before auth middleware)
    const server = await registerRoutes(app);
    
    // THEN apply authentication to protect frontend routes
    // Only protect the frontend routes, not API routes
    const protectedFrontendRoutes = ['/dashboard', '/validators', '/consensus', '/biometrics', '/testing-suite', '/analytics'];
    
    protectedFrontendRoutes.forEach(route => {
      app.get(route, requireAuth, (req, res, next) => {
        // Let Vite handle the frontend routing after auth check
        next();
      });
    });

    // Enhanced error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error: ${status} - ${message}`);
      res.status(status).json({ 
        message,
        error: isDevelopment ? err.stack : undefined,
        platform: "EmotionalChain PoE v2.0.0 with AI"
      });
      
      if (isDevelopment) {
        console.error(err);
      }
    });

    // Setup Vite development server or static serving
    if (isDevelopment) {
      log("Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      log("Serving static production build...");
      serveStatic(app);
    }

    // Root redirect with authentication check
    app.get('/', (req, res) => {
      if (req.session && req.session.authenticated) {
        res.redirect('/dashboard');
      } else {
        res.redirect('/login');
      }
    });

    // Network configuration - Windows compatible
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Choose host based on platform and environment
    let host: string;
    if (isWindows && isDevelopment) {
      // Windows development: use localhost to avoid ENOTSUP error
      host = 'localhost';
      log("Windows detected: Using localhost binding for development");
    } else if (isDevelopment) {
      // Unix development: use localhost for consistency
      host = 'localhost';
    } else {
      // Production: use 0.0.0.0 for external access
      host = '0.0.0.0';
    }

    // Server startup with proper error handling
    const startServer = () => {
      return new Promise<void>((resolve, reject) => {
        const serverInstance = server.listen({
          port,
          host,
          reusePort: !isWindows, // Windows doesn't support reusePort
        }, () => {
          log(`EmotionalChain server running on http://${host}:${port}`);
          log(`Access your revolutionary blockchain at: http://localhost:${port}`);
          log(`Login Page: http://localhost:${port}/login`);
          log(`Dashboard: http://localhost:${port}/dashboard`);
          log(`Analytics: http://localhost:${port}/analytics`);
          log(`API Base: http://localhost:${port}/api`);
          log(`WebSocket: ws://localhost:${port}/ws`);
          log(`Status: AI-Enhanced Proof of Emotion consensus ready!`);
          log(`Credentials: chronocoder / talber1726`);
          log(`ML Engine: Operational`);
          resolve();
        });

        serverInstance.on('error', (err: any) => {
          if (err.code === 'ENOTSUP' && host === '0.0.0.0' && isWindows) {
            log("Windows network binding issue detected, retrying with localhost...");
            // Retry with localhost on Windows
            server.listen({
              port,
              host: 'localhost',
            }, () => {
              log(`EmotionalChain server running on http://localhost:${port}`);
              log(`Access your revolutionary blockchain at: http://localhost:${port}`);
              log(`Credentials: chronocoder / talber1726`);
              resolve();
            });
          } else if (err.code === 'EADDRINUSE') {
            log(`Port ${port} is already in use. Try a different port:`);
            log(`   Windows: set PORT=8080 && npm run dev`);
            log(`   Unix: PORT=8080 npm run dev`);
            reject(err);
          } else {
            log(`Server startup failed: ${err.message}`);
            reject(err);
          }
        });
      });
    };

    await startServer();

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      log("EmotionalChain server shutting down gracefully...");
      server.close(() => {
        log("EmotionalChain server stopped");
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Windows-specific signal handling
    if (isWindows) {
      process.on('SIGBREAK', gracefulShutdown);
    }

  } catch (error) {
    log(`Failed to start EmotionalChain server: ${error}`);
    console.error(error);
    process.exit(1);
  }
})();