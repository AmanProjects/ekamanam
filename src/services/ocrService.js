/**
 * OCR Service using Tesseract.js for regional language PDF text extraction
 * Used as fallback when PDF.js produces garbled text
 */

import Tesseract from 'tesseract.js';
import { openDB } from 'idb';

const OCR_CACHE_DB = 'ekamanam-ocr-cache';
const OCR_CACHE_STORE = 'ocr-results';
const OCR_CACHE_VERSION = 1;

// Initialize OCR cache database
async function getOCRCacheDB() {
  return openDB(OCR_CACHE_DB, OCR_CACHE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(OCR_CACHE_STORE)) {
        const store = db.createObjectStore(OCR_CACHE_STORE, { keyPath: 'key' });
        store.createIndex('pdfId', 'pdfId');
        store.createIndex('timestamp', 'timestamp');
      }
    }
  });
}

/**
 * Detect if text is garbled (high ratio of special characters)
 * @param {string} text - Extracted text to check
 * @returns {boolean} - True if text appears garbled
 */
export function isTextGarbled(text) {
  if (!text || typeof text !== 'string' || text.length === 0) {
    return true; // Empty or invalid text is considered garbled
  }
  
  // Remove whitespace for analysis
  const nonWhitespace = text.replace(/\s/g, '');
  
  if (nonWhitespace.length === 0) {
    return true; // Only whitespace
  }
  
  // Count special/garbled characters (not alphanumeric, not Indian scripts, not common punctuation)
  const specialChars = nonWhitespace.match(/[^a-zA-Z0-9\u0900-\u097F\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F.,!?;:()\-'"]/g);
  const specialCharRatio = specialChars ? specialChars.length / nonWhitespace.length : 0;
  
  // If more than 30% are special characters, consider it garbled
  const isGarbled = specialCharRatio > 0.3;
  
  console.log('🔍 [OCR] Text quality check:', {
    length: text.length,
    nonWhitespaceLength: nonWhitespace.length,
    specialCharCount: specialChars?.length || 0,
    specialCharRatio: (specialCharRatio * 100).toFixed(1) + '%',
    isGarbled,
    preview: text.substring(0, 100)
  });
  
  return isGarbled;
}

/**
 * Get cached OCR result
 * @param {string} pdfId - PDF identifier
 * @param {number} pageNumber - Page number
 * @returns {Promise<string|null>} - Cached text or null
 */
export async function getCachedOCR(pdfId, pageNumber) {
  try {
    const db = await getOCRCacheDB();
    const key = `${pdfId}_page_${pageNumber}`;
    const cached = await db.get(OCR_CACHE_STORE, key);
    
    if (cached && cached.text) {
      console.log(`⚡ [OCR] Cache HIT for ${key}`);
      return cached.text;
    }
    
    console.log(`📊 [OCR] Cache MISS for ${key}`);
    return null;
  } catch (error) {
    console.error('❌ [OCR] Cache read error:', error);
    return null;
  }
}

/**
 * Save OCR result to cache
 * @param {string} pdfId - PDF identifier
 * @param {number} pageNumber - Page number
 * @param {string} text - OCR extracted text
 */
export async function cacheOCRResult(pdfId, pageNumber, text) {
  try {
    const db = await getOCRCacheDB();
    const key = `${pdfId}_page_${pageNumber}`;
    
    await db.put(OCR_CACHE_STORE, {
      key,
      pdfId,
      pageNumber,
      text,
      timestamp: Date.now()
    });
    
    console.log(`💾 [OCR] Cached result for ${key} (${text.length} chars)`);
  } catch (error) {
    console.error('❌ [OCR] Cache write error:', error);
  }
}

/**
 * Extract text from PDF page using OCR (Tesseract.js)
 * @param {HTMLCanvasElement} canvas - Rendered PDF page canvas
 * @param {string} languageHint - Detected language (e.g., 'Telugu', 'Hindi')
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextWithOCR(canvas, languageHint = null) {
  console.log('🔬 [OCR] Starting OCR extraction...', { languageHint });
  
  try {
    // Map language names to Tesseract language codes
    const langMap = {
      'Telugu': 'tel',
      'Hindi': 'hin',
      'Tamil': 'tam',
      'Kannada': 'kan',
      'Malayalam': 'mal',
      'Bengali': 'ben',
      'Gujarati': 'guj',
      'Punjabi': 'pan',
      'Odia': 'ori',
      'Marathi': 'mar',
      'English': 'eng'
    };
    
    // Extract language code from hint (e.g., "Telugu (తెలుగు)" → "tel")
    let tesseractLang = 'eng'; // Default to English
    if (languageHint) {
      for (const [name, code] of Object.entries(langMap)) {
        if (languageHint.includes(name)) {
          tesseractLang = code;
          break;
        }
      }
    }
    
    console.log(`🔬 [OCR] Using Tesseract language: ${tesseractLang}`);
    
    // Run OCR
    const startTime = Date.now();
    const { data: { text } } = await Tesseract.recognize(
      canvas,
      tesseractLang,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`🔬 [OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ [OCR] Completed in ${duration}ms, extracted ${text.length} chars`);
    console.log(`🔬 [OCR] Preview:`, text.substring(0, 200));
    
    return text.trim();
  } catch (error) {
    console.error('❌ [OCR] Extraction failed:', error);
    throw error;
  }
}

/**
 * Smart text extraction: Try PDF.js first, fallback to OCR if garbled
 * @param {object} page - PDF.js page object
 * @param {HTMLCanvasElement} canvas - Rendered page canvas
 * @param {string} pdfId - PDF identifier
 * @param {number} pageNumber - Page number
 * @param {string} languageHint - Detected language
 * @returns {Promise<{text: string, method: string}>} - Extracted text and method used
 */
export async function smartTextExtraction(page, canvas, pdfId, pageNumber, languageHint) {
  console.log('🧠 [Smart Extract] Starting intelligent extraction...');
  
  // Check cache first
  const cached = await getCachedOCR(pdfId, pageNumber);
  if (cached) {
    return { text: cached, method: 'cache' };
  }
  
  // Step 1: Try PDF.js extraction
  try {
    const textContent = await page.getTextContent();
    const pdfJsText = textContent.items.map(item => item.str).join(' ');
    
    console.log('📝 [Smart Extract] PDF.js extraction:', {
      length: pdfJsText.length,
      preview: pdfJsText.substring(0, 100)
    });
    
    // Step 2: Check if text is garbled
    if (!isTextGarbled(pdfJsText)) {
      console.log('✅ [Smart Extract] PDF.js text is good, using it');
      return { text: pdfJsText, method: 'pdfjs' };
    }
    
    console.log('⚠️ [Smart Extract] PDF.js text is garbled, falling back to OCR...');
  } catch (error) {
    console.error('❌ [Smart Extract] PDF.js extraction failed:', error);
  }
  
  // Step 3: Fallback to OCR
  try {
    const ocrText = await extractTextWithOCR(canvas, languageHint);
    
    // Cache the OCR result
    await cacheOCRResult(pdfId, pageNumber, ocrText);
    
    return { text: ocrText, method: 'ocr' };
  } catch (error) {
    console.error('❌ [Smart Extract] OCR also failed:', error);
    // Return empty string as last resort
    return { text: '', method: 'failed' };
  }
}

/**
 * Clear OCR cache for a specific PDF
 * @param {string} pdfId - PDF identifier
 */
export async function clearOCRCache(pdfId) {
  try {
    const db = await getOCRCacheDB();
    const index = db.transaction(OCR_CACHE_STORE).objectStore(OCR_CACHE_STORE).index('pdfId');
    const keys = await index.getAllKeys(IDBKeyRange.only(pdfId));
    
    const tx = db.transaction(OCR_CACHE_STORE, 'readwrite');
    for (const key of keys) {
      await tx.objectStore(OCR_CACHE_STORE).delete(key);
    }
    await tx.done;
    
    console.log(`🗑️ [OCR] Cleared cache for ${pdfId} (${keys.length} entries)`);
  } catch (error) {
    console.error('❌ [OCR] Cache clear error:', error);
  }
}

const ocrService = {
  isTextGarbled,
  getCachedOCR,
  cacheOCRResult,
  extractTextWithOCR,
  smartTextExtraction,
  clearOCRCache
};

export default ocrService;

