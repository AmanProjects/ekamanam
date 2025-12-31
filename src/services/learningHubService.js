/**
 * Learning Hub Service - v10.6.2
 * 
 * Manages Learning Hubs - collections of PDFs grouped together for unified learning
 * Each hub contains multiple PDFs and can have unified chat, generated materials, etc.
 * 
 * Storage: Google Drive (primary) + IndexedDB (local cache)
 */

import { uploadFile, downloadFile, listFilesInFolder, deleteFile, createFolder } from './googleDriveService';

const DB_NAME = 'EkamanamLearningHubs';
const DB_VERSION = 1;
const HUBS_STORE = 'learningHubs';
const DRIVE_FOLDER_NAME = 'LearningHubs'; // Folder in Drive for hub data

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
 * Ensure Learning Hubs folder exists in Google Drive
 * @returns {Promise<Object|null>} Folder object or null
 */
async function ensureDriveFolder() {
  try {
    // Check if folder exists
    const folders = await listFilesInFolder(null, DRIVE_FOLDER_NAME);
    if (folders && folders.length > 0) {
      return folders[0]; // Return existing folder
    }
    
    // Create folder if it doesn't exist
    const folderId = await createFolder(DRIVE_FOLDER_NAME);
    if (folderId) {
      return { id: folderId, name: DRIVE_FOLDER_NAME };
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Failed to ensure Drive folder:', error);
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

  // Save to IndexedDB first
  await new Promise((resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readwrite');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.add(hub);

    request.onsuccess = () => {
      console.log('✅ Learning Hub created in IndexedDB:', hub.name);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });

  // v10.6.2: Sync to Google Drive
  try {
    const hubFolder = await ensureDriveFolder();
    if (hubFolder) {
      const hubJson = JSON.stringify(hub, null, 2);
      const hubBlob = new Blob([hubJson], { type: 'application/json' });
      const hubFile = new File([hubBlob], `${hub.id}.json`, { type: 'application/json' });
      
      const driveFileId = await uploadFile(hubFile, hubFolder.id);
      if (driveFileId) {
        hub.driveFileId = driveFileId;
        // Update IndexedDB with Drive file ID
        await updateLearningHub(hub.id, { driveFileId });
        console.log('☁️ Learning Hub synced to Drive:', hub.name);
      }
    }
  } catch (driveError) {
    console.warn('⚠️ Failed to sync hub to Drive (will use local only):', driveError);
    // Continue anyway - hub is in IndexedDB
  }

  return hub;
}

/**
 * Get all Learning Hubs
 * @returns {Promise<Array>} Array of hubs
 */
export async function getAllLearningHubs() {
  const db = await initDB();

  // v10.6.2: Try to sync from Google Drive first
  try {
    const hubFolder = await ensureDriveFolder();
    if (hubFolder) {
      const driveFiles = await listFilesInFolder(hubFolder.id);
      if (driveFiles && driveFiles.length > 0) {
        console.log(`☁️ Found ${driveFiles.length} hubs in Drive, syncing...`);
        
        // Download and sync each hub from Drive
        for (const file of driveFiles) {
          try {
            if (file.name.endsWith('.json')) {
              const hubBlob = await downloadFile(file.id);
              const hubText = await hubBlob.text();
              const hub = JSON.parse(hubText);
              
              // Update or add to IndexedDB
              const transaction = db.transaction([HUBS_STORE], 'readwrite');
              const store = transaction.objectStore(HUBS_STORE);
              await new Promise((resolve, reject) => {
                const request = store.put(hub);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
              });
            }
          } catch (fileError) {
            console.warn('⚠️ Failed to sync hub file:', file.name, fileError);
          }
        }
        console.log('✅ Synced hubs from Drive to local cache');
      }
    }
  } catch (driveError) {
    console.warn('⚠️ Failed to sync from Drive, using local cache:', driveError);
    // Continue with IndexedDB
  }

  // Get all hubs from IndexedDB (now synced with Drive)
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readonly');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const hubs = request.result || [];
      // Sort by last accessed (most recent first)
      hubs.sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));
      console.log(`📚 Loaded ${hubs.length} Learning Hubs`);
      resolve(hubs);
    };
    request.onerror = () => reject(request.error);
  });
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
  await new Promise((resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readwrite');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.put(updatedHub);

    request.onsuccess = () => {
      console.log('✅ Learning Hub updated in IndexedDB:', updatedHub.name);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });

  // v10.6.2: Sync to Google Drive
  try {
    if (updatedHub.driveFileId) {
      // Update existing file in Drive
      const hubJson = JSON.stringify(updatedHub, null, 2);
      const hubBlob = new Blob([hubJson], { type: 'application/json' });
      const hubFile = new File([hubBlob], `${updatedHub.id}.json`, { type: 'application/json' });
      
      const hubFolder = await ensureDriveFolder();
      if (hubFolder) {
        // Delete old file and upload new one (Drive API limitation)
        await deleteFile(updatedHub.driveFileId);
        const newFileId = await uploadFile(hubFile, hubFolder.id);
        if (newFileId) {
          updatedHub.driveFileId = newFileId;
          console.log('☁️ Learning Hub synced to Drive:', updatedHub.name);
        }
      }
    }
  } catch (driveError) {
    console.warn('⚠️ Failed to sync hub update to Drive:', driveError);
    // Continue anyway - hub is updated in IndexedDB
  }

  return updatedHub;
}

/**
 * Delete a Learning Hub
 * @param {string} hubId - Hub ID
 * @returns {Promise<void>}
 */
export async function deleteLearningHub(hubId) {
  const db = await initDB();
  
  // Get hub to find Drive file ID
  let driveFileId = null;
  try {
    const hub = await getLearningHub(hubId);
    driveFileId = hub.driveFileId;
  } catch (error) {
    console.warn('Could not find hub to delete:', hubId);
  }

  // Delete from IndexedDB
  await new Promise((resolve, reject) => {
    const transaction = db.transaction([HUBS_STORE], 'readwrite');
    const store = transaction.objectStore(HUBS_STORE);
    const request = store.delete(hubId);

    request.onsuccess = () => {
      console.log('🗑️ Learning Hub deleted from IndexedDB:', hubId);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });

  // v10.6.2: Delete from Google Drive
  if (driveFileId) {
    try {
      await deleteFile(driveFileId);
      console.log('☁️ Learning Hub deleted from Drive');
    } catch (driveError) {
      console.warn('⚠️ Failed to delete hub from Drive:', driveError);
      // Continue anyway - hub is deleted from IndexedDB
    }
  }
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

