/**
 * Learning Hub Service - v11.0.1
 * 
 * Manages Learning Hubs - collections of PDFs grouped together for unified learning
 * Each hub contains multiple PDFs and can have unified chat, generated materials, etc.
 * 
 * Storage: Google Drive (primary) + IndexedDB (local cache)
 * Syncs hubs to Google Drive for cross-device access
 */

import {
  hasDrivePermissions,
  getHubsIndex,
  updateHubsIndex
} from './googleDriveService';

const DB_NAME = 'EkamanamLearningHubs';
const DB_VERSION = 1;
const HUBS_STORE = 'learningHubs';

/**
 * Initialize IndexedDB for Learning Hubs
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create hubs store if it doesn't exist
      if (!db.objectStoreNames.contains(HUBS_STORE)) {
        const hubStore = db.createObjectStore(HUBS_STORE, { keyPath: 'id' });
        hubStore.createIndex('name', 'name', { unique: false });
        hubStore.createIndex('createdAt', 'createdAt', { unique: false });
        hubStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        hubStore.createIndex('driveFileId', 'driveFileId', { unique: false });
      }
    };
  });
}

/**
 * Sync hubs to Google Drive
 * @param {Array} hubs - Array of hub objects
 */
async function syncHubsToDrive(hubs) {
  if (!hasDrivePermissions()) {
    console.log('⚠️ Drive permissions not available, skipping hub sync');
    return;
  }

  try {
    const hubsIndex = await getHubsIndex();
    hubsIndex.data.hubs = hubs;
    await updateHubsIndex(hubsIndex.fileId, hubsIndex.data);
    console.log('✅ Synced hubs to Google Drive');
  } catch (error) {
    console.error('❌ Error syncing hubs to Drive:', error);
    // Don't throw - allow operation to succeed even if Drive sync fails
  }
}

/**
 * Load hubs from Google Drive and merge with local
 * @returns {Promise<Array>} Merged hub array
 */
async function loadHubsFromDrive() {
  if (!hasDrivePermissions()) {
    return null;
  }

  try {
    const hubsIndex = await getHubsIndex();
    return hubsIndex.data.hubs || [];
  } catch (error) {
    console.error('❌ Error loading hubs from Drive:', error);
    return null;
  }
}

/**
 * Create a new Learning Hub
 * @param {Object} hubData - Hub information
 * @returns {Promise<Object>} Created hub
 */
export async function createLearningHub(hubData) {
  const db = await initDB();
  
  const hub = {
    id: `hub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: hubData.name || 'Untitled Hub',
    description: hubData.description || '',
    icon: hubData.icon || '📚',
    color: hubData.color || '#2196F3',
    pdfIds: hubData.pdfIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    driveFileId: null // Will be set after Drive upload
  };

  // Save to IndexedDB
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readwrite');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.add(hub);

    request.onsuccess = async () => {
      console.log('✅ Learning Hub created:', hub.name);
      
      // Sync to Google Drive
      const allHubs = await getAllLearningHubs();
      await syncHubsToDrive(allHubs);
      
      resolve(hub);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all Learning Hubs
 * @returns {Promise<Array>} Array of hubs
 */
export async function getAllLearningHubs() {
  const db = await initDB();

  // Get all hubs from IndexedDB
  const localHubs = await new Promise((resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readonly');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  // Try to load from Google Drive and merge
  const driveHubs = await loadHubsFromDrive();
  
  if (driveHubs && driveHubs.length > 0) {
    console.log(`☁️ Loaded ${driveHubs.length} hubs from Drive`);
    
    // Merge Drive hubs with local hubs
    const hubMap = new Map();
    
    // Add local hubs
    localHubs.forEach(hub => hubMap.set(hub.id, hub));
    
    // Merge Drive hubs (Drive version wins for conflicts)
    for (const driveHub of driveHubs) {
      const localHub = hubMap.get(driveHub.id);
      if (!localHub || new Date(driveHub.updatedAt) > new Date(localHub.updatedAt)) {
        hubMap.set(driveHub.id, driveHub);
        
        // Save to IndexedDB if missing or outdated
        if (!localHub || new Date(driveHub.updatedAt) > new Date(localHub.updatedAt)) {
          const transaction = db.transaction([HUBS_STORE], 'readwrite');
          const store = transaction.objectStore(HUBS_STORE);
          store.put(driveHub);
        }
      }
    }
    
    const mergedHubs = Array.from(hubMap.values());
    mergedHubs.sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));
    console.log(`📚 Loaded ${mergedHubs.length} Learning Hubs (merged)`);
    return mergedHubs;
  }

  // No Drive hubs - return local only
  localHubs.sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));
  console.log(`📚 Loaded ${localHubs.length} Learning Hubs (local only)`);
  return localHubs;
}

/**
 * Get a single Learning Hub by ID
 * @param {string} hubId - Hub ID
 * @returns {Promise<Object>} Hub object
 */
export async function getLearningHub(hubId) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readonly');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.get(hubId);

    request.onsuccess = () => {
      if (request.result) {
        console.log('📖 Loaded Learning Hub:', request.result.name);
        resolve(request.result);
      } else {
        reject(new Error('Hub not found'));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update a Learning Hub
 * @param {string} hubId - Hub ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated hub
 */
export async function updateLearningHub(hubId, updates) {
  const db = await initDB();
  const hub = await getLearningHub(hubId);

  const updatedHub = {
    ...hub,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Update in IndexedDB
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readwrite');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.put(updatedHub);

    request.onsuccess = async () => {
      console.log('✅ Learning Hub updated:', updatedHub.name);
      
      // Sync to Google Drive
      const allHubs = await getAllLearningHubs();
      await syncHubsToDrive(allHubs);
      
      resolve(updatedHub);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a Learning Hub
 * @param {string} hubId - Hub ID
 * @returns {Promise<void>}
 */
export async function deleteLearningHub(hubId) {
  const db = await initDB();

  // Delete from IndexedDB
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readwrite');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.delete(hubId);

    request.onsuccess = async () => {
      console.log('🗑️ Learning Hub deleted:', hubId);
      
      // Sync deletion to Google Drive
      const allHubs = await getAllLearningHubs();
      await syncHubsToDrive(allHubs);
      
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add a PDF to a Learning Hub
 * @param {string} hubId - Hub ID
 * @param {string} pdfId - PDF ID to add
 * @returns {Promise<Object>} Updated hub
 */
export async function addPdfToHub(hubId, pdfId) {
  const hub = await getLearningHub(hubId);
  
  if (!hub.pdfIds.includes(pdfId)) {
    hub.pdfIds.push(pdfId);
    return await updateLearningHub(hubId, { pdfIds: hub.pdfIds });
  }
  
  return hub;
}

/**
 * Remove a PDF from a Learning Hub
 * @param {string} hubId - Hub ID
 * @param {string} pdfId - PDF ID to remove
 * @returns {Promise<Object>} Updated hub
 */
export async function removePdfFromHub(hubId, pdfId) {
  const hub = await getLearningHub(hubId);
  hub.pdfIds = hub.pdfIds.filter(id => id !== pdfId);
  return await updateLearningHub(hubId, { pdfIds: hub.pdfIds });
}

/**
 * Update last accessed time for a hub
 * @param {string} hubId - Hub ID
 * @returns {Promise<Object>} Updated hub
 */
export async function markHubAccessed(hubId) {
  return await updateLearningHub(hubId, { 
    lastAccessedAt: new Date().toISOString() 
  });
}

/**
 * Get all hubs that contain a specific PDF
 * @param {string} pdfId - PDF ID
 * @returns {Promise<Array>} Array of hubs containing this PDF
 */
export async function getHubsForPdf(pdfId) {
  const allHubs = await getAllLearningHubs();
  return allHubs.filter(hub => hub.pdfIds.includes(pdfId));
}

/**
 * Get stats for a hub (PDF count, total pages, etc.)
 * @param {Object} hub - Hub object
 * @param {Array} allPdfs - All PDFs from library
 * @returns {Object} Hub statistics
 */
export function getHubStats(hub, allPdfs) {
  const hubPdfs = allPdfs.filter(pdf => hub.pdfIds.includes(pdf.id));
  
  const totalPages = hubPdfs.reduce((sum, pdf) => sum + (pdf.totalPages || 0), 0);
  const totalProgress = hubPdfs.reduce((sum, pdf) => sum + (pdf.progress || 0), 0);
  const avgProgress = hubPdfs.length > 0 ? Math.round(totalProgress / hubPdfs.length) : 0;
  
  return {
    pdfCount: hubPdfs.length,
    totalPages,
    avgProgress,
    lastAccessed: hub.lastAccessedAt,
    pdfs: hubPdfs
  };
}

export default {
  createLearningHub,
  getAllLearningHubs,
  getLearningHub,
  updateLearningHub,
  deleteLearningHub,
  addPdfToHub,
  removePdfFromHub,
  markHubAccessed,
  getHubsForPdf,
  getHubStats
};

