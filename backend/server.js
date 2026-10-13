import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import videoSocketHandler from "./sockets/videoSocketHandler.js";
import chatSocketHandler from "./sockets/chatSocketHandler.js";
import { setIO } from "./utils/socketEmitter.js";

dotenv.config();

// Create HTTP server (required for Socket.io)
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === "production";
const serverAllowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:3000",
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
].filter(Boolean));

// Setup Socket.io server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)*dataknowledge\.in(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)*onrender\.com$/.test(origin)) return callback(null, true);
      if (serverAllowedOrigins.has(origin)) return callback(null, true);
      callback(new Error('Origin not allowed by CORS'), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"], // recommended to avoid fallback polling
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
});

io.use((socket, next) => {
  //console.log("Handshake token:", socket.handshake.auth);
  next();
});

// Make io accessible to controllers for emitting events
setIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    socket.userId = decoded.id;
    socket.userRole = decoded.role || decoded.roles;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

// Socket event listener
io.on("connection", (socket) => {
  // Join admin users to a dedicated room for admin notifications
  if (socket.userRole === "admin") {
    socket.join("admin-room");
  }

  chatSocketHandler(socket, io);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.io running on port ${PORT}`);
});
