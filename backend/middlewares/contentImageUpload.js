import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { createR2Storage, isR2Configured } from '../services/r2Service.js';

// Allowed mime types for images
const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/jfif', // JPEG File Interchange Format
];

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date().toISOString().slice(0, 10);
    const dir = path.join(process.cwd(), 'uploads', 'news', 'content', today);
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
    cb(null, `uploads/news/content/${today}`);
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
    // Also check file extension as fallback (some browsers may not send correct MIME type)
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.jfif'];
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only images are allowed (PNG, JPEG, JPG, GIF, WEBP, SVG, JFIF)'), false);
    }
  }
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB per file
});

