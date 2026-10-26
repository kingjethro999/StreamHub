import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../env.js";

/**
 * S3-compatible client (Neon storage) for operator-side video seeding.
 *
 * Platform users continue to use Cloudinary for their own uploads. Only the
 * operator uses this client to seed high-quality sample videos directly.
 *
 * The key stored in S3 is just the object name (e.g. "streams/victor-intro.mp4").
 * Public access is via a presigned URL generated on demand.
 */
export const s3 = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: {
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
  },
  // Neon/S3-compatible storage requires path-style addressing
  forcePathStyle: true,
});

export const S3_BUCKET = config.s3Bucket;

/**
 * Generate a time-limited presigned URL for viewing/downloading an object.
 * Defaults to 1 hour expiry.
 */
export async function getSignedVideoUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Upload a file buffer to S3 and return the object key.
 */
export async function uploadVideo(key, buffer, contentType = "video/mp4") {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(command);
  return key;
}

/**
 * Delete an object from S3.
 */
export async function deleteVideo(key) {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  await s3.send(command);
}
