import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const uploadFileFromURL = async (key, url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file from URL: ${url}`);
    }
    const audioBuffer = await response.arrayBuffer();
    const command = new PutObjectCommand({
      Bucket: 'lol-quotes-audio',
      Key: key,
      Body: new Uint8Array(audioBuffer),
      ContentType: 'application/ogg',
    });

    await client.send(command);
    console.log(`File ${key} uploaded successfully`);
  } catch (err) {
    console.error(`Error uploading file ${key}:`, err);
    throw err;
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uploadBatch = async (files) => {
  const batchSize = 200;
  const delayMs = 2000;
  const failedUploads = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file) => {
        const { key, url } = file;
        try {
          await uploadFileFromURL(key, url);
          await delay(delayMs);
        } catch (err) {
          console.error(`Error uploading file with key ${key}: ${err}`);
          failedUploads.push({ key, url });
        }
      })
    );
  }
  console.log('File Uploading Finished!');
  console.log('Failed uploads:', failedUploads);
};

export default uploadBatch;
