/**
 * Experiment Service
 * 
 * Manages user's experiments library:
 * - CRUD operations (Create, Read, Update, Delete)
 * - IndexedDB storage (local)
 * - Google Drive sync (cloud backup)
 * - Download/Upload JSON files
 * - Cross-user sharing
 */

import { openDB } from 'idb';
import { validateExperiment, exportExperiment, importExperiment } from '../schemas/experimentSchema';

const DB_NAME = 'ekamanam_experiments';
const DB_VERSION = 1;
const STORE_NAME = 'experiments';

// Google Drive folder name
const EXPERIMENTS_FOLDER_NAME = 'Ekamanam_Experiments';

/**
 * Initialize IndexedDB
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lab', 'metadata.lab');
        store.createIndex('created', 'created');
        store.createIndex('modified', 'modified');
      }
    }
  });
}

/**
 * Create/Save a new experiment
 */
export async function saveExperiment(experiment, userId = null) {
  try {
    // Validate
    const validation = validateExperiment(experiment);
    if (!validation.valid) {
      throw new Error(`Invalid experiment: ${validation.error}`);
    }
    
    // Set author
    if (userId) {
      experiment.metadata.author = userId;
    }
    
    // Update modified timestamp
    experiment.modified = Date.now();
    
    // Save to IndexedDB
    const db = await getDB();
    await db.put(STORE_NAME, experiment);
    
    console.log('✅ Experiment saved to IndexedDB:', experiment.id);
    
    // Sync to Google Drive (async, non-blocking)
    syncExperimentToDrive(experiment).catch(err => 
      console.warn('⚠️ Failed to sync experiment to Drive:', err)
    );
    
    return { success: true, experiment };
  } catch (error) {
    console.error('❌ Failed to save experiment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all experiments
 */
export async function getAllExperiments() {
  try {
    const db = await getDB();
    const experiments = await db.getAll(STORE_NAME);
    
    // Sort by modified date (newest first)
    experiments.sort((a, b) => b.modified - a.modified);
    
    return { success: true, experiments };
  } catch (error) {
    console.error('❌ Failed to get experiments:', error);
    return { success: false, error: error.message, experiments: [] };
  }
}

/**
 * Get experiments by lab type
 */
export async function getExperimentsByLab(labType) {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.store.index('lab');
    const experiments = await index.getAll(labType);
    
    // Sort by modified date (newest first)
    experiments.sort((a, b) => b.modified - a.modified);
    
    return { success: true, experiments };
  } catch (error) {
    console.error(`❌ Failed to get ${labType} experiments:`, error);
    return { success: false, error: error.message, experiments: [] };
  }
}

/**
 * Get a single experiment by ID
 */
export async function getExperiment(experimentId) {
  try {
    const db = await getDB();
    const experiment = await db.get(STORE_NAME, experimentId);
    
    if (!experiment) {
      return { success: false, error: 'Experiment not found' };
    }
    
    return { success: true, experiment };
  } catch (error) {
    console.error('❌ Failed to get experiment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing experiment
 */
export async function updateExperiment(experimentId, updates) {
  try {
    const db = await getDB();
    const experiment = await db.get(STORE_NAME, experimentId);
    
    if (!experiment) {
      return { success: false, error: 'Experiment not found' };
    }
    
    // Merge updates
    const updated = {
      ...experiment,
      ...updates,
      id: experimentId, // Ensure ID doesn't change
      modified: Date.now()
    };
    
    // Validate
    const validation = validateExperiment(updated);
    if (!validation.valid) {
      throw new Error(`Invalid experiment: ${validation.error}`);
    }
    
    // Save
    await db.put(STORE_NAME, updated);
    
    console.log('✅ Experiment updated:', experimentId);
    
    // Sync to Drive
    syncExperimentToDrive(updated).catch(err => 
      console.warn('⚠️ Failed to sync updated experiment to Drive:', err)
    );
    
    return { success: true, experiment: updated };
  } catch (error) {
    console.error('❌ Failed to update experiment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an experiment
 */
export async function deleteExperiment(experimentId) {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, experimentId);
    
    console.log('✅ Experiment deleted:', experimentId);
    
    // Delete from Drive
    deleteExperimentFromDrive(experimentId).catch(err => 
      console.warn('⚠️ Failed to delete experiment from Drive:', err)
    );
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete experiment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Download experiment as JSON file
 */
export async function downloadExperiment(experimentId) {
  try {
    const result = await getExperiment(experimentId);
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const experiment = result.experiment;
    const json = exportExperiment(experiment);
    const filename = `${experiment.metadata.title.replace(/[^a-z0-9]/gi, '_')}_${experimentId}.json`;
    
    // Create blob and download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Experiment downloaded:', filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('❌ Failed to download experiment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload/Import experiment from JSON file
 */
export async function uploadExperiment(file, userId = null) {
  try {
    const text = await file.text();
    const result = importExperiment(text);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    const experiment = result.experiment;
    
    // Save to library
    const saveResult = await saveExperiment(experiment, userId);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }
    
    console.log('✅ Experiment imported:', experiment.id);
    
    return { success: true, experiment };
  } catch (error) {
    console.error('❌ Failed to upload experiment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get experiment statistics
 */
export async function getExperimentStats() {
  try {
    const db = await getDB();
    const experiments = await db.getAll(STORE_NAME);
    
    const stats = {
      total: experiments.length,
      byLab: {
        physics: experiments.filter(e => e.metadata.lab === 'physics').length,
        chemistry: experiments.filter(e => e.metadata.lab === 'chemistry').length,
        math: experiments.filter(e => e.metadata.lab === 'math').length,
        code: experiments.filter(e => e.metadata.lab === 'code').length,
        globe: experiments.filter(e => e.metadata.lab === 'globe').length
      },
      withPdfContext: experiments.filter(e => e.metadata.pdfContext).length,
      imported: experiments.filter(e => e.imported).length
    };
    
    return { success: true, stats };
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    return { success: false, error: error.message, stats: null };
  }
}

// ===== GOOGLE DRIVE SYNC =====

/**
 * Sync experiment to Google Drive
 */
async function syncExperimentToDrive(experiment) {
  try {
    const { createFolder, uploadFile, listFilesInFolder } = await import('./googleDriveService');
    
    // Get or create Experiments folder
    const folderId = await getExperimentsFolderId();
    if (!folderId) {
      console.warn('⚠️ Drive not available, skipping sync');
      return;
    }
    
    // Check if experiment already exists
    const files = await listFilesInFolder(folderId);
    const existingFile = files.find(f => f.name === `${experiment.id}.json`);
    
    const json = exportExperiment(experiment);
    const blob = new Blob([json], { type: 'application/json' });
    const file = new File([blob], `${experiment.id}.json`, { type: 'application/json' });
    
    if (existingFile) {
      // Update existing file
      await uploadFile(file, folderId, existingFile.id);
      console.log('✅ Experiment updated on Drive:', experiment.id);
    } else {
      // Upload new file
      await uploadFile(file, folderId);
      console.log('✅ Experiment synced to Drive:', experiment.id);
    }
  } catch (error) {
    console.error('❌ Drive sync failed:', error);
    throw error;
  }
}

/**
 * Delete experiment from Google Drive
 */
async function deleteExperimentFromDrive(experimentId) {
  try {
    const { deleteFile, listFilesInFolder } = await import('./googleDriveService');
    
    const folderId = await getExperimentsFolderId();
    if (!folderId) return;
    
    const files = await listFilesInFolder(folderId);
    const file = files.find(f => f.name === `${experimentId}.json`);
    
    if (file) {
      await deleteFile(file.id);
      console.log('✅ Experiment deleted from Drive:', experimentId);
    }
  } catch (error) {
    console.error('❌ Drive delete failed:', error);
    throw error;
  }
}

/**
 * Get or create Experiments folder in Google Drive
 */
async function getExperimentsFolderId() {
  try {
    const { createFolder, listFiles } = await import('./googleDriveService');
    
    // Check if folder exists
    const files = await listFiles(`name='${EXPERIMENTS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    
    if (files.length > 0) {
      return files[0].id;
    }
    
    // Create folder
    const folderId = await createFolder(EXPERIMENTS_FOLDER_NAME);
    console.log('✅ Created Experiments folder on Drive');
    
    return folderId;
  } catch (error) {
    console.error('❌ Failed to get/create Experiments folder:', error);
    return null;
  }
}

/**
 * Load all experiments from Google Drive
 */
export async function loadExperimentsFromDrive() {
  try {
    const { downloadFile, listFilesInFolder } = await import('./googleDriveService');
    
    const folderId = await getExperimentsFolderId();
    if (!folderId) {
      console.warn('⚠️ Drive not available');
      return { success: false, error: 'Drive not available' };
    }
    
    const files = await listFilesInFolder(folderId);
    const jsonFiles = files.filter(f => f.name.endsWith('.json'));
    
    console.log(`📥 Loading ${jsonFiles.length} experiments from Drive...`);
    
    const db = await getDB();
    let loaded = 0;
    let errors = 0;
    
    for (const file of jsonFiles) {
      try {
        const blob = await downloadFile(file.id);
        const text = await blob.text();
        const result = importExperiment(text);
        
        if (result.success) {
          // Use original ID from Drive file
          const experimentId = file.name.replace('.json', '');
          result.experiment.id = experimentId;
          
          await db.put(STORE_NAME, result.experiment);
          loaded++;
        } else {
          console.error(`❌ Invalid experiment file: ${file.name}`, result.error);
          errors++;
        }
      } catch (error) {
        console.error(`❌ Failed to load ${file.name}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Loaded ${loaded} experiments from Drive (${errors} errors)`);
    
    return { success: true, loaded, errors };
  } catch (error) {
    console.error('❌ Failed to load experiments from Drive:', error);
    return { success: false, error: error.message };
  }
}

export default {
  saveExperiment,
  getAllExperiments,
  getExperimentsByLab,
  getExperiment,
  updateExperiment,
  deleteExperiment,
  downloadExperiment,
  uploadExperiment,
  getExperimentStats,
  loadExperimentsFromDrive
};

