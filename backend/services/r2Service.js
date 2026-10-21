import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Read Cloudflare R2 configuration from environment variables
 */
export const getR2Config = () => {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = (process.env.R2_BUCKET_NAME || 'dataknow').toLowerCase();
  const publicUrl = process.env.R2_PUBLIC_URL || '';

  const isConfigured = Boolean(endpoint && accessKeyId && secretAccessKey && bucket);

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl,
    isConfigured
  };
};

let s3ClientInstance = null;

/**
 * Get or initialize the S3Client instance for Cloudflare R2
 */
export const getS3Client = () => {
  if (s3ClientInstance) return s3ClientInstance;
  const config = getR2Config();
  if (!config.isConfigured) return null;

  s3ClientInstance = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return s3ClientInstance;
};

/**
 * Check if Cloudflare R2 is configured
 */
export const isR2Configured = () => {
  return getR2Config().isConfigured;
};

/**
 * Upload a file buffer directly to Cloudflare R2
 */
export const uploadToR2 = async ({ key, buffer, contentType }) => {
  const client = getS3Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Check your environment variables.');
  }

  const config = getR2Config();
  const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
  }));

  return {
    key: cleanKey,
    url: getR2PublicUrl(cleanKey),
    size: buffer.length
  };
};

/**
 * Retrieve an object from Cloudflare R2 (with optional HTTP Range support)
 */
export const getFromR2 = async (key, range) => {
  const client = getS3Client();
  if (!client) return null;

  const config = getR2Config();
  const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

  const params = {
    Bucket: config.bucket,
    Key: cleanKey,
  };
  if (range) {
    params.Range = range;
  }

  const command = new GetObjectCommand(params);
  const response = await client.send(command);

  return {
    body: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    contentRange: response.ContentRange,
    acceptRanges: response.AcceptRanges,
    lastModified: response.LastModified,
    etag: response.ETag,
  };
};

/**
 * Delete an object from Cloudflare R2
 */
export const deleteFromR2 = async (key) => {
  const client = getS3Client();
  if (!client) return false;

  const config = getR2Config();
  const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
    }));
    return true;
  } catch (err) {
    console.error(`Failed to delete ${cleanKey} from R2:`, err.message);
    return false;
  }
};

/**
 * Generate a public URL for an R2 key (or relative path if no custom public domain)
 */
export const getR2PublicUrl = (key) => {
  const config = getR2Config();
  const cleanKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  if (config.publicUrl) {
    return `${config.publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }
  return `/${cleanKey}`;
};

/**
 * Custom Multer Storage Engine that uploads directly to Cloudflare R2 in memory
 * without writing any file to local disk.
 */
export function createR2Storage(opts = {}) {
  return {
    _handleFile(req, file, cb) {
      const resolveDestination = (done) => {
        if (typeof opts.destination === 'function') {
          opts.destination(req, file, done);
        } else if (typeof opts.destination === 'string') {
          done(null, opts.destination);
        } else {
          done(null, 'uploads');
        }
      };

      const resolveFilename = (done) => {
        if (typeof opts.filename === 'function') {
          opts.filename(req, file, done);
        } else {
          const ext = path.extname(file.originalname);
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          done(null, `${uniqueSuffix}${ext}`);
        }
      };

      resolveDestination((destErr, destination) => {
        if (destErr) return cb(destErr);

        resolveFilename((fileErr, filename) => {
          if (fileErr) return cb(fileErr);

          const chunks = [];
          file.stream.on('data', (chunk) => chunks.push(chunk));
          file.stream.on('error', (err) => cb(err));
          file.stream.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              
              // Standardize destination folder prefix (e.g. "uploads" or "uploads/news/2026-10-21")
              const cleanDest = (destination || 'uploads')
                .replace(/\\/g, '/')
                .replace(/^\.?\/*/, '')
                .replace(/\/+$/, '');

              const key = cleanDest ? `${cleanDest}/${filename}` : filename;

              await uploadToR2({
                key,
                buffer,
                contentType: file.mimetype || 'application/octet-stream',
              });

              // Populate file properties identical to multer.diskStorage
              const result = {
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                size: buffer.length,
                bucket: getR2Config().bucket,
                key: key,
                path: key, // e.g. "uploads/177123456.png" (matches DB expectation)
                destination: destination,
                filename: filename,
                location: getR2PublicUrl(key),
              };

              cb(null, result);
            } catch (uploadErr) {
              cb(uploadErr);
            }
          });
        });
      });
    },

    _removeFile(req, file, cb) {
      if (file.key || file.path) {
        deleteFromR2(file.key || file.path)
          .then(() => cb(null))
          .catch((err) => cb(err));
      } else {
        cb(null);
      }
    },
  };
}

export default {
  getR2Config,
  getS3Client,
  isR2Configured,
  uploadToR2,
  getFromR2,
  deleteFromR2,
  getR2PublicUrl,
  createR2Storage
};
