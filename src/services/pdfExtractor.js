/**
 * PDF Text Extractor - Extract full text from PDF document
 */

/**
 * Extract all text from a PDF document
 * @param {Object} pdfDocument - PDF.js document object
 * @returns {Promise<string>} - Full text content
 */
export const extractFullPdfText = async (pdfDocument) => {
  try {
    if (!pdfDocument) {
      throw new Error('No PDF document provided');
    }

    console.log(`📖 Extracting text from ${pdfDocument.numPages} pages...`);
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
      
      if (pageNum % 10 === 0) {
        console.log(`📄 Extracted ${pageNum}/${pdfDocument.numPages} pages`);
      }
    }
    
    console.log(`✅ Extraction complete. Total characters: ${fullText.length}`);
    return fullText;
    
  } catch (error) {
    console.error('❌ Error extracting PDF text:', error);
    throw error;
  }
};

/**
 * Extract text from specific page range
 * @param {Object} pdfDocument - PDF.js document object
 * @param {number} startPage - Start page number (1-indexed)
 * @param {number} endPage - End page number (1-indexed)
 * @returns {Promise<string>} - Text content from specified range
 */
export const extractPdfTextRange = async (pdfDocument, startPage, endPage) => {
  try {
    if (!pdfDocument) {
      throw new Error('No PDF document provided');
    }

    const start = Math.max(1, startPage);
    const end = Math.min(pdfDocument.numPages, endPage);
    
    console.log(`📖 Extracting text from pages ${start} to ${end}...`);
    
    let text = '';
    
    for (let pageNum = start; pageNum <= end; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      text += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
    }
    
    console.log(`✅ Extracted ${end - start + 1} pages. Characters: ${text.length}`);
    return text;
    
  } catch (error) {
    console.error('❌ Error extracting PDF text range:', error);
    throw error;
  }
};

export default {
  extractFullPdfText,
  extractPdfTextRange
};

