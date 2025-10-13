// Object Storage Service for PDF storage
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
const PRIVATE_DIR = process.env.PRIVATE_OBJECT_DIR || ".private";

if (!BUCKET_ID) {
  throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variable is required");
}

// Replit Object Storage uses GCS-compatible API
const s3Client = new S3Client({
  region: "auto",
  endpoint: "https://storage.googleapis.com",
  credentials: {
    accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY || "",
  },
});

export class ObjectStorageService {
  async uploadPDF(
    fileName: string,
    pdfBuffer: Buffer,
    metadata?: Record<string, string>
  ): Promise<{ objectPath: string; url: string }> {
    const objectPath = `${PRIVATE_DIR}/cerfas/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_ID,
      Key: objectPath,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      Metadata: metadata,
    });

    await s3Client.send(command);

    // Generate a presigned URL for download (valid for 7 days)
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_ID,
      Key: objectPath,
    });
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });

    return { objectPath, url };
  }

  async getPresignedUrl(objectPath: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_ID,
      Key: objectPath,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }
}

export const objectStorage = new ObjectStorageService();
