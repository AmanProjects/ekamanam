/**
 * Library Service - Manages PDF library storage using IndexedDB + Google Drive
 *
 * Features:
 * - Store PDFs and metadata in browser database (IndexedDB)
 * - Sync PDFs to user's Google Drive for cross-device access
 * - Add, remove, update library items
 * - Query and search library
 * - Generate thumbnails
 * - Track reading progress
 *
 * Storage Structure:
 * - IndexedDB (local): Fast access, offline capability
 *   - library_items: PDF metadata
 *   - pdf_data: Actual PDF binary data
 *   - thumbnails: Preview images
 * - Google Drive (cloud): Cross-device sync
 *   - Ekamanam/PDFs/: PDF files
 *   - ekamanam_library.json: Library index
 *
 * @version 7.1.0 - Added Google Drive sync
 */

import { openDB } from 'idb';
import {
  hasDrivePermissions,
  initializeFolderStructure,
  uploadFile,
  downloadFile,
  getLibraryIndex,
  updateLibraryIndex,
  deleteFile,
  FOLDER_STRUCTURE
} from './googleDriveService';

const DB_NAME = 'ekamanam_library';
const DB_VERSION = 2;  // V3.0: Upgraded for exam prep cache

// Store names
const STORES = {
  LIBRARY_ITEMS: 'library_items',
  PDF_DATA: 'pdf_data',
  THUMBNAILS: 'thumbnails',
  EXAM_PREP: 'exam_prep'  // V3.0: New store for cached exam questions
};

/**
 * Initialize IndexedDB database
 */
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Library Items Store
      if (!db.objectStoreNames.contains(STORES.LIBRARY_ITEMS)) {
        const libraryStore = db.createObjectStore(STORES.LIBRARY_ITEMS, { 
          keyPath: 'id' 
        });
        libraryStore.createIndex('lastOpened', 'lastOpened');
        libraryStore.createIndex('dateAdded', 'dateAdded');
        libraryStore.createIndex('subject', 'subject');
        libraryStore.createIndex('workspace', 'workspace');
        libraryStore.createIndex('name', 'name');
      }

      // PDF Data Store (binary data)
      if (!db.objectStoreNames.contains(STORES.PDF_DATA)) {
        db.createObjectStore(STORES.PDF_DATA, { keyPath: 'id' });
      }

      // Thumbnails Store
      if (!db.objectStoreNames.contains(STORES.THUMBNAILS)) {
        db.createObjectStore(STORES.THUMBNAILS, { keyPath: 'id' });
      }

      // V3.0: Exam Prep Cache Store (upgrade from v1 to v2)
      if (oldVersion < 2 && !db.objectStoreNames.contains(STORES.EXAM_PREP)) {
        const examStore = db.createObjectStore(STORES.EXAM_PREP, { keyPath: 'id' });
        examStore.createIndex('generatedAt', 'generatedAt');
        console.log('✅ V3.0: Created exam_prep store for caching');
      }
    }
  });
};

/**
 * Generate unique ID
 */
const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Add PDF to library (IndexedDB + Google Drive sync)
 * @param {File} file - PDF file object
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Library item
 */
export const addPDFToLibrary = async (file, metadata = {}) => {
  try {
    const db = await initDB();
    const id = generateId();

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Create library item
    const libraryItem = {
      id,
      type: 'pdf',
      name: metadata.name || file.name.replace('.pdf', ''),
      originalFileName: file.name,
      size: file.size,
      dateAdded: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
      totalPages: metadata.totalPages || 0,
      lastPage: 1,
      progress: 0,
      subject: metadata.subject || 'General',
      class: metadata.class || null,
      collection: metadata.collection || null,
      chapter: metadata.chapter || null,
      chapterTitle: metadata.chapterTitle || null,
      pdfTitle: metadata.pdfTitle || null,
      workspace: metadata.workspace || 'My Files',
      workspaceId: metadata.workspaceId || null,
      tags: metadata.tags || [],
      bookmarks: [],
      notes: 0,
      timeSpent: 0,
      storageType: 'hybrid', // IndexedDB + Drive
      driveFileId: null, // Will be set after upload
      thumbnailUrl: null,
      pdfDataKey: id,
      userId: metadata.userId || null
    };

    console.log('📚 Created library item with collection:', libraryItem.collection, 'pages:', libraryItem.totalPages);

    // Store in IndexedDB first (fast, always works)
    await db.put(STORES.PDF_DATA, {
      id,
      data: arrayBuffer
    });

    await db.put(STORES.LIBRARY_ITEMS, libraryItem);
    console.log('✅ PDF saved to IndexedDB:', libraryItem.name);

    // v7.1.0: Sync to Google Drive (if connected)
    if (hasDrivePermissions()) {
      try {
        console.log('☁️ Syncing to Google Drive...');

        const folders = await initializeFolderStructure();

        // Upload PDF to Drive
        const driveFile = await uploadFile(
          file,
          folders.pdfs,
          `${id}.pdf`,
          'application/pdf'
        );

        // Update library item with Drive file ID
        libraryItem.driveFileId = driveFile.id;
        await db.put(STORES.LIBRARY_ITEMS, libraryItem);

        // Update library index in Drive - v7.2.8: Include ALL metadata fields
        const { fileId: indexFileId, data: indexData } = await getLibraryIndex();
        indexData.pdfs.push({
          id: libraryItem.id,
          driveFileId: driveFile.id,
          name: libraryItem.name,
          originalFileName: libraryItem.originalFileName,
          size: libraryItem.size,
          dateAdded: libraryItem.dateAdded,
          lastOpened: libraryItem.lastOpened,
          subject: libraryItem.subject,
          class: libraryItem.class,           // v7.2.8: For Classes count
          collection: libraryItem.collection, // v7.2.8: For grouping (not Uncategorized)
          chapter: libraryItem.chapter,       // v7.2.8: For chapter ordering
          chapterTitle: libraryItem.chapterTitle,
          totalPages: libraryItem.totalPages, // v7.2.8: For Pages count
          lastPage: libraryItem.lastPage,
          progress: libraryItem.progress,
          workspace: libraryItem.workspace,
          tags: libraryItem.tags
        });
        await updateLibraryIndex(indexFileId, indexData);

        console.log('✅ PDF synced to Drive:', driveFile.id);
      } catch (driveError) {
        console.warn('⚠️ Drive sync failed (will retry later):', driveError);
        // Don't throw - IndexedDB save succeeded, Drive is optional
      }
    } else {
      console.log('ℹ️ Drive not connected - PDF saved locally only');
    }

    return libraryItem;
  } catch (error) {
    console.error('❌ Error adding PDF to library:', error);
    throw error;
  }
};

/**
 * Get all library items
 * @returns {Promise<Array>} Array of library items
 */
export const getAllLibraryItems = async () => {
  try {
    let items = [];

    // v7.1.4: Load from Google Drive if connected, show only samples if not signed in
    if (hasDrivePermissions()) {
      console.log('📁 Loading library from Google Drive...');
      try {
        const driveIndex = await getLibraryIndex();
        items = driveIndex.data.pdfs || [];
        console.log(`✅ Loaded ${items.length} PDFs from Drive`);
        
        // v7.2.8: Auto-repair if we detect missing metadata
        // Check if any items are missing collection/class/totalPages
        const needsRepair = items.some(item => 
          item.collection === undefined || item.class === undefined || item.totalPages === undefined
        );
        
        if (needsRepair && items.length > 0) {
          console.log('🔧 Detected missing metadata, attempting auto-repair...');
          // Don't await - run in background to not block loading
          repairDriveLibraryMetadata().then(result => {
            if (result.success && result.synced > 0) {
              console.log(`🎉 Auto-repaired ${result.synced} PDFs. Refresh to see updates.`);
            }
          }).catch(err => console.warn('⚠️ Auto-repair failed:', err));
        }
      } catch (driveError) {
        console.error('❌ Error loading from Drive, falling back to IndexedDB:', driveError);
        // Fallback to IndexedDB if Drive fails
        const db = await initDB();
        items = await db.getAll(STORES.LIBRARY_ITEMS);
      }
    } else {
      console.log('🔒 Not signed in - showing only sample PDFs');
      // When not signed in, don't show local IndexedDB PDFs
      items = [];
    }

    // Add sample PDFs (always available)
    const samplePDFs = [
      {
        id: 'sample-coordinate-geometry',
        name: 'Coordinate Geometry',
        type: 'sample',
        category: 'Mathematics',
        addedAt: new Date('2024-01-01').toISOString(),
        lastOpened: new Date('2024-01-01').toISOString(),
        size: 10720323,
        pageCount: 32
      },
      {
        id: 'sample-freedom-movement',
        name: 'Freedom Movement in Hyderabad State',
        type: 'sample',
        category: 'Social Studies',
        addedAt: new Date('2024-01-01').toISOString(),
        lastOpened: new Date('2024-01-01').toISOString(),
        size: 8500000,
        pageCount: 28
      }
    ];

    // Combine user PDFs with sample PDFs
    const allItems = [...items, ...samplePDFs];

    return allItems.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
  } catch (error) {
    console.error('❌ Error getting library items:', error);
    return [];
  }
};

/**
 * Get library item by ID
 * @param {string} id - Library item ID
 * @returns {Promise<Object>} Library item
 */
export const getLibraryItem = async (id) => {
  try {
    const db = await initDB();
    return await db.get(STORES.LIBRARY_ITEMS, id);
  } catch (error) {
    console.error('❌ Error getting library item:', error);
    return null;
  }
};

/**
 * Load PDF data from library
 * @param {string} id - Library item ID
 * @returns {Promise<ArrayBuffer>} PDF data
 */
export const loadPDFData = async (id) => {
  try {
    const db = await initDB();
    const item = await db.get(STORES.PDF_DATA, id);
    return item ? item.data : null;
  } catch (error) {
    console.error('❌ Error loading PDF data:', error);
    return null;
  }
};

/**
 * Remove PDF from library (IndexedDB + Google Drive)
 * @param {string} id - Library item ID
 * @returns {Promise<void>}
 */
export const removePDFFromLibrary = async (id) => {
  try {
    const db = await initDB();

    // Get library item to find Drive file ID
    const libraryItem = await db.get(STORES.LIBRARY_ITEMS, id);

    // Remove from all IndexedDB stores
    await db.delete(STORES.LIBRARY_ITEMS, id);
    await db.delete(STORES.PDF_DATA, id);
    await db.delete(STORES.THUMBNAILS, id);

    console.log('✅ PDF removed from IndexedDB:', id);

    // v7.1.0: Remove from Google Drive (if synced)
    if (libraryItem?.driveFileId && hasDrivePermissions()) {
      try {
        await deleteFile(libraryItem.driveFileId);

        // Update library index in Drive
        const { fileId: indexFileId, data: indexData } = await getLibraryIndex();
        indexData.pdfs = indexData.pdfs.filter(pdf => pdf.id !== id);
        await updateLibraryIndex(indexFileId, indexData);

        console.log('✅ PDF removed from Drive:', libraryItem.driveFileId);
      } catch (driveError) {
        console.warn('⚠️ Drive deletion failed:', driveError);
        // Don't throw - local deletion succeeded
      }
    }
  } catch (error) {
    console.error('❌ Error removing PDF from library:', error);
    throw error;
  }
};

/**
 * Update library item metadata
 * v7.2.26: Updated to support both IndexedDB and Google Drive
 * @param {string} id - Library item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated library item
 */
export const updateLibraryItem = async (id, updates) => {
  try {
    let updatedItem = null;
    let foundInIndexedDB = false;
    let foundInDrive = false;

    // Try to update in IndexedDB first
    try {
      const db = await initDB();
      const item = await db.get(STORES.LIBRARY_ITEMS, id);
      
      if (item) {
        foundInIndexedDB = true;
        updatedItem = { ...item, ...updates };
        await db.put(STORES.LIBRARY_ITEMS, updatedItem);
        console.log('✅ Library item updated in IndexedDB:', id);
      }
    } catch (dbError) {
      console.warn('⚠️ IndexedDB update failed:', dbError);
    }

    // v7.2.26: Also update in Google Drive if connected
    if (hasDrivePermissions()) {
      try {
        const { fileId: indexFileId, data: indexData } = await getLibraryIndex();
        const pdfIndex = indexData.pdfs?.findIndex(pdf => pdf.id === id);
        
        if (pdfIndex !== -1 && pdfIndex !== undefined) {
          foundInDrive = true;
          
          // Update the PDF entry in Drive index
          indexData.pdfs[pdfIndex] = {
            ...indexData.pdfs[pdfIndex],
            ...updates
          };
          
          await updateLibraryIndex(indexFileId, indexData);
          updatedItem = indexData.pdfs[pdfIndex];
          console.log('✅ Library item updated in Google Drive:', id);
        }
      } catch (driveError) {
        console.warn('⚠️ Drive update failed:', driveError);
        // Don't throw if IndexedDB succeeded
        if (!foundInIndexedDB) {
          throw driveError;
        }
      }
    }

    // If not found in either place, throw error
    if (!foundInIndexedDB && !foundInDrive) {
      throw new Error('Library item not found in local storage or Google Drive');
    }

    return updatedItem;
  } catch (error) {
    console.error('❌ Error updating library item:', error);
    throw error;
  }
};

/**
 * Update last page position
 * @param {string} id - Library item ID
 * @param {number} pageNumber - Current page number
 * @returns {Promise<void>}
 */
export const updateLastPage = async (id, pageNumber) => {
  try {
    const item = await getLibraryItem(id);
    if (!item) return;

    const progress = item.totalPages > 0 
      ? Math.round((pageNumber / item.totalPages) * 100) 
      : 0;

    await updateLibraryItem(id, {
      lastPage: pageNumber,
      progress,
      lastOpened: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating last page:', error);
  }
};

/**
 * Update last opened timestamp
 * @param {string} id - Library item ID
 * @returns {Promise<void>}
 */
export const updateLastOpened = async (id) => {
  try {
    await updateLibraryItem(id, {
      lastOpened: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating last opened:', error);
  }
};

/**
 * Get recently opened PDFs
 * @param {number} limit - Number of items to return
 * @returns {Promise<Array>} Recently opened items
 */
export const getRecentlyOpened = async (limit = 5) => {
  try {
    const items = await getAllLibraryItems();
    return items.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting recently opened:', error);
    return [];
  }
};

/**
 * Search library by name or subject
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching items
 */
export const searchLibrary = async (query) => {
  try {
    const items = await getAllLibraryItems();
    const lowerQuery = query.toLowerCase();
    
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.subject.toLowerCase().includes(lowerQuery) ||
      item.workspace.toLowerCase().includes(lowerQuery) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  } catch (error) {
    console.error('❌ Error searching library:', error);
    return [];
  }
};

/**
 * Get library statistics
 * @returns {Promise<Object>} Library stats
 */
export const getLibraryStats = async () => {
  try {
    const items = await getAllLibraryItems();
    
    const stats = {
      totalPDFs: items.length,
      totalPages: items.reduce((sum, item) => sum + (item.totalPages || 0), 0),
      totalSize: items.reduce((sum, item) => sum + (item.size || 0), 0),
      completedPDFs: items.filter(item => item.progress >= 100).length,
      inProgressPDFs: items.filter(item => item.progress > 0 && item.progress < 100).length,
      notStartedPDFs: items.filter(item => item.progress === 0).length,
      subjects: {},
      lastUpdated: new Date().toISOString()
    };

    // Count by subject
    items.forEach(item => {
      const subject = item.subject || 'General';
      stats.subjects[subject] = (stats.subjects[subject] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Error getting library stats:', error);
    return {
      totalPDFs: 0,
      totalPages: 0,
      totalSize: 0,
      completedPDFs: 0,
      inProgressPDFs: 0,
      notStartedPDFs: 0,
      subjects: {},
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Generate thumbnail from PDF
 * @param {string} id - Library item ID
 * @param {Object} pdfDocument - PDF.js document
 * @returns {Promise<string>} Data URL of thumbnail
 */
export const generateThumbnail = async (id, pdfDocument) => {
  try {
    // Get first page
    const page = await pdfDocument.getPage(1);
    
    // Set thumbnail size (200x300)
    const viewport = page.getViewport({ scale: 0.5 });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert to data URL
    const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);

    // Store thumbnail
    const db = await initDB();
    await db.put(STORES.THUMBNAILS, {
      id,
      url: thumbnailUrl
    });

    // Update library item
    await updateLibraryItem(id, { thumbnailUrl });

    console.log('✅ Thumbnail generated:', id);
    return thumbnailUrl;
  } catch (error) {
    console.error('❌ Error generating thumbnail:', error);
    return null;
  }
};

/**
 * Get thumbnail
 * @param {string} id - Library item ID
 * @returns {Promise<string>} Thumbnail URL
 */
export const getThumbnail = async (id) => {
  try {
    const db = await initDB();
    const item = await db.get(STORES.THUMBNAILS, id);
    return item ? item.url : null;
  } catch (error) {
    console.error('❌ Error getting thumbnail:', error);
    return null;
  }
};

/**
 * Store thumbnail directly (e.g., from ZIP cover)
 * @param {string} id - Library item ID
 * @param {string} dataUrl - Base64 data URL
 * @returns {Promise<boolean>}
 */
export const storeThumbnail = async (id, dataUrl) => {
  try {
    const db = await initDB();
    await db.put(STORES.THUMBNAILS, {
      id,
      url: dataUrl,
      timestamp: new Date().toISOString()
    });
    
    // Update library item with thumbnail URL
    const libraryItem = await getLibraryItem(id);
    if (libraryItem) {
      await updateLibraryItem(id, { thumbnailUrl: dataUrl });
    }
    
    console.log('✅ Thumbnail stored for:', id);
    return true;
  } catch (error) {
    console.error('❌ Error storing thumbnail:', error);
    return false;
  }
};

/**
 * Clear entire library (for testing/reset)
 * @returns {Promise<void>}
 */
export const clearLibrary = async () => {
  try {
    const db = await initDB();
    await db.clear(STORES.LIBRARY_ITEMS);
    await db.clear(STORES.PDF_DATA);
    await db.clear(STORES.THUMBNAILS);
    await db.clear(STORES.EXAM_PREP);  // V3.0: Also clear exam prep
    console.log('✅ Library cleared');
  } catch (error) {
    console.error('❌ Error clearing library:', error);
    throw error;
  }
};

/**
 * V3.0: Save exam prep to cache
 * @param {string} pdfId - PDF ID
 * @param {Object} examData - Exam prep data (mcqs, shortAnswer, longAnswer)
 * @returns {Promise<void>}
 */
export const saveExamPrepCache = async (pdfId, examData) => {
  try {
    const db = await initDB();
    await db.put(STORES.EXAM_PREP, {
      id: pdfId,
      data: examData,
      generatedAt: new Date().toISOString(),
      version: '3.0'
    });
    console.log('✅ Exam prep cached for', pdfId);
  } catch (error) {
    console.error('❌ Error caching exam prep:', error);
    throw error;
  }
};

/**
 * V3.0: Load exam prep from cache
 * @param {string} pdfId - PDF ID
 * @returns {Promise<Object|null>} Cached exam data or null
 */
export const loadExamPrepCache = async (pdfId) => {
  try {
    const db = await initDB();
    const cached = await db.get(STORES.EXAM_PREP, pdfId);
    if (cached) {
      console.log('⚡ Exam prep loaded from cache for', pdfId);
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading exam prep cache:', error);
    return null;
  }
};

/**
 * V3.0: Check if exam prep cache exists
 * @param {string} pdfId - PDF ID
 * @returns {Promise<boolean>}
 */
export const hasExamPrepCache = async (pdfId) => {
  try {
    const db = await initDB();
    const cached = await db.get(STORES.EXAM_PREP, pdfId);
    return !!cached;
  } catch (error) {
    return false;
  }
};

/**
 * V3.0: Delete exam prep cache for a PDF
 * @param {string} pdfId - PDF ID
 * @returns {Promise<void>}
 */
export const deleteExamPrepCache = async (pdfId) => {
  try {
    const db = await initDB();
    await db.delete(STORES.EXAM_PREP, pdfId);
    console.log('✅ Exam prep cache deleted for', pdfId);
  } catch (error) {
    console.error('❌ Error deleting exam prep cache:', error);
    throw error;
  }
};

/**
 * v7.2.8: Repair/sync library metadata from IndexedDB to Google Drive
 * This fixes PDFs that were uploaded before full metadata sync was implemented
 * @returns {Promise<Object>} Repair results
 */
export const repairDriveLibraryMetadata = async () => {
  if (!hasDrivePermissions()) {
    console.log('⚠️ Drive not connected - cannot repair');
    return { success: false, error: 'Drive not connected' };
  }

  try {
    console.log('🔧 Repairing Drive library metadata...');
    
    const db = await initDB();
    const localItems = await db.getAll(STORES.LIBRARY_ITEMS);
    
    if (localItems.length === 0) {
      console.log('ℹ️ No local items to sync');
      return { success: true, synced: 0 };
    }

    // Get current Drive index
    const { fileId: indexFileId, data: indexData } = await getLibraryIndex();
    
    let updatedCount = 0;
    
    // For each local item, update the Drive index with full metadata
    for (const localItem of localItems) {
      const driveItemIndex = indexData.pdfs.findIndex(p => p.id === localItem.id);
      
      if (driveItemIndex >= 0) {
        // Update existing entry with full metadata
        indexData.pdfs[driveItemIndex] = {
          ...indexData.pdfs[driveItemIndex],
          name: localItem.name,
          originalFileName: localItem.originalFileName,
          size: localItem.size,
          dateAdded: localItem.dateAdded,
          lastOpened: localItem.lastOpened,
          subject: localItem.subject,
          class: localItem.class,
          collection: localItem.collection,
          chapter: localItem.chapter,
          chapterTitle: localItem.chapterTitle,
          totalPages: localItem.totalPages,
          lastPage: localItem.lastPage,
          progress: localItem.progress,
          workspace: localItem.workspace,
          tags: localItem.tags
        };
        updatedCount++;
        console.log(`✅ Updated metadata for: ${localItem.name}`);
      }
    }

    // Save updated index
    if (updatedCount > 0) {
      await updateLibraryIndex(indexFileId, indexData);
      console.log(`🎉 Repaired ${updatedCount} PDFs in Drive`);
    }

    return { success: true, synced: updatedCount };
  } catch (error) {
    console.error('❌ Error repairing library metadata:', error);
    return { success: false, error: error.message };
  }
};

export default {
  addPDFToLibrary,
  getAllLibraryItems,
  getLibraryItem,
  loadPDFData,
  removePDFFromLibrary,
  updateLibraryItem,
  updateLastPage,
  updateLastOpened,
  getRecentlyOpened,
  searchLibrary,
  getLibraryStats,
  generateThumbnail,
  getThumbnail,
  storeThumbnail,
  clearLibrary,
  // V3.0: Exam prep caching
  saveExamPrepCache,
  loadExamPrepCache,
  hasExamPrepCache,
  deleteExamPrepCache,
  // v7.2.8: Repair function
  repairDriveLibraryMetadata
};

