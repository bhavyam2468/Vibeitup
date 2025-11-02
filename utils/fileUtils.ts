// utils/fileUtils.ts

/**
 * Converts a File object into a Base64 encoded string and its MIME type.
 * @param file The File object to convert.
 * @returns A promise that resolves to an object containing the MIME type and the Base64 data string.
 */
export async function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve({ mimeType: file.type, data: base64Data });
      } else {
        reject(new Error("Failed to read file as base64."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}