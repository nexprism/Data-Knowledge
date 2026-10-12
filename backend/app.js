import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Passport JWT strategy before using passport
import "./config/jwt-authenticate.js";

const app = express();

// Trust reverse proxy (Render, Cloudflare, AWS, etc.) for HTTPS detection & cookies
app.set("trust proxy", 1);

// CORS config — dynamic origin to support credentials (wildcard '*' is
// incompatible with credentials:true per the browser spec)
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://dataknowledge.in",
  "https://www.dataknowledge.in",
  "https://api.dataknowledge.in",
  "https://admin.dataknowledge.in",
  "https://classes.dataknowledge.in",
  "https://data-knowledge.onrender.com",
  "https://dataknowledge.vercel.app",
  "https://dataknowledgeadmin.vercel.app",
  "https://edrilla.com",
  "https://www.edrilla.com",
  "https://admin.edrilla.com",
  "https://api.edrilla.com",
  "http://edrila.nexprism.in",
  "https://edrila.nexprism.in",
  "https://lapaas.com",
  "https://www.lapaas.com",
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any localhost port or 127.0.0.1 for local development
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow all dataknowledge.in domains and subdomains
    if (/^https?:\/\/([a-zA-Z0-9-]+\.)*dataknowledge\.in(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow Vercel deployments (*.vercel.app)
    if (/^https?:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) return callback(null, true);
    // Allow Render deployments (*.onrender.com)
    if (/^https?:\/\/([a-zA-Z0-9-]+\.)*onrender\.com$/.test(origin)) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Deny unknown origins cleanly without throwing a 500 error
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  optionsSuccessStatus: 200,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-access-token",
    "x-refresh-token",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "Range",
  ],
  exposedHeaders: ["x-access-token", "x-refresh-token"],
};
app.use(cors(corsOptions));
// Handle OPTIONS preflight for all routes (path-to-regexp v8+ compatible syntax)
app.options("/{*splat}", cors(corsOptions));

// Serve static files with CORS enabled
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Increase body parser limits and timeouts for large file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Apply auth rate limiter to login, signup, and OTP routes
app.use('/login', authLimiter);
app.use('/signup', authLimiter);
app.use('/sendotp', authLimiter);
app.use('/verifyotp', authLimiter);
app.use('/forgot-password', authLimiter);
app.use('/reset-password', authLimiter);

// Set global timeouts for large file operations
app.use((req, res, next) => {
  // Set much longer timeouts for chunk upload routes
  if (req.path.includes('/chunk') || req.path.includes('/upload')) {
    req.setTimeout(7200000); // 120 minutes (2 hours)
    res.setTimeout(7200000); // 120 minutes (2 hours)
  } else if (req.path.includes('/video') || req.path.includes('/file')) {
    req.setTimeout(1800000); // 30 minutes for video/file operations
    res.setTimeout(1800000); // 30 minutes for video/file operations
  } else {
    req.setTimeout(600000); // 10 minutes for other routes
    res.setTimeout(600000); // 10 minutes for other routes
  }
  next();
});

// Debug (optional)

// API Routes
app.use("/", routes);

export default app;

