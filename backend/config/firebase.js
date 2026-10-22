// config/firebase.js
import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import path from "path";

let serviceAccount = null;

// 1. Try reading from environment variable (ideal for Render / production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
  }
}

// 2. Fallback to local file if available
if (!serviceAccount) {
  const serviceAccountPath = path.resolve("./config/firebase-service-account.json");
  if (existsSync(serviceAccountPath)) {
    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    } catch (err) {
      console.error("❌ Error reading config/firebase-service-account.json:", err.message);
    }
  }
}

// 3. Initialize Firebase Admin SDK
if (serviceAccount && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing Firebase Admin:", err.message);
  }
} else if (!serviceAccount) {
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT env variable on Render or provide config/firebase-service-account.json");
  } else {
    console.log("ℹ️ Firebase credentials missing (optional in local dev, push notifications disabled).");
  }
}

export default admin;
