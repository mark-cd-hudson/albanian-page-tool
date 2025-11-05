/**
 * Compress an image data URL to reduce storage size
 * Resizes to max 800px width and compresses to JPEG with quality 0.7
 */
export const compressImage = (dataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max width 800px)
      const maxWidth = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with compression (quality 0.7)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      console.log('Image compressed:', {
        originalSize: dataUrl.length,
        compressedSize: compressedDataUrl.length,
        reduction: `${Math.round((1 - compressedDataUrl.length / dataUrl.length) * 100)}%`
      });
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = dataUrl;
  });
};

