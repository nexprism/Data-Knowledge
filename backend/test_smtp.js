import emailService from './utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log("Testing SMTP transporters for Data Knowledge...");
  try {
    const t = emailService.getTransporter("transactional");
    await t.verify();
    console.log("✅ Primary SMTP Port 465 (Transactional): VERIFIED");
  } catch (err) {
    console.warn("⚠️ Primary Port 465 failed:", err.message);
  }

  try {
    const creds = emailService._getCredentials("transactional");
    const fallback = emailService._createTransporter(creds.user, creds.pass, 587, false);
    await fallback.verify();
    console.log("✅ Fallback SMTP Port 587 (Transactional): VERIFIED");
  } catch (err) {
    console.warn("⚠️ Fallback Port 587 failed:", err.message);
  }

  console.log("\nAll SMTP checks finished.");
}

run();
