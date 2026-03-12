import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // File extension check karne ke liye logic
    const isVideo = file.mimetype.startsWith("video");
    const isAudio = file.mimetype.startsWith("audio");
    return {
      folder: "snapify_uploads",
      resource_type: (isVideo || isAudio) ? "video" : "image", 
      allowed_formats: ["jpg", "jpeg", "png", "mp4", "mov", "webm", "mp3", "wav"],
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit (videos ke liye zaroori hai)
});

export default upload;