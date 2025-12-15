/**
 * AI Cache Service
 *
 * Intelligent caching of AI responses in Google Drive:
 * - Cache queries and responses per PDF page
 * - Avoid redundant API calls
 * - Build knowledge graph per PDF
 * - Similarity matching for related queries
 *
 * @version 1.0.0
 */

import {
  hasDrivePermissions,
  initializeFolderStructure,
  uploadFile,
  FOLDER_STRUCTURE
} from './googleDriveService';
import { gapi } from 'gapi-script';

/**
 * Generate cache file name for a PDF page
 * @param {string} pdfId - PDF identifier
 * @param {number} page - Page number
 * @returns {string} Cache file name
 */
function getCacheFileName(pdfId, page) {
  return `${pdfId}_page_${page}.json`;
}

/**
 * Generate cache file name for page index
 * @param {string} pdfId - PDF identifier
 * @returns {string} Index file name
 */
function getIndexFileName(pdfId) {
  return `${pdfId}_index.json`;
}

/**
 * Check if cache exists for a page
 * @param {string} pdfId - PDF identifier
 * @param {number} page - Page number
 * @returns {Promise<Object|null>} Cache data or null
 */
export async function getPageCache(pdfId, page) {
  if (!hasDrivePermissions()) {
    console.warn('⚠️ Drive permissions not granted - cache unavailable');
    return null;
  }

  try {
    const folders = await initializeFolderStructure();
    const fileName = getCacheFileName(pdfId, page);

    // Search for cache file
    const response = await gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folders.aiResponses}' in parents and trashed=false`,
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

      const cacheData = JSON.parse(content.body);
      console.log(`✅ Cache hit: ${pdfId} page ${page}`);
      return cacheData;
    }

    console.log(`📭 Cache miss: ${pdfId} page ${page}`);
    return null;
  } catch (error) {
    console.error('❌ Error getting page cache:', error);
    return null;
  }
}

/**
 * Calculate similarity between two strings (simple cosine similarity)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Find similar query in cache
 * @param {Array} queries - Cached queries
 * @param {string} newQuery - New query
 * @param {string} context - Selected text context
 * @param {number} threshold - Similarity threshold (default 0.7)
 * @returns {Object|null} Similar query or null
 */
export function findSimilarQuery(queries, newQuery, context, threshold = 0.7) {
  if (!queries || queries.length === 0) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const cached of queries) {
    // Check query similarity
    const querySimilarity = calculateSimilarity(cached.question, newQuery);

    // Check context similarity (if provided)
    let contextSimilarity = 1;
    if (context && cached.context) {
      contextSimilarity = calculateSimilarity(cached.context, context);
    }

    // Combined score (weighted: query 70%, context 30%)
    const score = querySimilarity * 0.7 + contextSimilarity * 0.3;

    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = cached;
    }
  }

  if (bestMatch) {
    console.log(`🎯 Found similar query (${(bestScore * 100).toFixed(1)}% match)`);
  }

  return bestMatch;
}

/**
 * Save AI response to cache
 * @param {string} pdfId - PDF identifier
 * @param {string} pdfName - PDF name
 * @param {number} page - Page number
 * @param {string} pageContent - Extracted page text
 * @param {Object} queryData - Query and response data
 */
export async function saveToCache(pdfId, pdfName, page, pageContent, queryData) {
  if (!hasDrivePermissions()) {
    console.warn('⚠️ Drive permissions not granted - cannot save cache');
    return;
  }

  try {
    const folders = await initializeFolderStructure();
    const fileName = getCacheFileName(pdfId, page);

    // Get existing cache or create new
    let cacheData = await getPageCache(pdfId, page);

    if (!cacheData) {
      // Create new cache entry
      cacheData = {
        pdfId,
        pdfName,
        page,
        pageContent,
        embeddings: null, // TODO: Generate embeddings
        queries: [],
        summary: null,
        keyTopics: [],
        lastAccessed: new Date().toISOString()
      };
    }

    // Add new query
    cacheData.queries.push({
      queryId: `q${Date.now()}`,
      question: queryData.question,
      mode: queryData.mode,
      context: queryData.context,
      response: queryData.response,
      timestamp: new Date().toISOString(),
      useful: true, // Assume useful by default
      tokensUsed: estimateTokens(queryData.question + queryData.response)
    });

    // Update last accessed
    cacheData.lastAccessed = new Date().toISOString();

    // Save to Drive
    const cacheBlob = new Blob([JSON.stringify(cacheData, null, 2)], { type: 'application/json' });

    // Check if file exists
    const response = await gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folders.aiResponses}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.result.files && response.result.files.length > 0) {
      // Update existing file
      const fileId = response.result.files[0].id;

      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: new Headers({
          'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
        }),
        body: cacheBlob
      });

      console.log(`✅ Updated cache: ${pdfId} page ${page}`);
    } else {
      // Create new file
      await uploadFile(cacheBlob, folders.aiResponses, fileName, 'application/json');
      console.log(`✅ Created cache: ${pdfId} page ${page}`);
    }
  } catch (error) {
    console.error('❌ Error saving to cache:', error);
  }
}

/**
 * Estimate tokens used (rough approximation: 1 token ≈ 4 characters)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated tokens
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Save page index (topics, key terms, summary)
 * @param {string} pdfId - PDF identifier
 * @param {string} pdfName - PDF name
 * @param {number} totalPages - Total pages in PDF
 * @param {Array} indexedPages - Array of page indices
 */
export async function savePageIndex(pdfId, pdfName, totalPages, indexedPages) {
  if (!hasDrivePermissions()) {
    console.warn('⚠️ Drive permissions not granted - cannot save index');
    return;
  }

  try {
    const folders = await initializeFolderStructure();
    const fileName = getIndexFileName(pdfId);

    const indexData = {
      pdfId,
      pdfName,
      totalPages,
      indexedPages,
      lastUpdated: new Date().toISOString()
    };

    const indexBlob = new Blob([JSON.stringify(indexData, null, 2)], { type: 'application/json' });

    // Check if file exists
    const response = await gapi.client.drive.files.list({
      q: `name='${fileName}' and '${folders.pageIndex}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.result.files && response.result.files.length > 0) {
      // Update existing file
      const fileId = response.result.files[0].id;

      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: new Headers({
          'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
        }),
        body: indexBlob
      });

      console.log(`✅ Updated page index: ${pdfId}`);
    } else {
      // Create new file
      await uploadFile(indexBlob, folders.pageIndex, fileName, 'application/json');
      console.log(`✅ Created page index: ${pdfId}`);
    }
  } catch (error) {
    console.error('❌ Error saving page index:', error);
  }
}

/**
 * Get cache statistics for a PDF
 * @param {string} pdfId - PDF identifier
 * @returns {Promise<Object>} Cache stats
 */
export async function getCacheStats(pdfId) {
  if (!hasDrivePermissions()) {
    return { indexed: false, cachedPages: 0, totalQueries: 0 };
  }

  try {
    const folders = await initializeFolderStructure();

    // Search for all cache files for this PDF
    const response = await gapi.client.drive.files.list({
      q: `name contains '${pdfId}_page_' and '${folders.aiResponses}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    const cachedPages = response.result.files ? response.result.files.length : 0;

    // Count total queries (would need to download each file - expensive)
    // For now, just return page count
    return {
      indexed: cachedPages > 0,
      cachedPages,
      totalQueries: cachedPages * 5 // Rough estimate
    };
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    return { indexed: false, cachedPages: 0, totalQueries: 0 };
  }
}

export default {
  getPageCache,
  findSimilarQuery,
  saveToCache,
  savePageIndex,
  getCacheStats
};
