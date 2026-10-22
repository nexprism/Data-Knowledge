import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}
import mongoose from 'mongoose';
import User from './models/User.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find().select('_id fullName email role');
  console.log("Users:", users);
  process.exit(0);
}
run();
