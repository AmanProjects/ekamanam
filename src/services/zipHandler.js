/**
 * ZIP Handler Service - Extract and process ZIP files containing multiple PDFs
 * Specialized for NCERT textbook ZIP files
 */

import JSZip from 'jszip';

/**
 * Parse NCERT filename to extract metadata
 * Format: [subject][type][class][chapter].pdf
 * Example: hecu101.pdf = Hindi Economics Class 1 (or 11) Chapter 01
 * 
 * NCERT Subject Codes:
 * - he = Hindi medium
 * - ee = English medium
 * - ke = Kannada medium
 * - te = Telugu medium
 * - ma = Marathi medium
 */
const parseNCERTFilename = (filename) => {
  const name = filename.replace('.pdf', '').toLowerCase();
  
  // Special cases
  if (name.includes('cc')) {
    return { type: 'cover', chapter: null, title: 'Cover & Contents' };
  }
  if (name.includes('ps') || name.includes('prelims')) {
    return { type: 'prelim', chapter: null, title: 'Preliminary Pages' };
  }
  
  // Extract chapter number (last 2 digits)
  const chapterMatch = name.match(/(\d{2})$/);
  if (chapterMatch) {
    const chapter = parseInt(chapterMatch[1], 10);
    return {
      type: 'chapter',
      chapter: chapter,
      title: `Chapter ${chapter}`
    };
  }
  
  return { type: 'unknown', chapter: null, title: filename };
};

/**
 * Detect subject and class from ZIP filename or content
 * @param {string} zipFilename - Name of the ZIP file
 * @returns {object} - { subject, class, bookName }
 */
const detectMetadataFromZip = (zipFilename) => {
  const name = zipFilename.toLowerCase().replace('.zip', '');
  
  // NCERT pattern examples:
  // hecu1dd = Hindi Economics Class 11/1
  // iemh1dd = ? Mathematics Class 11/1
  // Default metadata
  let metadata = {
    subject: 'General',
    class: null,
    bookName: zipFilename.replace('.zip', '')
  };
  
  // Try to detect subject from filename
  if (name.includes('math') || name.includes('mh')) {
    metadata.subject = 'Mathematics';
  } else if (name.includes('sci') || name.includes('sc')) {
    metadata.subject = 'Science';
  } else if (name.includes('phy') || name.includes('ph')) {
    metadata.subject = 'Physics';
  } else if (name.includes('chem') || name.includes('ch')) {
    metadata.subject = 'Chemistry';
  } else if (name.includes('bio') || name.includes('bo')) {
    metadata.subject = 'Biology';
  } else if (name.includes('eng') || name.includes('en')) {
    metadata.subject = 'English';
  } else if (name.includes('hin') || name.includes('hi')) {
    metadata.subject = 'Hindi';
  } else if (name.includes('soc') || name.includes('ss')) {
    metadata.subject = 'Social Science';
  } else if (name.includes('eco') || name.includes('ec')) {
    metadata.subject = 'Economics';
  } else if (name.includes('hist') || name.includes('hs')) {
    metadata.subject = 'History';
  } else if (name.includes('geo') || name.includes('ge')) {
    metadata.subject = 'Geography';
  }
  
  // Try to detect class from filename
  const classMatch = name.match(/(?:class|cl|c)?(\d{1,2})/);
  if (classMatch) {
    metadata.class = classMatch[1];
  }
  
  return metadata;
};

/**
 * Extract and process ZIP file
 * @param {File} zipFile - ZIP file object
 * @param {Function} onProgress - Progress callback (current, total, message)
 * @returns {Promise<Array>} - Array of PDF file objects with metadata
 */
export const extractZipFile = async (zipFile, onProgress = null) => {
  try {
    console.log('📦 Extracting ZIP file:', zipFile.name);
    
    // Detect metadata from ZIP filename
    const zipMetadata = detectMetadataFromZip(zipFile.name);
    console.log('📋 Detected metadata:', zipMetadata);
    
    // Read ZIP file
    const zipData = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(zipData);
    
    // Get all PDF files
    const pdfFiles = [];
    const fileEntries = Object.keys(zip.files).filter(name => 
      name.toLowerCase().endsWith('.pdf') && !zip.files[name].dir
    );
    
    console.log(`📄 Found ${fileEntries.length} PDF files`);
    
    // Extract each PDF
    for (let i = 0; i < fileEntries.length; i++) {
      const filename = fileEntries[i];
      const fileEntry = zip.files[filename];
      
      if (onProgress) {
        onProgress(i + 1, fileEntries.length, `Extracting ${filename}...`);
      }
      
      console.log(`📖 Extracting: ${filename}`);
      
      // Get file blob
      const blob = await fileEntry.async('blob');
      
      // Parse filename for chapter info
      const fileMetadata = parseNCERTFilename(filename);
      
      // Create File object
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });
      
      // Add metadata
      pdfFiles.push({
        file: pdfFile,
        filename: filename,
        metadata: {
          ...zipMetadata,
          ...fileMetadata,
          collection: zipMetadata.bookName,
          originalZip: zipFile.name
        }
      });
    }
    
    // Sort by chapter number
    pdfFiles.sort((a, b) => {
      const chapterA = a.metadata.chapter || 999;
      const chapterB = b.metadata.chapter || 999;
      return chapterA - chapterB;
    });
    
    console.log('✅ ZIP extraction complete:', pdfFiles.length, 'PDFs');
    return pdfFiles;
    
  } catch (error) {
    console.error('❌ Error extracting ZIP:', error);
    throw new Error(`Failed to extract ZIP file: ${error.message}`);
  }
};

/**
 * Check if file is a ZIP file
 * @param {File} file - File object
 * @returns {boolean}
 */
export const isZipFile = (file) => {
  return file.type === 'application/zip' || 
         file.type === 'application/x-zip-compressed' ||
         file.name.toLowerCase().endsWith('.zip');
};

export default {
  extractZipFile,
  isZipFile,
  parseNCERTFilename,
  detectMetadataFromZip
};

