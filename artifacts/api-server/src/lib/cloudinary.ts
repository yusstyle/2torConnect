import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type PersistedUpload = {
  url: string;
  publicId: string;
};

/**
 * Uploads a file buffer (from multer.memoryStorage) to Cloudinary.
 * Drop-in replacement for the old @vercel/blob persistUpload().
 *
 * @param buffer   Raw file buffer from multer
 * @param folder   Cloudinary folder, e.g. "avatars", "ids", "social"
 * @param filename Optional public_id (without extension)
 */
export async function persistUpload(
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<PersistedUpload> {
  const uploadOptions: Record<string, unknown> = {
    folder: `2torconnect/${folder}`,
    resource_type: "image",
  };

  if (filename) {
    uploadOptions.public_id = filename;
  }

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Deletes an uploaded image by its Cloudinary public_id.
 * Use this for the dead-media cleanup workflow.
 */
export async function deleteUpload(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}