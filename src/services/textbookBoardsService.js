/**
 * Multi-Board Textbook Service
 *
 * Supports multiple education boards:
 * - CBSE/NCERT (National)
 * - Telangana State Board
 * - Can be extended for other state boards
 *
 * Features:
 * - Browse textbooks by board, class, and subject
 * - Access PDFs from official sources
 * - Unified interface across different boards
 *
 * @version 1.0.0
 */

import * as NCERTService from './ncertService';

// Supported education boards
export const BOARDS = {
  NCERT: {
    id: 'ncert',
    name: 'CBSE/NCERT',
    fullName: 'Central Board of Secondary Education / NCERT',
    description: 'National curriculum textbooks (Classes 1-12)',
    website: 'https://ncert.nic.in',
    logo: null
  },
  TELANGANA: {
    id: 'telangana',
    name: 'Telangana State Board',
    fullName: 'State Council of Educational Research and Training, Telangana',
    description: 'Telangana State Board textbooks (Classes 1-12)',
    website: 'https://scert.telangana.gov.in',
    logo: null
  }
};

/**
 * Telangana State Board Textbook URLs
 * Format: https://scert.telangana.gov.in/ebooks/[class]/[subject]_[language].pdf
 *
 * Note: These URLs are examples and need to be verified with actual Telangana board website
 */
const TELANGANA_CATALOG = {
  6: {
    mathematics: [
      {
        code: 'ts6math_en',
        title: 'Mathematics',
        language: 'english',
        chapters: 10,
        url: 'https://scert.telangana.gov.in/ebooks/class6/mathematics_english.pdf'
      },
      {
        code: 'ts6math_te',
        title: 'Mathematics (Telugu)',
        language: 'telugu',
        chapters: 10,
        url: 'https://scert.telangana.gov.in/ebooks/class6/mathematics_telugu.pdf'
      }
    ],
    science: [
      {
        code: 'ts6sci_en',
        title: 'Science',
        language: 'english',
        chapters: 12,
        url: 'https://scert.telangana.gov.in/ebooks/class6/science_english.pdf'
      }
    ],
    socialScience: [
      {
        code: 'ts6social_en',
        title: 'Social Studies',
        language: 'english',
        chapters: 14,
        url: 'https://scert.telangana.gov.in/ebooks/class6/social_english.pdf'
      }
    ]
  },
  9: {
    mathematics: [
      {
        code: 'ts9math_en',
        title: 'Mathematics',
        language: 'english',
        chapters: 13,
        url: 'https://scert.telangana.gov.in/ebooks/class9/mathematics_english.pdf'
      }
    ],
    physics: [
      {
        code: 'ts9phy_en',
        title: 'Physical Science',
        language: 'english',
        chapters: 10,
        url: 'https://scert.telangana.gov.in/ebooks/class9/physics_english.pdf'
      }
    ],
    biology: [
      {
        code: 'ts9bio_en',
        title: 'Biological Science',
        language: 'english',
        chapters: 8,
        url: 'https://scert.telangana.gov.in/ebooks/class9/biology_english.pdf'
      }
    ],
    socialScience: [
      {
        code: 'ts9social_en',
        title: 'Social Studies',
        language: 'english',
        chapters: 16,
        url: 'https://scert.telangana.gov.in/ebooks/class9/social_english.pdf'
      }
    ]
  },
  10: {
    mathematics: [
      {
        code: 'ts10math_en',
        title: 'Mathematics',
        language: 'english',
        chapters: 14,
        url: 'https://scert.telangana.gov.in/pdf/publication/ebooks/10 mathematics em 2024-25.pdf'
      },
      {
        code: 'ts10math_te',
        title: 'Mathematics (Telugu)',
        language: 'telugu',
        chapters: 14,
        url: 'https://scert.telangana.gov.in/pdf/publication/ebooks2019/10 maths tm - 20.pdf'
      }
    ],
    science: [
      {
        code: 'ts10phy_en',
        title: 'Physical Science',
        language: 'english',
        chapters: 12,
        url: 'https://scert.telangana.gov.in/pdf/publication/ebooks2019/x%20physics%20em.pdf'
      },
      {
        code: 'ts10bio_en',
        title: 'Biological Science',
        language: 'english',
        chapters: 9,
        url: 'https://scert.telangana.gov.in/pdf/publication/ebooks2019/x%20biology%20em.pdf'
      }
    ],
    socialScience: [
      {
        code: 'ts10social_en',
        title: 'Social Studies',
        language: 'english',
        chapters: 18,
        url: 'https://scert.telangana.gov.in/pdf/publication/ebooks2019/x%20social%20em.pdf'
      }
    ]
  }
};

/**
 * Get catalog for a specific board
 * @param {string} boardId - Board identifier ('ncert' or 'telangana')
 * @returns {Object} Board's textbook catalog
 */
export function getBoardCatalog(boardId) {
  switch (boardId) {
    case 'ncert':
      return NCERTService.NCERT_CATALOG;
    case 'telangana':
      return TELANGANA_CATALOG;
    default:
      return {};
  }
}

/**
 * Get all textbooks for a board and class
 * @param {string} boardId - Board identifier
 * @param {number} classNumber - Class number (1-12)
 * @returns {Array} Array of textbook objects
 */
export function getTextbooks(boardId, classNumber) {
  if (boardId === 'ncert') {
    return NCERTService.getTextbooksByClass(classNumber);
  }

  const catalog = getBoardCatalog(boardId);
  const classBooks = catalog[classNumber];
  if (!classBooks) return [];

  const allBooks = [];
  Object.keys(classBooks).forEach(subject => {
    classBooks[subject].forEach(book => {
      allBooks.push({
        ...book,
        board: boardId,
        class: classNumber,
        subject: subject
      });
    });
  });

  return allBooks;
}

/**
 * Get textbooks by board, class, and subject
 * @param {string} boardId - Board identifier
 * @param {number} classNumber - Class number
 * @param {string} subject - Subject name
 * @returns {Array} Array of textbook objects
 */
export function getTextbooksBySubject(boardId, classNumber, subject) {
  if (boardId === 'ncert') {
    return NCERTService.getTextbooksBySubject(classNumber, subject);
  }

  const catalog = getBoardCatalog(boardId);
  const classBooks = catalog[classNumber];
  if (!classBooks || !classBooks[subject]) return [];

  return classBooks[subject].map(book => ({
    ...book,
    board: boardId,
    class: classNumber,
    subject: subject
  }));
}

/**
 * Get PDF URL for a textbook
 * @param {string} boardId - Board identifier
 * @param {Object} book - Book object with code
 * @param {number} chapter - Chapter number (optional for some boards)
 * @returns {string} PDF URL
 */
export function getTextbookPdfUrl(boardId, book, chapter = null) {
  if (boardId === 'ncert') {
    if (chapter) {
      return NCERTService.getChapterPdfUrl(book.code, chapter);
    }
    // Return prelims PDF which is viewable in browser (not ZIP file)
    return NCERTService.getPrelimsPdfUrl(book.code);
  }

  if (boardId === 'telangana') {
    // Telangana books typically have single PDF URLs
    return book.url || null;
  }

  return null;
}

/**
 * Get all available classes for a board
 * @param {string} boardId - Board identifier
 * @returns {Array} Array of class numbers
 */
export function getAvailableClasses(boardId) {
  const catalog = getBoardCatalog(boardId);
  return Object.keys(catalog).map(Number).sort((a, b) => a - b);
}

/**
 * Get all subjects for a board and class
 * @param {string} boardId - Board identifier
 * @param {number} classNumber - Class number
 * @returns {Array} Array of subject names
 */
export function getSubjectsForClass(boardId, classNumber) {
  if (boardId === 'ncert') {
    return NCERTService.getSubjectsForClass(classNumber);
  }

  const catalog = getBoardCatalog(boardId);
  const classBooks = catalog[classNumber];
  if (!classBooks) return [];
  return Object.keys(classBooks);
}

/**
 * Search textbooks across all boards
 * @param {string} query - Search query
 * @param {string} boardId - Optional board filter
 * @returns {Array} Matching textbooks
 */
export function searchTextbooks(query, boardId = null) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  const boardsToSearch = boardId
    ? [boardId]
    : Object.values(BOARDS).map(b => b.id);

  boardsToSearch.forEach(bid => {
    const catalog = getBoardCatalog(bid);

    Object.keys(catalog).forEach(classNum => {
      const classBooks = catalog[classNum];
      Object.keys(classBooks).forEach(subject => {
        classBooks[subject].forEach(book => {
          if (
            book.title.toLowerCase().includes(lowerQuery) ||
            subject.toLowerCase().includes(lowerQuery) ||
            book.language.toLowerCase().includes(lowerQuery)
          ) {
            results.push({
              ...book,
              board: bid,
              boardName: BOARDS[bid.toUpperCase()]?.name || bid,
              class: parseInt(classNum),
              subject: subject
            });
          }
        });
      });
    });
  });

  return results;
}

/**
 * Download PDF from any board
 * @param {string} url - PDF URL
 * @returns {Promise<Blob>} PDF blob
 */
export async function downloadTextbookPdf(url) {
  try {
    // Use CORS proxy if needed for cross-origin requests
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading textbook PDF:', error);
    throw error;
  }
}

/**
 * Get board information
 * @param {string} boardId - Board identifier
 * @returns {Object} Board details
 */
export function getBoardInfo(boardId) {
  const key = boardId.toUpperCase();
  return BOARDS[key] || null;
}

/**
 * Get all available boards
 * @returns {Array} Array of board objects
 */
export function getAllBoards() {
  return Object.values(BOARDS);
}

export default {
  BOARDS,
  getBoardCatalog,
  getTextbooks,
  getTextbooksBySubject,
  getTextbookPdfUrl,
  getAvailableClasses,
  getSubjectsForClass,
  searchTextbooks,
  downloadTextbookPdf,
  getBoardInfo,
  getAllBoards
};
