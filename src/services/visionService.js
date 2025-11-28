/**
 * 📸 Vision-Based PDF Analysis Service
 * 
 * Uses Gemini Vision API to analyze PDF pages as images
 * Fallback when text extraction produces garbled results
 * 
 * Cost: ~$0.0001875 per page with Gemini 1.5 Flash Vision
 */

/**
 * Check if text appears garbled (high ratio of special characters)
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
  
  // Get threshold from settings (default 30%)
  const threshold = parseFloat(localStorage.getItem('vision_garbled_threshold') || '0.30');
  const isGarbled = specialCharRatio > threshold;
  
  console.log('🔍 [Vision] Text quality check:', {
    length: text.length,
    nonWhitespaceLength: nonWhitespace.length,
    specialCharCount: specialChars?.length || 0,
    specialCharRatio: (specialCharRatio * 100).toFixed(1) + '%',
    threshold: (threshold * 100).toFixed(0) + '%',
    isGarbled,
    preview: text.substring(0, 100)
  });
  
  return isGarbled;
}

/**
 * Convert canvas to base64 image
 * @param {HTMLCanvasElement} canvas - PDF page canvas
 * @param {number} quality - JPEG quality (0.1 to 1.0, default 0.8)
 * @returns {string} - Base64 encoded image
 */
function canvasToBase64(canvas, quality = 0.8) {
  // Get quality from settings
  const savedQuality = parseFloat(localStorage.getItem('vision_image_quality') || '0.8');
  return canvas.toDataURL('image/jpeg', savedQuality);
}

/**
 * Extract text from PDF page using Gemini Vision API
 * @param {HTMLCanvasElement} canvas - Rendered PDF page canvas
 * @param {string} languageHint - Detected language (e.g., 'Telugu', 'Hindi')
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextWithVision(canvas, languageHint = null) {
  console.log('📸 [Vision] Starting vision-based extraction...', { languageHint });
  
  const startTime = Date.now();
  
  try {
    // Convert canvas to base64 image
    const base64Image = canvasToBase64(canvas);
    const imageData = base64Image.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    
    // Get Gemini API key
    const apiKey = localStorage.getItem('gemini_pat');
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add it in Settings.');
    }
    
    // Prepare the prompt
    const languageInstruction = languageHint 
      ? `This page is in ${languageHint}. Extract and return all text in ${languageHint}.`
      : `Detect the language and extract all text in the original language (Telugu/Hindi/Tamil/English).`;
    
    const prompt = `You are analyzing a page from an educational textbook.

TASK:
1. Extract ALL text from this image in the exact order it appears
2. Maintain the original language (Telugu/Hindi/Tamil/English)
3. Preserve formatting (paragraphs, bullet points, headings)
4. Include all important text (titles, content, captions, labels)

${languageInstruction}

IMPORTANT:
- Return ONLY the extracted text
- NO explanations, NO descriptions
- Just the pure text content from the image
- Maintain readability and structure`;

    // Call Gemini Vision API
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Vision API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Vision] Completed in ${duration}ms, extracted ${extractedText.length} chars`);
    console.log(`📸 [Vision] Preview:`, extractedText.substring(0, 200));
    
    return extractedText.trim();
    
  } catch (error) {
    console.error('❌ [Vision] Extraction failed:', error);
    throw error;
  }
}

/**
 * Smart hybrid extraction: Try text first, fallback to vision if garbled
 * @param {object} page - PDF.js page object
 * @param {HTMLCanvasElement} canvas - Rendered page canvas
 * @param {string} languageHint - Detected language
 * @returns {Promise<{text: string, method: string}>} - Extracted text and method used
 */
export async function smartHybridExtraction(page, canvas, languageHint = null) {
  console.log('🧠 [Hybrid] Starting smart extraction...');
  
  // Check if vision fallback is enabled
  const visionEnabled = localStorage.getItem('vision_fallback_enabled') !== 'false'; // Default true
  
  // Step 1: Try PDF.js text extraction (fast)
  try {
    const textContent = await page.getTextContent();
    const pdfJsText = textContent.items.map(item => item.str).join(' ');
    
    console.log('📝 [Hybrid] PDF.js extraction:', {
      length: pdfJsText.length,
      preview: pdfJsText.substring(0, 100)
    });
    
    // Step 2: Check if text is garbled
    if (!isTextGarbled(pdfJsText)) {
      console.log('✅ [Hybrid] PDF.js text is good, using it');
      return { text: pdfJsText, method: 'text' };
    }
    
    console.log('⚠️ [Hybrid] PDF.js text is garbled');
    
    // Step 3: Check if vision fallback is enabled
    if (!visionEnabled) {
      console.log('⚠️ [Hybrid] Vision fallback disabled in settings, using garbled text anyway');
      return { text: pdfJsText, method: 'text-garbled' };
    }
    
    console.log('🔄 [Hybrid] Falling back to vision mode...');
    
  } catch (error) {
    console.error('❌ [Hybrid] PDF.js extraction failed:', error);
    
    if (!visionEnabled) {
      return { text: '', method: 'failed' };
    }
  }
  
  // Step 4: Fallback to Vision API
  try {
    const visionText = await extractTextWithVision(canvas, languageHint);
    return { text: visionText, method: 'vision' };
    
  } catch (error) {
    console.error('❌ [Hybrid] Vision also failed:', error);
    // Return empty string as last resort
    return { text: '', method: 'failed' };
  }
}

/**
 * Get vision service settings
 * @returns {object} - Settings object
 */
export function getVisionSettings() {
  return {
    enabled: localStorage.getItem('vision_fallback_enabled') !== 'false',
    threshold: parseFloat(localStorage.getItem('vision_garbled_threshold') || '0.30'),
    quality: parseFloat(localStorage.getItem('vision_image_quality') || '0.8'),
    forceForRegional: localStorage.getItem('vision_force_regional') === 'true'
  };
}

/**
 * Update vision service settings
 * @param {object} settings - Settings to update
 */
export function updateVisionSettings(settings) {
  if (settings.enabled !== undefined) {
    localStorage.setItem('vision_fallback_enabled', settings.enabled.toString());
  }
  if (settings.threshold !== undefined) {
    localStorage.setItem('vision_garbled_threshold', settings.threshold.toString());
  }
  if (settings.quality !== undefined) {
    localStorage.setItem('vision_image_quality', settings.quality.toString());
  }
  if (settings.forceForRegional !== undefined) {
    localStorage.setItem('vision_force_regional', settings.forceForRegional.toString());
  }
  
  console.log('💾 [Vision] Settings updated:', getVisionSettings());
}

const visionService = {
  isTextGarbled,
  extractTextWithVision,
  smartHybridExtraction,
  getVisionSettings,
  updateVisionSettings
};

export default visionService;

