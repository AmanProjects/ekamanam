/**
 * 🃏 Spaced Repetition Service
 *
 * Implements the SM-2 (SuperMemo 2) algorithm for optimal flashcard review scheduling.
 * Provides automatic flashcard generation from AI and manages the entire review lifecycle.
 *
 * Key Features:
 * - SM-2 algorithm for intelligent spacing
 * - Auto-generation from page content
 * - Streak tracking and gamification
 * - Due card notifications
 * - Performance analytics
 *
 * @version 5.2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { callLLM } from './llmService';

// ===== CONSTANTS =====

const COLLECTIONS = {
  FLASHCARDS: 'flashcards',
  REVIEW_HISTORY: 'reviewHistory',
  STREAKS: 'streaks'
};

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_INTERVAL_DAYS = 365; // Cap at 1 year

// ===== FLASHCARD CRUD OPERATIONS =====

/**
 * Create a new flashcard
 */
export async function createFlashcard(userId, flashcardData) {
  if (!userId || !db) {
    throw new Error('User not authenticated or database not available');
  }

  const cardId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const flashcard = {
    userId: userId,
    front: flashcardData.front,
    back: flashcardData.back,
    chapter: flashcardData.chapter || 'General',
    subject: flashcardData.subject || '',
    tags: flashcardData.tags || [],
    source: flashcardData.source || 'manual', // 'manual' or 'ai_generated'

    // SM-2 Algorithm fields
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0, // days until next review
    repetitions: 0, // number of successful reviews
    nextReviewDate: Timestamp.now(), // due immediately for new cards

    // Tracking
    correctStreak: 0,
    totalReviews: 0,
    correctCount: 0,
    incorrectCount: 0,

    // Metadata
    createdAt: Timestamp.now(),
    lastReviewedAt: null,
    lastModifiedAt: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.FLASHCARDS, cardId), flashcard);

  console.log('✅ Flashcard created:', cardId);
  return { id: cardId, ...flashcard };
}

/**
 * Get a specific flashcard
 */
export async function getFlashcard(cardId) {
  if (!db) return null;

  const cardDoc = await getDoc(doc(db, COLLECTIONS.FLASHCARDS, cardId));
  return cardDoc.exists() ? { id: cardDoc.id, ...cardDoc.data() } : null;
}

/**
 * Get all flashcards for a user
 */
export async function getUserFlashcards(userId, filters = {}) {
  if (!userId || !db) return [];

  let q = query(
    collection(db, COLLECTIONS.FLASHCARDS),
    where('userId', '==', userId)
  );

  // Apply filters
  if (filters.chapter) {
    q = query(q, where('chapter', '==', filters.chapter));
  }

  if (filters.subject) {
    q = query(q, where('subject', '==', filters.subject));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update a flashcard
 */
export async function updateFlashcard(cardId, updates) {
  if (!db) return;

  const updateData = {
    ...updates,
    lastModifiedAt: Timestamp.now()
  };

  await updateDoc(doc(db, COLLECTIONS.FLASHCARDS, cardId), updateData);
  console.log('✅ Flashcard updated:', cardId);
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(cardId) {
  if (!db) return;

  await deleteDoc(doc(db, COLLECTIONS.FLASHCARDS, cardId));
  console.log('🗑️ Flashcard deleted:', cardId);
}

// ===== SM-2 ALGORITHM IMPLEMENTATION =====

/**
 * Review a flashcard and calculate next review date using SM-2 algorithm
 *
 * @param {string} cardId - Flashcard ID
 * @param {number} quality - User's self-assessment (0-5)
 *   0: Total blackout (complete failure)
 *   1: Incorrect, but felt familiar
 *   2: Incorrect, but close
 *   3: Correct, but with difficulty
 *   4: Correct, with some hesitation
 *   5: Perfect recall
 *
 * @returns {Object} Updated flashcard with new interval
 */
export async function reviewFlashcard(cardId, quality) {
  if (!db) {
    throw new Error('Database not available');
  }

  // Validate quality (0-5)
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  const card = await getFlashcard(cardId);
  if (!card) {
    throw new Error('Flashcard not found');
  }

  let newInterval, newEaseFactor, newRepetitions;

  // SM-2 Algorithm
  if (quality < 3) {
    // Incorrect answer: reset to beginning
    newInterval = 0;
    newRepetitions = 0;
    newEaseFactor = card.easeFactor; // Keep ease factor
  } else {
    // Correct answer: calculate new interval
    newRepetitions = card.repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1; // First review: 1 day
    } else if (newRepetitions === 2) {
      newInterval = 6; // Second review: 6 days
    } else {
      newInterval = Math.round(card.interval * card.easeFactor);
    }

    // Update ease factor based on quality
    newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Enforce minimum ease factor
    newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);
  }

  // Cap maximum interval
  newInterval = Math.min(newInterval, MAX_INTERVAL_DAYS);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  // Update card
  const updates = {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReviewDate: Timestamp.fromDate(nextReviewDate),
    lastReviewedAt: Timestamp.now(),
    totalReviews: card.totalReviews + 1,
    correctCount: quality >= 3 ? card.correctCount + 1 : card.correctCount,
    incorrectCount: quality < 3 ? card.incorrectCount + 1 : card.incorrectCount,
    correctStreak: quality >= 3 ? card.correctStreak + 1 : 0
  };

  await updateFlashcard(cardId, updates);

  // Record review in history
  await recordReviewHistory(card.userId, cardId, quality, newInterval);

  // Update streak
  await updateStreak(card.userId);

  console.log(`✅ Reviewed card ${cardId}: Quality ${quality}, Next review in ${newInterval} days`);

  return {
    cardId: cardId,
    quality: quality,
    newInterval: newInterval,
    nextReviewDate: nextReviewDate,
    wasCorrect: quality >= 3
  };
}

/**
 * Record review in history for analytics
 */
async function recordReviewHistory(userId, cardId, quality, interval) {
  if (!db) return;

  const historyId = `${userId}_${cardId}_${Date.now()}`;

  await setDoc(doc(db, COLLECTIONS.REVIEW_HISTORY, historyId), {
    userId: userId,
    cardId: cardId,
    quality: quality,
    interval: interval,
    reviewedAt: Timestamp.now()
  });
}

// ===== DUE CARDS & SCHEDULING =====

/**
 * Get all cards due for review
 */
export async function getDueCards(userId, maxCards = 20) {
  if (!userId || !db) return [];

  const now = Timestamp.now();

  const q = query(
    collection(db, COLLECTIONS.FLASHCARDS),
    where('userId', '==', userId),
    where('nextReviewDate', '<=', now),
    orderBy('nextReviewDate', 'asc'),
    limit(maxCards)
  );

  const snapshot = await getDocs(q);
  const dueCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log(`📚 ${dueCards.length} cards due for review`);
  return dueCards;
}

/**
 * Get count of due cards (for notifications)
 */
export async function getDueCardCount(userId) {
  const dueCards = await getDueCards(userId, 1000);
  return dueCards.length;
}

/**
 * Get upcoming reviews (next 7 days)
 */
export async function getUpcomingReviews(userId) {
  if (!userId || !db) return [];

  const now = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(now.getDate() + 7);

  const q = query(
    collection(db, COLLECTIONS.FLASHCARDS),
    where('userId', '==', userId),
    where('nextReviewDate', '>', Timestamp.now()),
    where('nextReviewDate', '<=', Timestamp.fromDate(sevenDaysLater)),
    orderBy('nextReviewDate', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== AI FLASHCARD GENERATION =====

/**
 * Generate flashcards from page content using AI
 */
export async function generateFlashcardsFromPage(pageText, chapter, subject) {
  if (!pageText || pageText.trim().length < 100) {
    throw new Error('Page text too short for flashcard generation');
  }

  const prompt = `You are a flashcard generator for students. Extract 5-10 important facts, formulas, definitions, or concepts from this textbook content and create flashcards.

Content:
${pageText.substring(0, 3000)}

Rules:
1. Front should be a clear question or prompt
2. Back should be a concise, accurate answer
3. Focus on key concepts, not trivial details
4. Include formulas, definitions, important dates/names
5. Make questions specific and unambiguous

Return ONLY valid JSON (no extra text):
[
  {
    "front": "What is the quadratic formula?",
    "back": "x = (-b ± √(b²-4ac)) / 2a"
  },
  {
    "front": "Define photosynthesis",
    "back": "The process by which green plants use sunlight to synthesize nutrients from CO₂ and water"
  }
]`;

  try {
    const response = await callLLM(prompt, {
      feature: 'flashcards',
      temperature: 0.3, // Lower temperature for factual accuracy
      maxTokens: 2000
    });

    // Parse JSON response
    const flashcards = JSON.parse(response);

    // Validate format
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('Invalid flashcard format from AI');
    }

    // Add metadata
    const enrichedFlashcards = flashcards.map(card => ({
      ...card,
      chapter: chapter,
      subject: subject,
      source: 'ai_generated'
    }));

    console.log(`✅ Generated ${enrichedFlashcards.length} flashcards from AI`);
    return enrichedFlashcards;

  } catch (error) {
    console.error('❌ AI flashcard generation failed:', error);
    throw new Error('Failed to generate flashcards: ' + error.message);
  }
}

/**
 * Batch create flashcards from AI generation
 */
export async function createFlashcardsFromAI(userId, pageText, chapter, subject) {
  const generatedCards = await generateFlashcardsFromPage(pageText, chapter, subject);

  const createdCards = [];
  for (const cardData of generatedCards) {
    const card = await createFlashcard(userId, cardData);
    createdCards.push(card);
  }

  console.log(`✅ Created ${createdCards.length} AI-generated flashcards`);
  return createdCards;
}

// ===== STREAK TRACKING =====

/**
 * Update user's review streak
 */
export async function updateStreak(userId) {
  if (!userId || !db) return;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const streakDoc = await getDoc(doc(db, COLLECTIONS.STREAKS, userId));

  if (!streakDoc.exists()) {
    // First review ever
    await setDoc(doc(db, COLLECTIONS.STREAKS, userId), {
      userId: userId,
      currentStreak: 1,
      longestStreak: 1,
      lastReviewDate: today,
      totalReviewDays: 1,
      createdAt: Timestamp.now()
    });
    return { currentStreak: 1, longestStreak: 1 };
  }

  const streakData = streakDoc.data();
  const lastReviewDate = streakData.lastReviewDate;

  // Already reviewed today
  if (lastReviewDate === today) {
    return {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak
    };
  }

  // Check if streak continues (yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak;
  if (lastReviewDate === yesterdayStr) {
    // Streak continues
    newStreak = streakData.currentStreak + 1;
  } else {
    // Streak broken, restart
    newStreak = 1;
  }

  const newLongestStreak = Math.max(streakData.longestStreak, newStreak);

  await updateDoc(doc(db, COLLECTIONS.STREAKS, userId), {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastReviewDate: today,
    totalReviewDays: streakData.totalReviewDays + 1
  });

  console.log(`🔥 Streak updated: ${newStreak} days`);
  return { currentStreak: newStreak, longestStreak: newLongestStreak };
}

/**
 * Get user's streak information
 */
export async function getStreakInfo(userId) {
  if (!userId || !db) {
    return { currentStreak: 0, longestStreak: 0, totalReviewDays: 0 };
  }

  const streakDoc = await getDoc(doc(db, COLLECTIONS.STREAKS, userId));

  if (!streakDoc.exists()) {
    return { currentStreak: 0, longestStreak: 0, totalReviewDays: 0 };
  }

  const streakData = streakDoc.data();
  const today = new Date().toISOString().split('T')[0];

  // Check if streak is still valid (reviewed today or yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const isStreakActive = streakData.lastReviewDate === today ||
                         streakData.lastReviewDate === yesterdayStr;

  return {
    currentStreak: isStreakActive ? streakData.currentStreak : 0,
    longestStreak: streakData.longestStreak,
    totalReviewDays: streakData.totalReviewDays,
    lastReviewDate: streakData.lastReviewDate,
    isActive: isStreakActive
  };
}

// ===== ANALYTICS =====

/**
 * Get flashcard statistics for a user
 */
export async function getFlashcardStats(userId) {
  if (!userId || !db) {
    return {
      totalCards: 0,
      dueToday: 0,
      masteredCards: 0,
      learningCards: 0,
      newCards: 0,
      reviewAccuracy: 0
    };
  }

  const allCards = await getUserFlashcards(userId);
  const dueCards = await getDueCards(userId, 1000);

  // Categorize cards
  const newCards = allCards.filter(c => c.totalReviews === 0);
  const learningCards = allCards.filter(c => c.totalReviews > 0 && c.interval < 21);
  const masteredCards = allCards.filter(c => c.interval >= 21);

  // Calculate accuracy
  const totalReviews = allCards.reduce((sum, c) => sum + c.totalReviews, 0);
  const correctReviews = allCards.reduce((sum, c) => sum + c.correctCount, 0);
  const reviewAccuracy = totalReviews > 0 ? (correctReviews / totalReviews * 100) : 0;

  return {
    totalCards: allCards.length,
    dueToday: dueCards.length,
    masteredCards: masteredCards.length,
    learningCards: learningCards.length,
    newCards: newCards.length,
    reviewAccuracy: Math.round(reviewAccuracy)
  };
}

// ===== EXPORTS =====

export default {
  // CRUD
  createFlashcard,
  getFlashcard,
  getUserFlashcards,
  updateFlashcard,
  deleteFlashcard,

  // Review
  reviewFlashcard,
  getDueCards,
  getDueCardCount,
  getUpcomingReviews,

  // AI Generation
  generateFlashcardsFromPage,
  createFlashcardsFromAI,

  // Streaks
  updateStreak,
  getStreakInfo,

  // Analytics
  getFlashcardStats
};
