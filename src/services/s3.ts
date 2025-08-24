import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function uploadToS3(file: Express.Multer.File): Promise<string> {
  const filename = `${Date.now()}-${file.originalname}`;

  const params: PutObjectCommandInput = {
    Bucket: process.env.AWS_S3_BUCKET!,
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

export async function uploadToS3Public(file: Express.Multer.File) {
  const filename = Date.now().toString() + "-" + file.originalname;

  const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
    console.log("Uploaded file to S3 successfully.");

    // Construct the file URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${filename}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return (error as Error).message;
  }
}

