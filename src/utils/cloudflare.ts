import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import 'dotenv/config';
import { delay } from './misc.js';

interface File {
  key: string;
  url: string;
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY ?? '',
  },
});

const uploadFileFromURL = async (key: string, url: string) => {
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

const checkExistingObjectsInBatch = async (keys: string[]) => {
  const existingKeys: string[] = [];
  const headCommands = keys.map(
    (key) =>
      new HeadObjectCommand({
        Bucket: 'lol-quotes-audio',
        Key: key,
      })
  );

  const responses = await Promise.allSettled(
    headCommands.map((command) => client.send(command))
  );

  responses.forEach((response, index) => {
    if (response.status === 'fulfilled' && keys[index]) {
      const key = keys[index];
      if (key) {
        existingKeys.push(key);
      }
    }
  });

  return existingKeys;
};

const uploadBatch = async (files: File[]) => {
  const batchSize = 200;
  const delayMs = 2000;
  const failedUploads: File[] = [];
  const skippedUploads: File[] = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const keys = batch.map((file) => file.key);
    try {
      const existingKeys = await checkExistingObjectsInBatch(keys);
      await Promise.all(
        batch.map(async (file) => {
          const { key, url } = file;
          if (existingKeys.includes(key)) {
            console.log(`File ${key} already exists. Skipping upload.`);
            skippedUploads.push({ key, url });
            return;
          }
          try {
            await uploadFileFromURL(key, url);
            await delay(delayMs);
          } catch (err) {
            console.error(`Error uploading file with key ${key}: ${err}`);
            failedUploads.push({ key, url });
          }
        })
      );
    } catch (err) {
      console.error('Error checking object existence:', err);
      failedUploads.push(...batch);
      continue;
    }
  }
  console.log('File Uploading Finished!');
  console.log('Failed uploads:', failedUploads);
  console.log('Skipped uploads(already exits in bucket):', skippedUploads);
};

export default uploadBatch;
