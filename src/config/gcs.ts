import { Storage } from "@google-cloud/storage";
import path from "path";

// Service account key file ka path .env se aayega
const storage = new Storage({
  keyFilename: path.join(__dirname, "../../", process.env.GCS_KEY_FILE!),
  projectId: process.env.GCS_PROJECT_ID,
});

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);