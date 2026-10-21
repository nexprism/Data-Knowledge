import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { createR2Storage, isR2Configured } from '../services/r2Service.js';

// Allowed mime types for videos
const ALLOWED_MIME = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo', // AVI
  'video/x-ms-wmv', // WMV
  'video/mpeg',
];

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date().toISOString().slice(0, 10);
    const dir = path.join(process.cwd(), 'uploads', 'courses', 'content', 'videos', today);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const safe = originalName.replace(/[\/\\]/g, '_').trim();
    cb(null, safe);
  }
});

const r2Storage = createR2Storage({
  destination: (req, file, cb) => {
    const today = new Date().toISOString().slice(0, 10);
    cb(null, `uploads/courses/content/videos/${today}`);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const safe = originalName.replace(/[\/\\]/g, '_').trim();
    cb(null, safe);
  }
});

const storage = isR2Configured() ? r2Storage : diskStorage;

const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Also check file extension as fallback
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.mpeg', '.mpg'];
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only videos are allowed (MP4, WebM, OGG, MOV, AVI, WMV, MPEG)'), false);
    }
  }
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB per file (videos are larger)
});

