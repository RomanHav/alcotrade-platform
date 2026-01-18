import imageCompression from 'browser-image-compression';

export async function uploadOne(file: File) {
  // Compress image if it's larger than 512KB
  let fileToUpload = file;
  if (file.size > 512 * 1024) { // 512KB
    try {
      const options = {
        maxSizeMB: 1, // Maximum size in MB - reduced for Vercel
        maxWidthOrHeight: 1600, // Maximum width/height - reduced
        useWebWorker: true,
        fileType: 'image/webp', // Convert to WebP for better compression
        quality: 0.75, // WebP quality (slightly higher than JPEG since WebP is more efficient)
      };
      fileToUpload = await imageCompression(file, options);
      console.log(`Image compressed to WebP: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (error) {
      console.warn('Image WebP compression failed, uploading original file:', error);
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
