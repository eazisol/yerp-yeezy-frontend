import jsPDF from "jspdf";

// Font cache to avoid reloading
let fontLoaded = false;

/**
 * Load IBM Plex Mono font into jsPDF
 * This function loads the font from CDN and registers it with jsPDF
 */
export const loadIBMPlexMonoFont = async (doc: jsPDF): Promise<boolean> => {
  // If font is already loaded, skip
  if (fontLoaded) {
    return true;
  }

  try {
    // IBM Plex Mono fonts from jsDelivr CDN (better CORS support)
    // Using TTF format which is required by jsPDF
    const regularFontUrlTTF = "https://cdn.jsdelivr.net/gh/IBM/plex@main/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Regular.ttf";
    const boldFontUrlTTF = "https://cdn.jsdelivr.net/gh/IBM/plex@main/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Bold.ttf";

    // Fetch font files and convert to base64
    const [regularResponse, boldResponse] = await Promise.all([
      fetch(regularFontUrlTTF),
      fetch(boldFontUrlTTF)
    ]);

    if (!regularResponse.ok || !boldResponse.ok) {
      console.warn("Failed to load IBM Plex Mono fonts from CDN, falling back to courier");
      return false;
    }

    const [regularBlob, boldBlob] = await Promise.all([
      regularResponse.blob(),
      boldResponse.blob()
    ]);

    // Convert blobs to base64
    const regularBase64 = await blobToBase64(regularBlob);
    const boldBase64 = await blobToBase64(boldBlob);

    // Remove data URL prefix if present and get only base64 string
    const regularBase64String = regularBase64.includes(',') 
      ? regularBase64.split(',')[1] 
      : regularBase64;
    const boldBase64String = boldBase64.includes(',') 
      ? boldBase64.split(',')[1] 
      : boldBase64;

    // Add fonts to jsPDF Virtual File System
    doc.addFileToVFS('IBMPlexMono-Regular.ttf', regularBase64String);
    doc.addFileToVFS('IBMPlexMono-Bold.ttf', boldBase64String);

    // Register fonts
    doc.addFont('IBMPlexMono-Regular.ttf', 'IBMPlexMono', 'normal');
    doc.addFont('IBMPlexMono-Bold.ttf', 'IBMPlexMono', 'bold');

    fontLoaded = true;
    console.log("IBM Plex Mono font loaded successfully");
    return true;
  } catch (error) {
    console.error("Error loading IBM Plex Mono font:", error);
    console.warn("Falling back to courier font (monospace)");
    return false;
  }
};

/**
 * Convert blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Get the font family name to use
 * Returns 'IBMPlexMono' if font is loaded, otherwise 'courier' as fallback
 */
export const getFontFamily = (): string => {
  return fontLoaded ? 'IBMPlexMono' : 'courier';
};
