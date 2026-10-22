import emailService from './utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log("Testing SMTP transporters for Data Knowledge...\n");

  const types = ["transactional", "founder", "support"];
  for (const type of types) {
    try {
      console.log(`Checking [${type}] transporter...`);
      const t = emailService.getTransporter(type);
      await t.verify();
      console.log(`✅ [${type}] Port 465 SSL verified successfully! From: ${emailService.getFrom(type)}`);
    } catch (err) {
      console.warn(`⚠️ [${type}] Port 465 failed: ${err.message}`);
      try {
        const creds = emailService._getCredentials(type);
        const fallback = emailService._createTransporter(creds.user, creds.pass, 587, false);
        await fallback.verify();
        console.log(`✅ [${type}] Fallback Port 587 verified successfully!`);
      } catch (fallbackErr) {
        console.error(`❌ [${type}] Fallback Port 587 also failed: ${fallbackErr.message}`);
      }
    }
    console.log("-----------------------------------------");
  }

  console.log("All SMTP checks completed.");
}

run();
