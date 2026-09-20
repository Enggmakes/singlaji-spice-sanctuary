/**
 * High-Quality Client-Side Image Compressor for Singlaji Store
 * - Resizes large camera/phone photos (5MB - 25MB) down to crisp max 1400px
 * - Converts to optimized WebP at 85% visual quality (perceptually indistinguishable from uncompressed)
 * - Decreases file size by 80% - 95% before uploading to Supabase
 * - Preserves aspect ratio and maximum sharpness
 */

export interface CompressionResult {
  file: File;
  originalSizeKB: number;
  compressedSizeKB: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
  } = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.85,
    mimeType = 'image/webp',
  } = options;

  const originalSizeKB = Math.round(file.size / 1024);

  // If already small and WebP, skip re-compression
  if (file.size < 80 * 1024 && file.type === 'image/webp') {
    return {
      file,
      originalSizeKB,
      compressedSizeKB: originalSizeKB,
      reductionPercentage: 0,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proportional constraint
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            file,
            originalSizeKB,
            compressedSizeKB: originalSizeKB,
            reductionPercentage: 0,
            width: img.width,
            height: img.height,
          });
          return;
        }

        // High quality bicubic filtering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve({
                file,
                originalSizeKB,
                compressedSizeKB: originalSizeKB,
                reductionPercentage: 0,
                width,
                height,
              });
              return;
            }

            const compressedSizeKB = Math.round(blob.size / 1024);
            const reductionPercentage = Math.round(
              ((file.size - blob.size) / file.size) * 100
            );

            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const optimizedFile = new File([blob], `${nameWithoutExt}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            resolve({
              file: optimizedFile,
              originalSizeKB,
              compressedSizeKB,
              reductionPercentage,
              width,
              height,
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve({
          file,
          originalSizeKB,
          compressedSizeKB: originalSizeKB,
          reductionPercentage: 0,
          width: 0,
          height: 0,
        });
      };
    };

    reader.onerror = () => {
      resolve({
        file,
        originalSizeKB,
        compressedSizeKB: originalSizeKB,
        reductionPercentage: 0,
        width: 0,
        height: 0,
      });
    };
  });
}
