import dotenv from 'dotenv';
dotenv.config();
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

async function main() {
  const bucket = process.env.R2_BUCKET_NAME || 'dataknow';
  console.log(`\n🔍 Fetching latest uploads from Cloudflare R2 bucket: "${bucket}"...\n`);

  let isTruncated = true;
  let token;
  let all = [];
  while (isTruncated) {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: token
    }));
    all = all.concat(res.Contents || []);
    isTruncated = res.IsTruncated;
    token = res.NextContinuationToken;
  }

  // Sort descending by LastModified date (newest first)
  all.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

  const top10 = all.slice(0, 10);

  console.log(`Found ${all.length} total objects in bucket. Here are the 10 NEWEST files:\n`);

  for (let i = 0; i < top10.length; i++) {
    const item = top10[i];
    const sizeKb = (item.Size / 1024).toFixed(1);
    
    // Generate temporary 1-hour signed URL to view directly in browser
    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: bucket,
      Key: item.Key
    }), { expiresIn: 3600 });

    console.log(`[${i + 1}] Key:  ${item.Key}`);
    console.log(`    Date: ${item.LastModified.toISOString()}`);
    console.log(`    Size: ${sizeKb} KB`);
    console.log(`    Direct View URL (Valid for 1 hr):\n    ${signedUrl}\n`);
  }
}

main().catch(console.error);
