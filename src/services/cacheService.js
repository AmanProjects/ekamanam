/**
 * Cache Service - Hybrid caching system for AI-generated content
 * Uses IndexedDB for persistent local storage
 */

const DB_NAME = 'EkamamamCache';
const DB_VERSION = 1;
const STORE_NAME = 'pdfCache';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('pdfId', 'pdfId', { unique: false });
        objectStore.createIndex('pageNumber', 'pageNumber', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Generate unique cache key
const getCacheKey = (pdfId, pageNumber, featureType) => {
  return `${pdfId}_page${pageNumber}_${featureType}`;
};

// Save to cache
export const saveCachedData = async (pdfId, pageNumber, featureType, data) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cacheEntry = {
      id: getCacheKey(pdfId, pageNumber, featureType),
      pdfId,
      pageNumber,
      featureType,
      data,
      timestamp: Date.now()
    };

    await new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`✅ Cached: ${featureType} for page ${pageNumber}`);
    return true;
  } catch (error) {
    console.error('Cache save error:', error);
    return false;
  }
};

// Get from cache
export const getCachedData = async (pdfId, pageNumber, featureType) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const cacheKey = getCacheKey(pdfId, pageNumber, featureType);

    return new Promise((resolve, reject) => {
      const request = store.get(cacheKey);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`💾 Cache hit: ${featureType} for page ${pageNumber}`);
          resolve(result.data);
        } else {
          console.log(`❌ Cache miss: ${featureType} for page ${pageNumber}`);
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

// Get all cached data for a page (all features)
export const getAllPageCache = async (pdfId, pageNumber) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('pageNumber');

    return new Promise((resolve, reject) => {
      const request = index.getAll(pageNumber);
      
      request.onsuccess = () => {
        const results = request.result.filter(r => r.pdfId === pdfId);
        const cacheMap = {};
        results.forEach(r => {
          cacheMap[r.featureType] = r.data;
        });
        resolve(cacheMap);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Cache read all error:', error);
    return {};
  }
};

// Get context (prior pages) for exercise solving
export const getPriorPagesContext = async (pdfId, currentPage, maxPages = 5) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('pdfId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(pdfId);
      
      request.onsuccess = () => {
        const allData = request.result;
        
        // Get teacher mode data from prior pages
        const priorContext = allData
          .filter(item => 
            item.pageNumber < currentPage && 
            item.pageNumber >= Math.max(1, currentPage - maxPages) &&
            item.featureType === 'teacherMode'
          )
          .sort((a, b) => a.pageNumber - b.pageNumber)
          .map(item => ({
            pageNumber: item.pageNumber,
            summary: item.data?.summary || '',
            keyPoints: item.data?.keyPoints || []
          }));
        
        resolve(priorContext);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Context retrieval error:', error);
    return [];
  }
};

// Check if page is cached (any feature)
export const isPageCached = async (pdfId, pageNumber, featureType) => {
  const data = await getCachedData(pdfId, pageNumber, featureType);
  return data !== null;
};

// v7.2.26: Clear cache for a specific page and feature type
export const clearPageCache = async (pdfId, pageNumber, featureType) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const cacheKey = getCacheKey(pdfId, pageNumber, featureType);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(cacheKey);
      
      request.onsuccess = () => {
        console.log(`🗑️ Cleared cache: ${featureType} for page ${pageNumber}`);
        resolve(true);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

// Clear cache for a specific PDF
export const clearPDFCache = async (pdfId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('pdfId');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(pdfId));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log(`🗑️ Cleared cache for PDF: ${pdfId}`);
          resolve(true);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

// Get cache statistics
export const getCacheStats = async (pdfId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('pdfId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(pdfId);
      
      request.onsuccess = () => {
        const allData = request.result;
        const stats = {
          totalEntries: allData.length,
          pagesCached: new Set(allData.map(d => d.pageNumber)).size,
          byFeature: {},
          cacheSize: 0
        };

        allData.forEach(item => {
          if (!stats.byFeature[item.featureType]) {
            stats.byFeature[item.featureType] = 0;
          }
          stats.byFeature[item.featureType]++;
          stats.cacheSize += JSON.stringify(item.data).length;
        });

        stats.cacheSizeKB = (stats.cacheSize / 1024).toFixed(2);
        
        resolve(stats);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
};

// Background pre-fetch adjacent pages
export const prefetchAdjacentPages = async (
  pdfId, 
  currentPage, 
  totalPages,
  featureType,
  pageText,
  apiKey,
  generatorFunction
) => {
  const pagesToPrefetch = [];
  
  // Previous page
  if (currentPage > 1) {
    pagesToPrefetch.push(currentPage - 1);
  }
  
  // Next page
  if (currentPage < totalPages) {
    pagesToPrefetch.push(currentPage + 1);
  }

  for (const pageNum of pagesToPrefetch) {
    const isCached = await isPageCached(pdfId, pageNum, featureType);
    
    if (!isCached) {
      console.log(`🔄 Pre-fetching ${featureType} for page ${pageNum}...`);
      
      // Note: This is a placeholder - actual implementation would need page text
      // In practice, you'd need to extract text for adjacent pages first
      // For now, we just log the intent
    }
  }
};

