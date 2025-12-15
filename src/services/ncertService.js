/**
 * NCERT Textbook Service
 *
 * Provides access to NCERT textbooks from https://ncert.nic.in
 *
 * Features:
 * - Browse textbooks by class (1-12) and subject
 * - Access PDFs directly from NCERT repository
 * - Download complete books or individual chapters
 *
 * URL Structure:
 * - Textbook viewer: https://ncert.nic.in/textbook.php?[bookcode]=0-[pages]
 * - Direct PDF: https://ncert.nic.in/textbook/pdf/[bookcode][chapter].pdf
 * - Complete book: https://ncert.nic.in/textbook/pdf/[bookcode]dd.zip
 *
 * @version 1.0.0
 */

// NCERT Base URL
const NCERT_BASE_URL = 'https://ncert.nic.in';
const NCERT_PDF_BASE = `${NCERT_BASE_URL}/textbook/pdf`;

// Class prefixes (a=1, b=2, ..., l=12)
const CLASS_PREFIXES = {
  1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f',
  7: 'g', 8: 'h', 9: 'i', 10: 'j', 11: 'k', 12: 'l'
};

// Language prefixes
const LANGUAGE_PREFIXES = {
  english: 'e',
  hindi: 'h',
  urdu: 'u',
  sanskrit: 's',
  bengali: 'bn',
  assamese: 'as',
  gujarati: 'gj',
  kannada: 'kn',
  malayalam: 'ml',
  marathi: 'mr',
  odia: 'or',
  punjabi: 'pn',
  tamil: 'tm',
  telugu: 'tl'
};

/**
 * NCERT Textbook Catalog
 * Organized by class (1-12), then by subject
 * Each book has: code, title, language, subject, chapters count
 */
export const NCERT_CATALOG = {
  // Class 1
  1: {
    mathematics: [
      { code: 'aejm1', title: 'Joyful Mathematics', language: 'english', chapters: 13 },
      { code: 'ahjm1', title: 'Joyful Mathematics (Hindi)', language: 'hindi', chapters: 13 }
    ],
    english: [
      { code: 'aemr1', title: 'Mridang', language: 'english', chapters: 10 }
    ]
  },

  // Class 6
  6: {
    mathematics: [
      { code: 'femh1', title: 'Ganita Prakash', language: 'english', chapters: 10 },
      { code: 'fhmh1', title: 'Ganita Prakash (Hindi)', language: 'hindi', chapters: 10 }
    ],
    english: [
      { code: 'fecy1', title: 'Curiosity', language: 'english', chapters: 16 }
    ],
    science: [
      { code: 'fesc1', title: 'Curiosity Science Textbook', language: 'english', chapters: 12 }
    ],
    socialScience: [
      { code: 'fecy2', title: 'Exploring Society: India and Beyond', language: 'english', chapters: 14 }
    ]
  },

  // Class 9
  9: {
    english: [
      { code: 'ieen1', title: 'Beehive - English Textbook', language: 'english', chapters: 11 },
      { code: 'ieen2', title: 'Moments - Supplementary Reader', language: 'english', chapters: 10 }
    ],
    hindi: [
      { code: 'ihkh1', title: 'Kshitij Bhag-1', language: 'hindi', chapters: 17 },
      { code: 'ihkt1', title: 'Kritika Bhag-1', language: 'hindi', chapters: 5 }
    ],
    mathematics: [
      { code: 'iemh1', title: 'Mathematics', language: 'english', chapters: 15 },
      { code: 'ihmh1', title: 'Ganit (Hindi)', language: 'hindi', chapters: 15 }
    ],
    science: [
      { code: 'iesc1', title: 'Science', language: 'english', chapters: 16 }
    ],
    socialScience: [
      { code: 'iess1', title: 'India and the Contemporary World-I', language: 'english', chapters: 8 },
      { code: 'iess2', title: 'Contemporary India-I', language: 'english', chapters: 6 },
      { code: 'iess3', title: 'Democratic Politics-I', language: 'english', chapters: 6 },
      { code: 'iess4', title: 'Economics', language: 'english', chapters: 4 }
    ]
  },

  // Class 10
  10: {
    english: [
      { code: 'jeen1', title: 'First Flight', language: 'english', chapters: 12 },
      { code: 'jeen2', title: 'Footprints without Feet', language: 'english', chapters: 10 }
    ],
    hindi: [
      { code: 'jhkh2', title: 'Kshitij Bhag-2', language: 'hindi', chapters: 17 },
      { code: 'jhkt2', title: 'Kritika Bhag-2', language: 'hindi', chapters: 5 }
    ],
    mathematics: [
      { code: 'jemh1', title: 'Mathematics', language: 'english', chapters: 15 },
      { code: 'jhmh1', title: 'Ganit (Hindi)', language: 'hindi', chapters: 15 }
    ],
    science: [
      { code: 'jesc1', title: 'Science', language: 'english', chapters: 16 }
    ],
    socialScience: [
      { code: 'jess1', title: 'India and the Contemporary World-II', language: 'english', chapters: 8 },
      { code: 'jess2', title: 'Contemporary India-II', language: 'english', chapters: 7 },
      { code: 'jess3', title: 'Democratic Politics-II', language: 'english', chapters: 8 },
      { code: 'jess4', title: 'Understanding Economic Development', language: 'english', chapters: 5 }
    ]
  },

  // Class 11
  11: {
    physics: [
      { code: 'keph1', title: 'Physics Part-I', language: 'english', chapters: 8 },
      { code: 'keph2', title: 'Physics Part-II', language: 'english', chapters: 7 }
    ],
    chemistry: [
      { code: 'kech1', title: 'Chemistry Part-I', language: 'english', chapters: 7 },
      { code: 'kech2', title: 'Chemistry Part-II', language: 'english', chapters: 7 }
    ],
    mathematics: [
      { code: 'kemh1', title: 'Mathematics', language: 'english', chapters: 16 }
    ],
    biology: [
      { code: 'kebo1', title: 'Biology', language: 'english', chapters: 22 }
    ],
    accountancy: [
      { code: 'keac1', title: 'Accountancy Part-I', language: 'english', chapters: 8 },
      { code: 'keac2', title: 'Accountancy Part-II', language: 'english', chapters: 6 }
    ],
    businessStudies: [
      { code: 'kebs1', title: 'Business Studies', language: 'english', chapters: 11 }
    ],
    economics: [
      { code: 'keec1', title: 'Indian Economic Development', language: 'english', chapters: 10 },
      { code: 'keec2', title: 'Statistics for Economics', language: 'english', chapters: 9 }
    ]
  },

  // Class 12
  12: {
    physics: [
      { code: 'leph1', title: 'Physics Part-I', language: 'english', chapters: 8 },
      { code: 'leph2', title: 'Physics Part-II', language: 'english', chapters: 7 }
    ],
    chemistry: [
      { code: 'lech1', title: 'Chemistry Part-I', language: 'english', chapters: 8 },
      { code: 'lech2', title: 'Chemistry Part-II', language: 'english', chapters: 8 }
    ],
    mathematics: [
      { code: 'lemh1', title: 'Mathematics Part-I', language: 'english', chapters: 6 },
      { code: 'lemh2', title: 'Mathematics Part-II', language: 'english', chapters: 7 }
    ],
    biology: [
      { code: 'lebo1', title: 'Biology', language: 'english', chapters: 16 }
    ],
    accountancy: [
      { code: 'leac1', title: 'Accountancy Part-I', language: 'english', chapters: 6 },
      { code: 'leac2', title: 'Accountancy Part-II', language: 'english', chapters: 6 }
    ],
    businessStudies: [
      { code: 'lebs1', title: 'Business Studies Part-I', language: 'english', chapters: 6 },
      { code: 'lebs2', title: 'Business Studies Part-II', language: 'english', chapters: 6 }
    ],
    economics: [
      { code: 'leec1', title: 'Introductory Microeconomics', language: 'english', chapters: 6 },
      { code: 'leec2', title: 'Introductory Macroeconomics', language: 'english', chapters: 6 }
    ]
  }
};

/**
 * Get all textbooks for a specific class
 * @param {number} classNumber - Class number (1-12)
 * @returns {Array} Array of textbook objects
 */
export function getTextbooksByClass(classNumber) {
  const classBooks = NCERT_CATALOG[classNumber];
  if (!classBooks) return [];

  const allBooks = [];
  Object.keys(classBooks).forEach(subject => {
    classBooks[subject].forEach(book => {
      allBooks.push({
        ...book,
        class: classNumber,
        subject: subject
      });
    });
  });

  return allBooks;
}

/**
 * Get textbooks by class and subject
 * @param {number} classNumber - Class number (1-12)
 * @param {string} subject - Subject name
 * @returns {Array} Array of textbook objects
 */
export function getTextbooksBySubject(classNumber, subject) {
  const classBooks = NCERT_CATALOG[classNumber];
  if (!classBooks || !classBooks[subject]) return [];

  return classBooks[subject].map(book => ({
    ...book,
    class: classNumber,
    subject: subject
  }));
}

/**
 * Get direct PDF URL for a specific chapter
 * @param {string} bookCode - NCERT book code (e.g., 'iemh1')
 * @param {number} chapter - Chapter number (1-N) or 'ps' for prelims
 * @returns {string} Direct PDF URL
 */
export function getChapterPdfUrl(bookCode, chapter) {
  const chapterStr = typeof chapter === 'number'
    ? chapter.toString().padStart(2, '0')
    : chapter;
  return `${NCERT_PDF_BASE}/${bookCode}${chapterStr}.pdf`;
}

/**
 * Get complete book download URL (ZIP file)
 * @param {string} bookCode - NCERT book code
 * @returns {string} ZIP download URL
 */
export function getCompleteBookUrl(bookCode) {
  return `${NCERT_PDF_BASE}/${bookCode}dd.zip`;
}

/**
 * Get viewer URL for textbook
 * @param {string} bookCode - NCERT book code
 * @param {number} totalChapters - Total chapters in book
 * @returns {string} NCERT viewer URL
 */
export function getViewerUrl(bookCode, totalChapters = 10) {
  return `${NCERT_BASE_URL}/textbook.php?${bookCode}=0-${totalChapters}`;
}

/**
 * Download PDF from NCERT and convert to Blob
 * @param {string} url - PDF URL
 * @returns {Promise<Blob>} PDF blob
 */
export async function downloadPdf(url) {
  try {
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
    console.error('Error downloading NCERT PDF:', error);
    throw error;
  }
}

/**
 * Get all available classes
 * @returns {Array} Array of class numbers
 */
export function getAllClasses() {
  return Object.keys(NCERT_CATALOG).map(Number).sort((a, b) => a - b);
}

/**
 * Get all subjects for a class
 * @param {number} classNumber - Class number (1-12)
 * @returns {Array} Array of subject names
 */
export function getSubjectsForClass(classNumber) {
  const classBooks = NCERT_CATALOG[classNumber];
  if (!classBooks) return [];
  return Object.keys(classBooks);
}

/**
 * Search textbooks by keyword
 * @param {string} query - Search query
 * @returns {Array} Matching textbooks
 */
export function searchTextbooks(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  Object.keys(NCERT_CATALOG).forEach(classNum => {
    const classBooks = NCERT_CATALOG[classNum];
    Object.keys(classBooks).forEach(subject => {
      classBooks[subject].forEach(book => {
        if (
          book.title.toLowerCase().includes(lowerQuery) ||
          subject.toLowerCase().includes(lowerQuery) ||
          book.language.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            ...book,
            class: parseInt(classNum),
            subject: subject
          });
        }
      });
    });
  });

  return results;
}

export default {
  NCERT_CATALOG,
  getTextbooksByClass,
  getTextbooksBySubject,
  getChapterPdfUrl,
  getCompleteBookUrl,
  getViewerUrl,
  downloadPdf,
  getAllClasses,
  getSubjectsForClass,
  searchTextbooks
};
