import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function uploadToS3(file: Express.Multer.File): Promise<string> {
  const filename = `${Date.now()}-${file.originalname}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
    console.log("Uploaded to S3:", filename);
    return filename; 
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
}

export default uploadToS3;
