/**
 * Library Service - Manages PDF library storage using IndexedDB
 * 
 * Features:
 * - Store PDFs and metadata in browser database
 * - Add, remove, update library items
 * - Query and search library
 * - Generate thumbnails
 * - Track reading progress
 * 
 * Storage Structure:
 * - library_items: PDF metadata
 * - pdf_data: Actual PDF binary data
 * - thumbnails: Preview images
 */

import { openDB } from 'idb';

const DB_NAME = 'ekamanam_library';
const DB_VERSION = 1;

// Store names
const STORES = {
  LIBRARY_ITEMS: 'library_items',
  PDF_DATA: 'pdf_data',
  THUMBNAILS: 'thumbnails'
};

/**
 * Initialize IndexedDB database
 */
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
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
 * Add PDF to library
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
      workspace: metadata.workspace || 'My Files',
      workspaceId: metadata.workspaceId || null,
      tags: metadata.tags || [],
      bookmarks: [],
      notes: 0,
      timeSpent: 0,
      storageType: 'indexeddb',
      thumbnailUrl: null,
      pdfDataKey: id,
      userId: metadata.userId || null
    };

    // Store PDF data
    await db.put(STORES.PDF_DATA, {
      id,
      data: arrayBuffer
    });

    // Store library item
    await db.put(STORES.LIBRARY_ITEMS, libraryItem);

    console.log('✅ PDF added to library:', libraryItem.name);
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
    const db = await initDB();
    const items = await db.getAll(STORES.LIBRARY_ITEMS);
    return items.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
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
 * Remove PDF from library
 * @param {string} id - Library item ID
 * @returns {Promise<void>}
 */
export const removePDFFromLibrary = async (id) => {
  try {
    const db = await initDB();
    
    // Remove from all stores
    await db.delete(STORES.LIBRARY_ITEMS, id);
    await db.delete(STORES.PDF_DATA, id);
    await db.delete(STORES.THUMBNAILS, id);

    console.log('✅ PDF removed from library:', id);
  } catch (error) {
    console.error('❌ Error removing PDF from library:', error);
    throw error;
  }
};

/**
 * Update library item metadata
 * @param {string} id - Library item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated library item
 */
export const updateLibraryItem = async (id, updates) => {
  try {
    const db = await initDB();
    const item = await db.get(STORES.LIBRARY_ITEMS, id);
    
    if (!item) {
      throw new Error('Library item not found');
    }

    const updatedItem = { ...item, ...updates };
    await db.put(STORES.LIBRARY_ITEMS, updatedItem);

    console.log('✅ Library item updated:', id);
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
 * Clear entire library (for testing/reset)
 * @returns {Promise<void>}
 */
export const clearLibrary = async () => {
  try {
    const db = await initDB();
    await db.clear(STORES.LIBRARY_ITEMS);
    await db.clear(STORES.PDF_DATA);
    await db.clear(STORES.THUMBNAILS);
    console.log('✅ Library cleared');
  } catch (error) {
    console.error('❌ Error clearing library:', error);
    throw error;
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
  clearLibrary
};

