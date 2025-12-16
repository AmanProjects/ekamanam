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

// OAuth Client ID - must match the one in AuthButton.js
// v7.2.14: Use environment variable for OAuth Client ID
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '662515641730-ke7iqkpepqlpehgvt8k4nv5qhv573c56.apps.googleusercontent.com';

// Discovery doc for Drive API
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

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
      gapi.load('client', { callback: resolve, onerror: reject });
    });

    // Get OAuth access token from localStorage (stored during Firebase sign-in)
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
      console.warn('⚠️ No Google OAuth access token found. User needs to sign in first.');
      return;
    }

    console.log('📁 Initializing gapi client with Drive API...');
    // Initialize the client with discovery doc - this properly configures the project
    await gapi.client.init({
      discoveryDocs: [DISCOVERY_DOC],
    });

    console.log('📁 Setting access token...');
    gapi.client.setToken({ access_token: accessToken });

    isSignedIn = true;
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
 * Request a fresh OAuth token via Google Identity Services
 * v7.2.16: Added to handle expired/invalid tokens
 */
async function requestFreshToken() {
  return new Promise((resolve, reject) => {
    // Load GIS library if needed
    if (!window.google?.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => initTokenClient();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    } else {
      initTokenClient();
    }

    function initTokenClient() {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '662515641730-ke7iqkpepqlpehgvt8k4nv5qhv573c56.apps.googleusercontent.com';
      
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            localStorage.setItem('google_access_token', tokenResponse.access_token);
            console.log('✅ Fresh OAuth token obtained via GIS');
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error(tokenResponse.error || 'Failed to get access token'));
          }
        },
        error_callback: (error) => {
          console.error('❌ GIS error:', error);
          reject(new Error(error.message || 'OAuth error'));
        }
      });

      // Request the token
      client.requestAccessToken({ prompt: '' }); // Empty prompt to use existing consent if available
    }
  });
}

/**
 * Request Drive permissions from user
 * v7.2.17: Always request fresh token when existing one fails
 */
export async function requestDrivePermissions() {
  try {
    // Always request a fresh token to avoid 401 errors
    // This ensures we have a valid token with Drive scopes
    console.log('📡 Requesting fresh OAuth token for Drive access...');
    
    try {
      await requestFreshToken();
    } catch (tokenError) {
      console.error('❌ Failed to get fresh token:', tokenError);
      throw new Error('Please sign in again to grant Drive access.');
    }

    // Reset initialization state to force re-init with new token
    isInitialized = false;
    isSignedIn = false;

    // Initialize Drive with the fresh token
    await initializeGoogleDrive();
    
    // Test if the token actually works
    const testResult = await testDriveConnection();
    if (testResult.apiCallResult !== 'SUCCESS') {
      console.error('❌ Token test failed even with fresh token:', testResult);
      throw new Error('Drive access denied. Please check your Google Cloud Console settings.');
    }
    
    console.log('✅ Drive permissions confirmed and initialized');
    return true;
  } catch (error) {
    console.error('❌ Error confirming Drive permissions:', error);
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
    // Parse detailed error information
    let errorMessage = `Error finding folder ${name}`;
    if (error.result && error.result.error) {
      const apiError = error.result.error;
      errorMessage = `${apiError.message} (Code: ${apiError.code})`;
      
      // Check for common issues
      if (apiError.code === 403) {
        if (apiError.message.includes('not been used') || apiError.message.includes('disabled')) {
          console.error('🔴 GOOGLE DRIVE API NOT ENABLED!');
          console.error('👉 Please enable it at: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=662515641730');
        } else if (apiError.message.includes('insufficientPermissions')) {
          console.error('🔴 INSUFFICIENT PERMISSIONS!');
          console.error('👉 The OAuth token does not have the required Drive scopes.');
          console.error('👉 Please sign out and sign back in to grant permissions.');
        }
      }
    }
    console.error(`❌ ${errorMessage}`, error);
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
    console.log(`📥 Downloading file ${fileId} from Google Drive...`);
    
    // Use fetch with access token for binary file download
    // gapi.client doesn't handle binary data well
    const accessToken = gapi.client.getToken().access_token;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log(`✅ Downloaded file ${fileId}: ${blob.size} bytes`);
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
      // Get user email from Firebase Auth (not gapi.auth2 which we don't use)
      const userEmail = auth.currentUser?.email || 'unknown';
      const initialData = {
        version: '1.0',
        lastSync: new Date().toISOString(),
        userId: userEmail,
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

/**
 * Test Google Drive API connection
 * This function helps diagnose 403 errors
 * @returns {Promise<Object>} Diagnostic information
 */
export async function testDriveConnection() {
  console.log('🔍 Testing Google Drive API connection...');
  
  const diagnostics = {
    gapiLoaded: !!gapi,
    driveApiLoaded: !!(gapi && gapi.client && gapi.client.drive),
    hasAccessToken: !!localStorage.getItem('google_access_token'),
    tokenPreview: localStorage.getItem('google_access_token')?.substring(0, 20) + '...',
    apiCallResult: null,
    error: null,
    errorDetails: null
  };

  if (!diagnostics.gapiLoaded) {
    diagnostics.error = 'GAPI not loaded';
    return diagnostics;
  }

  if (!diagnostics.hasAccessToken) {
    diagnostics.error = 'No access token in localStorage';
    return diagnostics;
  }

  try {
    // Try a simple "about" call - this checks if API is enabled
    console.log('📡 Making test API call to Drive...');
    const response = await gapi.client.drive.about.get({
      fields: 'user,storageQuota'
    });
    
    diagnostics.apiCallResult = 'SUCCESS';
    diagnostics.user = response.result.user;
    console.log('✅ Drive API test successful!', response.result);
  } catch (error) {
    diagnostics.apiCallResult = 'FAILED';
    diagnostics.error = error.status || 'Unknown error';
    
    if (error.result && error.result.error) {
      const apiError = error.result.error;
      diagnostics.errorDetails = {
        code: apiError.code,
        message: apiError.message,
        status: apiError.status
      };
      
      console.error('🔴 Drive API test failed!');
      console.error('Error code:', apiError.code);
      console.error('Error message:', apiError.message);
      
      if (apiError.code === 403) {
        if (apiError.message.includes('API has not been used') || 
            apiError.message.includes('it is disabled') ||
            apiError.message.includes('Access Not Configured')) {
          console.error('');
          console.error('═══════════════════════════════════════════════════════════════');
          console.error('🔴 GOOGLE DRIVE API IS NOT ENABLED FOR YOUR PROJECT!');
          console.error('═══════════════════════════════════════════════════════════════');
          console.error('');
          console.error('To fix this:');
          console.error('1. Go to: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=662515641730');
          console.error('2. Click the blue "ENABLE" button');
          console.error('3. Wait 1-2 minutes for the API to activate');
          console.error('4. Refresh this page and sign in again');
          console.error('');
          console.error('═══════════════════════════════════════════════════════════════');
        }
      }
    } else {
      console.error('❌ Drive API test error:', error);
    }
  }

  return diagnostics;
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
  testDriveConnection,
  FOLDER_STRUCTURE
};
