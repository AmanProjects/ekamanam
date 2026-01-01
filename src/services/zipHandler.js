/**
 * ZIP Handler Service - Extract and process ZIP files containing multiple PDFs
 * Specialized for NCERT textbook ZIP files
 */

import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Set worker using the bundled worker (more reliable than CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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
 * Extract metadata from a single PDF
 * @param {Blob} pdfBlob - PDF blob
 * @returns {Promise<Object>} - { thumbnail, title, pageCount }
 */
const extractPdfMetadata = async (pdfBlob) => {
  try {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const metadata = {
      thumbnail: null,
      title: null,
      pageCount: pdf.numPages
    };
    
    // Extract thumbnail from first page
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 }); // Smaller scale for thumbnails
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      metadata.thumbnail = canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.warn('⚠️ Failed to extract thumbnail:', error);
    }
    
    // Extract PDF metadata
    try {
      const pdfMetadata = await pdf.getMetadata();
      if (pdfMetadata.info && pdfMetadata.info.Title) {
        metadata.title = pdfMetadata.info.Title;
      }
    } catch (error) {
      console.warn('⚠️ Failed to extract PDF metadata:', error);
    }
    
    return metadata;
  } catch (error) {
    console.error('❌ Error extracting PDF metadata:', error);
    return { thumbnail: null, title: null, pageCount: 0 };
  }
};

/**
 * Extract metadata from Cover & Contents PDF
 * @param {Blob} coverPdfBlob - Cover PDF blob
 * @returns {Promise<Object>} - { bookTitle, chapters: [{number, title}], coverImage }
 */
const extractMetadataFromCoverPdf = async (coverPdfBlob) => {
  try {
    console.log('📖 Extracting metadata from cover PDF...');
    
    // Load PDF
    const arrayBuffer = await coverPdfBlob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const metadata = {
      bookTitle: null,
      chapters: [],
      coverImage: null
    };
    
    // Extract cover image from first page
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Create canvas for cover image
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert to base64
      metadata.coverImage = canvas.toDataURL('image/jpeg', 0.8);
      console.log('✅ Cover image extracted');
    } catch (error) {
      console.warn('⚠️ Failed to extract cover image:', error);
    }
    
    // Extract text from all pages to find TOC
    let fullText = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) { // Check first 10 pages
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('📝 Extracted text from cover PDF');
    
    // Parse book title (usually in first few lines or all caps)
    const lines = fullText.split('\n').filter(line => line.trim().length > 0);
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i].trim();
      // Look for title-like patterns (all caps, or starts with capital and has multiple words)
      if (line.length > 10 && line.length < 100) {
        // Check if it looks like a title
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 10) {
          // Likely a title
          if (!metadata.bookTitle || line.length > metadata.bookTitle.length) {
            metadata.bookTitle = line;
          }
        }
      }
    }
    
    // Parse chapter names from TOC
    // Look for patterns like:
    // "1. Chapter Name" or "Chapter 1: Name" or "1 Name" or "Chapter Name ... 10"
    const chapterPatterns = [
      /(?:Chapter\s*)?(\d+)[.:\s]+([^.\d]+?)(?:\s+\d+)?\s*$/gim,
      /(\d+)[.)\s]+([A-Z][^.\d]+?)(?:\s+\d+)?\s*$/gm,
      /Chapter\s+(\d+)\s*[:-]\s*([^.\d]+?)(?:\s+\d+)?\s*$/gim
    ];
    
    for (const pattern of chapterPatterns) {
      let match;
      while ((match = pattern.exec(fullText)) !== null) {
        const chapterNumber = parseInt(match[1], 10);
        let chapterTitle = match[2].trim();
        
        // Clean up chapter title
        chapterTitle = chapterTitle
          .replace(/\.{2,}/g, '') // Remove multiple dots
          .replace(/\s+/g, ' ') // Normalize spaces
          .replace(/\d+\s*$/, '') // Remove trailing page numbers
          .trim();
        
        // Only add if title is reasonable length and not already added
        if (chapterTitle.length > 3 && chapterTitle.length < 100) {
          const exists = metadata.chapters.find(ch => ch.number === chapterNumber);
          if (!exists) {
            metadata.chapters.push({
              number: chapterNumber,
              title: chapterTitle
            });
          }
        }
      }
    }
    
    // Sort chapters by number
    metadata.chapters.sort((a, b) => a.number - b.number);
    
    console.log('✅ Extracted metadata:', {
      bookTitle: metadata.bookTitle,
      chapterCount: metadata.chapters.length,
      hasCoverImage: !!metadata.coverImage
    });
    
    return metadata;
    
  } catch (error) {
    console.error('❌ Error extracting metadata from cover PDF:', error);
    return { bookTitle: null, chapters: [], coverImage: null };
  }
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
    
    // Ensure we have a proper collection name
    if (!zipMetadata.bookName || zipMetadata.bookName === zipFile.name.replace('.zip', '')) {
      // Try to extract a better name from the filename
      const baseName = zipFile.name.replace('.zip', '').replace(/[_-]/g, ' ');
      zipMetadata.bookName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
    
    // Read ZIP file
    const zipData = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(zipData);
    
    // Get all PDF files
    const pdfFiles = [];
    const fileEntries = Object.keys(zip.files).filter(name => 
      name.toLowerCase().endsWith('.pdf') && !zip.files[name].dir
    );
    
    console.log(`📄 Found ${fileEntries.length} PDF files`);
    
    // Look for cover/contents PDF
    let coverMetadata = null;
    const coverEntry = fileEntries.find(name => 
      name.toLowerCase().includes('cc') || 
      name.toLowerCase().includes('cover') ||
      name.toLowerCase().includes('content')
    );
    
    if (coverEntry) {
      console.log('📖 Found cover PDF:', coverEntry);
      try {
        const coverBlob = await zip.files[coverEntry].async('blob');
        coverMetadata = await extractMetadataFromCoverPdf(coverBlob);
        
        // Update ZIP metadata with extracted info
        if (coverMetadata.bookTitle) {
          zipMetadata.bookName = coverMetadata.bookTitle;
          console.log('📚 Book title:', coverMetadata.bookTitle);
        }
        if (coverMetadata.chapters.length > 0) {
          console.log('📑 Found', coverMetadata.chapters.length, 'chapter names');
        }
      } catch (error) {
        console.warn('⚠️ Failed to extract cover metadata:', error);
      }
    }
    
    // Extract each PDF
    for (let i = 0; i < fileEntries.length; i++) {
      const filename = fileEntries[i];
      const fileEntry = zip.files[filename];
      
      if (onProgress) {
        onProgress(i + 1, fileEntries.length, `Processing ${filename}...`);
      }
      
      console.log(`📖 Extracting: ${filename}`);
      
      // Get file blob
      const blob = await fileEntry.async('blob');
      
      // Parse filename for chapter info
      const fileMetadata = parseNCERTFilename(filename);
      
      // Extract metadata from this PDF
      console.log(`🔍 Extracting metadata from ${filename}...`);
      const pdfMetadata = await extractPdfMetadata(blob);
      console.log(`✅ Extracted: ${pdfMetadata.pageCount} pages, thumbnail: ${!!pdfMetadata.thumbnail}`);
      
      // Enhance with cover metadata if available
      if (coverMetadata && fileMetadata.chapter && coverMetadata.chapters.length > 0) {
        const chapterInfo = coverMetadata.chapters.find(ch => ch.number === fileMetadata.chapter);
        if (chapterInfo) {
          fileMetadata.title = chapterInfo.title;
          console.log(`📝 Chapter ${fileMetadata.chapter}: ${chapterInfo.title}`);
        }
      }
      
      // Create File object
      const pdfFile = new File([blob], filename, { type: 'application/pdf' });
      
      // Add metadata (including individual PDF metadata)
      pdfFiles.push({
        file: pdfFile,
        filename: filename,
        metadata: {
          ...zipMetadata,
          ...fileMetadata,
          collection: zipMetadata.bookName,
          originalZip: zipFile.name,
          thumbnail: pdfMetadata.thumbnail,
          totalPages: pdfMetadata.pageCount,
          pdfTitle: pdfMetadata.title,
          coverImage: fileMetadata.type === 'cover' ? coverMetadata?.coverImage : null
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
  detectMetadataFromZip,
  extractMetadataFromCoverPdf,
  extractPdfMetadata
};

