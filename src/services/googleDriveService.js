/**
 * Google Drive Integration Service
 *
 * Manages user's Google Drive storage for Ekamanam:
 * - OAuth authentication with Drive permissions
 * - Folder structure creation and management
 * - PDF upload/download
 * - AI cache storage and retrieval
 * - Sync between Drive and local IndexedDB
 *
 * @version 1.0.0
 */

import { auth } from '../firebase/config';

// Google Drive API Configuration
// Uses Firebase Auth tokens - no separate OAuth needed!
// When user signs in with Google via Firebase, they automatically get Drive access

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file', // Create and manage app-created files
  'https://www.googleapis.com/auth/drive.appdata' // Access app-specific folder
];

// Folder structure
export const FOLDER_STRUCTURE = {
  ROOT: 'Ekamanam',
  PDFS: 'PDFs',
  CACHE: 'Cache',
  AI_RESPONSES: 'AI_Responses',
  PAGE_INDEX: 'Page_Index',
  EMBEDDINGS: 'Embeddings',
  NOTES: 'Notes',
  PROGRESS: 'Progress'
};

// Library index file
const LIBRARY_INDEX_FILE = 'ekamanam_library.json';

// State
let folderIds = null; // Cache folder IDs
let isInitialized = false;
let isSignedIn = false;
let gapi = null; // Will be loaded dynamically

/**
 * Load gapi script dynamically
 * @returns {Promise<void>}
 */
async function loadGapiScript() {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      gapi = window.gapi;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi = window.gapi;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Initialize Google Drive API
 * @returns {Promise<void>}
 */
export async function initializeGoogleDrive() {
  if (isInitialized) {
    console.log('✅ Google Drive already initialized');
    return;
  }

  try {
    console.log('📁 Loading Google API script...');
    await loadGapiScript();

    console.log('📁 Initializing gapi client...');
    await new Promise((resolve, reject) => {
      gapi.load('client:auth2', { callback: resolve, onerror: reject });
    });

    console.log('📁 Initializing Drive client...');
    await gapi.client.init({
      apiKey: process.env.REACT_APP_GOOGLE_API_KEY || 'AIzaSyCCIww51kzyr3eN2oJn24D7SmFptfdK_2o',
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '662515641730-98vgp3s7ueahfevqi0stgq4d97v6iuh9.apps.googleusercontent.com',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
    });

    // Check if user is already signed in via Firebase
    const user = auth.currentUser;
    if (user) {
      // Get Google OAuth access token from localStorage (stored during sign-in)
      const accessToken = localStorage.getItem('google_access_token');
      if (accessToken) {
        gapi.client.setToken({ access_token: accessToken });
        isSignedIn = true;
        console.log('✅ Using Google OAuth access token for Drive access');
      } else {
        console.warn('⚠️ No Google OAuth access token found. Drive permissions may not be granted.');
        isSignedIn = false;
      }
    }

    isInitialized = true;
    console.log('✅ Google Drive initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Google Drive:', error);
    throw error;
  }
}

/**
 * Get Firebase Auth access token
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not signed in');
  }

  // Get fresh token from Firebase
  const token = await user.getIdToken(true);
  return token;
}

/**
 * Get Google OAuth token for Drive API
 * Firebase Auth tokens can be exchanged for Google OAuth tokens
 * @returns {Promise<string>} OAuth access token
 */
async function getGoogleAccessToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not signed in with Google');
  }

  // Get the provider data
  const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
  if (!googleProvider) {
    throw new Error('User not signed in with Google provider');
  }

  // For Firebase Auth with Google, we need to request additional scopes
  // This is done during sign-in by updating the AuthButton component
  // The access token is available in the credential
  const token = await user.getIdToken();
  return token;
}

/**
 * Check if user has granted Drive permissions
 */
export function hasDrivePermissions() {
  if (!isInitialized) return false;
  return isSignedIn;
}

/**
 * Request Drive permissions from user
 */
export async function requestDrivePermissions() {
  if (!isInitialized) {
    await initializeGoogleDrive();
  }

  try {
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signIn({
      prompt: 'consent' // Force consent screen to show permissions
    });

    console.log('✅ Drive permissions granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting Drive permissions:', error);
    if (error.error === 'popup_closed_by_user') {
      throw new Error('Please allow popup to grant Google Drive access');
    }
    throw error;
  }
}

/**
 * Revoke Drive permissions
 */
export async function revokeDrivePermissions() {
  if (!isInitialized) return;

  try {
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();
    isSignedIn = false;
    folderIds = null;
    console.log('✅ Drive permissions revoked');
  } catch (error) {
    console.error('❌ Error revoking Drive permissions:', error);
    throw error;
  }
}

/**
 * Create folder in Google Drive
 * @param {string} name - Folder name
 * @param {string} parentId - Parent folder ID (optional)
 * @returns {Promise<string>} Folder ID
 */
async function createFolder(name, parentId = null) {
  const metadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  try {
    const response = await gapi.client.drive.files.create({
      resource: metadata,
      fields: 'id, name'
    });

    console.log(`📁 Created folder: ${name} (${response.result.id})`);
    return response.result.id;
  } catch (error) {
    console.error(`❌ Error creating folder ${name}:`, error);
    throw error;
  }
}

/**
 * Find folder by name
 * @param {string} name - Folder name
 * @param {string} parentId - Parent folder ID (optional)
 * @returns {Promise<string|null>} Folder ID or null
 */
async function findFolder(name, parentId = null) {
  try {
    let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const response = await gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error finding folder ${name}:`, error);
    throw error;
  }
}

/**
 * Initialize Ekamanam folder structure in user's Drive
 * @returns {Promise<Object>} Folder IDs
 */
export async function initializeFolderStructure() {
  if (!hasDrivePermissions()) {
    throw new Error('Drive permissions not granted');
  }

  // Check if already cached
  if (folderIds) {
    return folderIds;
  }

  try {
    console.log('📁 Initializing Ekamanam folder structure...');

    // Create or find root folder
    let rootId = await findFolder(FOLDER_STRUCTURE.ROOT);
    if (!rootId) {
      rootId = await createFolder(FOLDER_STRUCTURE.ROOT);
    }

    // Create or find subfolders
    const pdfsId = await findFolder(FOLDER_STRUCTURE.PDFS, rootId) ||
                   await createFolder(FOLDER_STRUCTURE.PDFS, rootId);

    const cacheId = await findFolder(FOLDER_STRUCTURE.CACHE, rootId) ||
                    await createFolder(FOLDER_STRUCTURE.CACHE, rootId);

    const aiResponsesId = await findFolder(FOLDER_STRUCTURE.AI_RESPONSES, cacheId) ||
                          await createFolder(FOLDER_STRUCTURE.AI_RESPONSES, cacheId);

    const pageIndexId = await findFolder(FOLDER_STRUCTURE.PAGE_INDEX, cacheId) ||
                        await createFolder(FOLDER_STRUCTURE.PAGE_INDEX, cacheId);

    const embeddingsId = await findFolder(FOLDER_STRUCTURE.EMBEDDINGS, cacheId) ||
                         await createFolder(FOLDER_STRUCTURE.EMBEDDINGS, cacheId);

    const notesId = await findFolder(FOLDER_STRUCTURE.NOTES, rootId) ||
                    await createFolder(FOLDER_STRUCTURE.NOTES, rootId);

    const progressId = await findFolder(FOLDER_STRUCTURE.PROGRESS, rootId) ||
                       await createFolder(FOLDER_STRUCTURE.PROGRESS, rootId);

    folderIds = {
      root: rootId,
      pdfs: pdfsId,
      cache: cacheId,
      aiResponses: aiResponsesId,
      pageIndex: pageIndexId,
      embeddings: embeddingsId,
      notes: notesId,
      progress: progressId
    };

    console.log('✅ Folder structure initialized:', folderIds);
    return folderIds;
  } catch (error) {
    console.error('❌ Error initializing folder structure:', error);
    throw error;
  }
}

/**
 * Upload file to Google Drive
 * @param {File|Blob} file - File to upload
 * @param {string} folderId - Parent folder ID
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 * @returns {Promise<Object>} File metadata
 */
export async function uploadFile(file, folderId, fileName, mimeType = 'application/pdf') {
  if (!hasDrivePermissions()) {
    throw new Error('Drive permissions not granted');
  }

  try {
    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,webContentLink', {
      method: 'POST',
      headers: new Headers({
        'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
      }),
      body: form
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Uploaded ${fileName} to Drive (${result.id})`);
    return result;
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
}

/**
 * Download file from Google Drive
 * @param {string} fileId - File ID
 * @returns {Promise<Blob>} File content
 */
export async function downloadFile(fileId) {
  if (!hasDrivePermissions()) {
    throw new Error('Drive permissions not granted');
  }

  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });

    // Convert response to blob
    const blob = new Blob([response.body], { type: 'application/pdf' });
    console.log(`✅ Downloaded file ${fileId}`);
    return blob;
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    throw error;
  }
}

/**
 * Get or create library index file
 * @returns {Promise<Object>} Library index data
 */
export async function getLibraryIndex() {
  if (!hasDrivePermissions()) {
    throw new Error('Drive permissions not granted');
  }

  const folders = await initializeFolderStructure();

  try {
    // Find index file
    const response = await gapi.client.drive.files.list({
      q: `name='${LIBRARY_INDEX_FILE}' and '${folders.root}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.result.files && response.result.files.length > 0) {
      // File exists - download it
      const fileId = response.result.files[0].id;
      const content = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return {
        fileId: fileId,
        data: JSON.parse(content.body)
      };
    } else {
      // Create new index file
      const initialData = {
        version: '1.0',
        lastSync: new Date().toISOString(),
        userId: gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail(),
        pdfs: []
      };

      const metadata = {
        name: LIBRARY_INDEX_FILE,
        mimeType: 'application/json',
        parents: [folders.root]
      };

      const file = new Blob([JSON.stringify(initialData, null, 2)], { type: 'application/json' });
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: new Headers({
          'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
        }),
        body: form
      });

      const result = await uploadResponse.json();

      return {
        fileId: result.id,
        data: initialData
      };
    }
  } catch (error) {
    console.error('❌ Error getting library index:', error);
    throw error;
  }
}

/**
 * Update library index file
 * @param {string} fileId - Index file ID
 * @param {Object} data - New data
 */
export async function updateLibraryIndex(fileId, data) {
  if (!hasDrivePermissions()) {
    throw new Error('Drive permissions not granted');
  }

  try {
    data.lastSync = new Date().toISOString();

    const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const form = new FormData();
    form.append('file', file);

    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: new Headers({
        'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
      }),
      body: file
    });

    console.log('✅ Library index updated');
  } catch (error) {
    console.error('❌ Error updating library index:', error);
    throw error;
  }
}

/**
 * Delete file from Google Drive
 * @param {string} fileId - File ID
 */
export async function deleteFile(fileId) {
  if (!hasDrivePermissions()) {
    throw new Error('Drive permissions not granted');
  }

  try {
    await gapi.client.drive.files.delete({
      fileId: fileId
    });
    console.log(`✅ Deleted file ${fileId}`);
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    throw error;
  }
}

export default {
  initializeGoogleDrive,
  hasDrivePermissions,
  requestDrivePermissions,
  revokeDrivePermissions,
  initializeFolderStructure,
  uploadFile,
  downloadFile,
  getLibraryIndex,
  updateLibraryIndex,
  deleteFile,
  FOLDER_STRUCTURE
};
