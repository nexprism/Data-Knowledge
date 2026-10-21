import multer from "multer";
import path from "path";

import { createR2Storage, isR2Configured } from "../services/r2Service.js";

const ALLOWED_MIME = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/aac', 'audio/webm',
  'video/mp4', 'video/mpeg', 'video/webm', 'video/ogg', 'video/x-msvideo',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const r2Storage = createR2Storage({
  destination: "uploads",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const storage = isR2Configured() ? r2Storage : diskStorage;

const fileFilter = (req, file, cb) => {
  console.log("File Name:", file.originalname);
  console.log("MIME Type:", file.mimetype);

  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log("Unsupported MIME:", file.mimetype);
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
export { upload };
