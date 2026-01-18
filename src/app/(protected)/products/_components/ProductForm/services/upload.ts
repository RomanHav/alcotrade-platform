import imageCompression from 'browser-image-compression';

export async function uploadOne(file: File) {
  // Compress image if it's larger than 1MB
  let fileToUpload = file;
  if (file.size > 1024 * 1024) { // 1MB
    try {
      const options = {
        maxSizeMB: 2, // Maximum size in MB
        maxWidthOrHeight: 1920, // Maximum width/height
        useWebWorker: true,
        quality: 0.8, // JPEG quality
      };
      fileToUpload = await imageCompression(file, options);
      console.log(`Image compressed from ${file.size} to ${fileToUpload.size} bytes`);
    } catch (error) {
      console.warn('Image compression failed, uploading original file:', error);
      // Continue with original file if compression fails
    }
  }

  const fd = new FormData();
  fd.append('file', fileToUpload);
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  const j = await r.json();
  if (j?.ok && j?.media?.id && j?.media?.url) {
    return {
      id: j.media.id as string,
      url: j.media.url as string,
      publicId: j.cloudinary?.publicId as string | undefined,
    };
  }
  throw new Error('Upload failed');
}
