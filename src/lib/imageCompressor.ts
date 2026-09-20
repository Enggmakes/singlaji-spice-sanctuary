/**
 * High-Quality Client-Side Image Compressor for Singlaji Store
 * - Resizes large camera/phone photos (5MB - 25MB) down to crisp max 1400px
 * - Converts to optimized WebP (or JPEG fallback) at 85% visual quality
 * - Decreases file size by 80% - 95% before uploading to Supabase
 * - Uses URL.createObjectURL for near-zero memory overhead and instant performance
 * - Built-in timeout safety ensures upload never hangs
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
    let resolved = false;
    const safeResolve = (res: CompressionResult) => {
      if (!resolved) {
        resolved = true;
        resolve(res);
      }
    };

    // 8-second safety timeout: fallback to original file if decoding hangs
    const timer = setTimeout(() => {
      safeResolve({
        file,
        originalSizeKB,
        compressedSizeKB: originalSizeKB,
        reductionPercentage: 0,
        width: 0,
        height: 0,
      });
    }, 8000);

    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      clearTimeout(timer);
      safeResolve({
        file,
        originalSizeKB,
        compressedSizeKB: originalSizeKB,
        reductionPercentage: 0,
        width: 0,
        height: 0,
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      clearTimeout(timer);
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
      }
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          cleanup();
          safeResolve({
            file,
            originalSizeKB,
            compressedSizeKB: originalSizeKB,
            reductionPercentage: 0,
            width: 0,
            height: 0,
          });
          return;
        }

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
          cleanup();
          safeResolve({
            file,
            originalSizeKB,
            compressedSizeKB: originalSizeKB,
            reductionPercentage: 0,
            width,
            height,
          });
          return;
        }

        // High quality bicubic filtering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const tryExportBlob = (targetType: string, targetQuality: number, onDone: (blob: Blob | null) => void) => {
          try {
            canvas.toBlob(
              (blob) => {
                onDone(blob);
              },
              targetType,
              targetQuality
            );
          } catch {
            onDone(null);
          }
        };

        tryExportBlob(mimeType, quality, (blob) => {
          // If WebP is unsupported or failed, try standard JPEG
          if (!blob && mimeType !== 'image/jpeg') {
            tryExportBlob('image/jpeg', quality, (fallbackBlob) => {
              processResult(fallbackBlob, 'image/jpeg', 'jpg');
            });
            return;
          }
          processResult(blob, mimeType, 'webp');
        });

        const processResult = (blob: Blob | null, outputType: string, ext: string) => {
          cleanup();
          if (!blob || blob.size >= file.size) {
            // Keep original if compression didn't save size or failed
            safeResolve({
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

          const cleanBaseName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_');
          const optimizedFile = new File([blob], `${cleanBaseName}.${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          });

          safeResolve({
            file: optimizedFile,
            originalSizeKB,
            compressedSizeKB,
            reductionPercentage,
            width,
            height,
          });
        };
      } catch (err) {
        console.warn('Canvas compression error:', err);
        cleanup();
        safeResolve({
          file,
          originalSizeKB,
          compressedSizeKB: originalSizeKB,
          reductionPercentage: 0,
          width: 0,
          height: 0,
        });
      }
    };

    img.onerror = () => {
      cleanup();
      safeResolve({
        file,
        originalSizeKB,
        compressedSizeKB: originalSizeKB,
        reductionPercentage: 0,
        width: 0,
        height: 0,
      });
    };

    img.src = objectUrl;
  });
}
