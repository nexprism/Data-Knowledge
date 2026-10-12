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

// Setup Socket.io server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)*dataknowledge\.in(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/([a-zA-Z0-9-]+\.)*onrender\.com$/.test(origin)) return callback(null, true);
      return callback(null, true);
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
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.io running on port ${PORT}`);
});
