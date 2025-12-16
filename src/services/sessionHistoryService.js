/**
 * 📚 Session History Service - "Study Time Machine"
 *
 * Records detailed learning sessions and creates visual timelines.
 * Allows students to replay their learning journey and see progress.
 *
 * Key Features:
 * - Comprehensive session recording
 * - Timeline visualization data
 * - Learning pattern analysis
 * - Revisit any past session
 * - Progress tracking
 * - Confusion point mapping
 *
 * @version 5.5.0
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
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ===== CONSTANTS =====

const COLLECTIONS = {
  SESSION_HISTORY: 'sessionHistory',
  SESSION_EVENTS: 'sessionEvents',
  LEARNING_MILESTONES: 'learningMilestones'
};

const EVENT_TYPES = {
  PAGE_VIEW: 'page_view',
  AI_QUERY: 'ai_query',
  FLASHCARD_REVIEW: 'flashcard_review',
  DOUBT_SUBMITTED: 'doubt_submitted',
  BREAK_TAKEN: 'break_taken',
  COGNITIVE_LOAD_SPIKE: 'cognitive_load_spike',
  CONCEPT_MASTERED: 'concept_mastered',
  CHAPTER_COMPLETED: 'chapter_completed'
};

// ===== SESSION TRACKER =====

/**
 * Main session history tracker class
 */
export class SessionHistoryTracker {
  constructor(userId, sessionId, pdfName, chapter) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.pdfName = pdfName;
    this.chapter = chapter;

    // Session metadata
    this.startTime = Date.now();
    this.endTime = null;

    // Session events timeline
    this.events = [];

    // Session statistics
    this.stats = {
      pagesViewed: new Set(),
      totalAIQueries: 0,
      flashcardsReviewed: 0,
      doubtsSubmitted: 0,
      breaksTaken: 0,
      avgCognitiveLoad: 0,
      peakCognitiveLoad: 0,
      conceptsMastered: [],
      totalFocusTime: 0
    };

    console.log(`📚 Session History Tracker started: ${sessionId}`);
  }

  /**
   * Record a session event
   */
  recordEvent(eventType, eventData) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      relativeTime: Date.now() - this.startTime,
      data: eventData
    };

    this.events.push(event);

    // Update statistics based on event type
    this.updateStats(eventType, eventData);

    console.log(`📝 Event recorded: ${eventType}`, eventData);
  }

  /**
   * Record page view event
   * v7.2.10: Enhanced to track cognitive load with page views
   */
  recordPageView(pageNumber, pageText, cognitiveLoad = null) {
    this.stats.pagesViewed.add(pageNumber);

    this.recordEvent(EVENT_TYPES.PAGE_VIEW, {
      pageNumber: pageNumber,
      textLength: pageText?.length || 0,
      cognitiveLoad: cognitiveLoad
    });
  }

  /**
   * Record AI query event
   */
  recordAIQuery(queryType, queryText, pageNumber, cognitiveLoad) {
    this.stats.totalAIQueries++;

    this.recordEvent(EVENT_TYPES.AI_QUERY, {
      queryType: queryType,
      queryText: queryText,
      pageNumber: pageNumber,
      cognitiveLoad: cognitiveLoad
    });
  }

  /**
   * Record flashcard review event
   */
  recordFlashcardReview(cardId, quality, concept) {
    this.stats.flashcardsReviewed++;

    this.recordEvent(EVENT_TYPES.FLASHCARD_REVIEW, {
      cardId: cardId,
      quality: quality,
      concept: concept,
      wasCorrect: quality >= 3
    });
  }

  /**
   * Record doubt submission event
   */
  recordDoubtSubmission(concept, question, pageNumber) {
    this.stats.doubtsSubmitted++;

    this.recordEvent(EVENT_TYPES.DOUBT_SUBMITTED, {
      concept: concept,
      question: question,
      pageNumber: pageNumber
    });
  }

  /**
   * Record break taken event
   */
  recordBreak(duration, reason) {
    this.stats.breaksTaken++;

    this.recordEvent(EVENT_TYPES.BREAK_TAKEN, {
      duration: duration,
      reason: reason
    });
  }

  /**
   * Record cognitive load spike
   */
  recordCognitiveLoadSpike(cognitiveLoad, pageNumber, reason) {
    this.stats.peakCognitiveLoad = Math.max(this.stats.peakCognitiveLoad, cognitiveLoad);

    this.recordEvent(EVENT_TYPES.COGNITIVE_LOAD_SPIKE, {
      cognitiveLoad: cognitiveLoad,
      pageNumber: pageNumber,
      reason: reason
    });
  }

  /**
   * Record concept mastered
   */
  recordConceptMastered(concept, method) {
    if (!this.stats.conceptsMastered.includes(concept)) {
      this.stats.conceptsMastered.push(concept);
    }

    this.recordEvent(EVENT_TYPES.CONCEPT_MASTERED, {
      concept: concept,
      method: method // 'flashcards', 'ai_query', 'doubt_resolved'
    });
  }

  /**
   * Record chapter completion
   */
  recordChapterCompleted() {
    this.recordEvent(EVENT_TYPES.CHAPTER_COMPLETED, {
      pagesViewed: this.stats.pagesViewed.size,
      totalTime: Date.now() - this.startTime
    });
  }

  /**
   * Update statistics based on event
   */
  updateStats(eventType, eventData) {
    // Calculate average cognitive load
    const cognitiveLoadEvents = this.events.filter(
      e => e.data?.cognitiveLoad !== undefined
    );

    if (cognitiveLoadEvents.length > 0) {
      const totalLoad = cognitiveLoadEvents.reduce(
        (sum, e) => sum + e.data.cognitiveLoad,
        0
      );
      this.stats.avgCognitiveLoad = totalLoad / cognitiveLoadEvents.length;
    }

    // Calculate total focus time (excluding breaks)
    const breakDuration = this.events
      .filter(e => e.type === EVENT_TYPES.BREAK_TAKEN)
      .reduce((sum, e) => sum + (e.data.duration || 0), 0);

    this.stats.totalFocusTime = (Date.now() - this.startTime) - breakDuration;
  }

  /**
   * Get session timeline for visualization
   */
  getTimeline() {
    return this.events.map(event => ({
      ...event,
      formattedTime: this.formatRelativeTime(event.relativeTime),
      icon: this.getEventIcon(event.type),
      color: this.getEventColor(event.type)
    }));
  }

  /**
   * Format relative time (ms -> human readable)
   */
  formatRelativeTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s ago`;
    } else {
      return `${seconds}s ago`;
    }
  }

  /**
   * Get icon for event type
   */
  getEventIcon(eventType) {
    const icons = {
      [EVENT_TYPES.PAGE_VIEW]: '📄',
      [EVENT_TYPES.AI_QUERY]: '🤖',
      [EVENT_TYPES.FLASHCARD_REVIEW]: '🎴',
      [EVENT_TYPES.DOUBT_SUBMITTED]: '❓',
      [EVENT_TYPES.BREAK_TAKEN]: '☕',
      [EVENT_TYPES.COGNITIVE_LOAD_SPIKE]: '🧠',
      [EVENT_TYPES.CONCEPT_MASTERED]: '🎓',
      [EVENT_TYPES.CHAPTER_COMPLETED]: '🎉'
    };

    return icons[eventType] || '📌';
  }

  /**
   * Get color for event type
   */
  getEventColor(eventType) {
    const colors = {
      [EVENT_TYPES.PAGE_VIEW]: '#2196F3',
      [EVENT_TYPES.AI_QUERY]: '#9C27B0',
      [EVENT_TYPES.FLASHCARD_REVIEW]: '#FF9800',
      [EVENT_TYPES.DOUBT_SUBMITTED]: '#F44336',
      [EVENT_TYPES.BREAK_TAKEN]: '#4CAF50',
      [EVENT_TYPES.COGNITIVE_LOAD_SPIKE]: '#E91E63',
      [EVENT_TYPES.CONCEPT_MASTERED]: '#00BCD4',
      [EVENT_TYPES.CHAPTER_COMPLETED]: '#8BC34A'
    };

    return colors[eventType] || '#757575';
  }

  /**
   * Get session summary
   */
  getSummary() {
    const duration = Date.now() - this.startTime;

    return {
      sessionId: this.sessionId,
      pdfName: this.pdfName,
      chapter: this.chapter,
      startTime: this.startTime,
      duration: duration,
      formattedDuration: this.formatDuration(duration),
      stats: {
        ...this.stats,
        pagesViewed: this.stats.pagesViewed.size
      },
      eventCount: this.events.length
    };
  }

  /**
   * Format duration (ms -> human readable)
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Save session to Firestore
   * v7.2.10: Enhanced with better error handling and logging
   */
  async saveSession() {
    if (!this.userId) {
      console.warn('⚠️ Cannot save session: No user ID');
      return;
    }
    
    if (!db) {
      console.warn('⚠️ Cannot save session: Firestore not initialized');
      return;
    }

    try {
      this.endTime = Date.now();
      const duration = this.endTime - this.startTime;
      
      // Only save if session has meaningful activity (at least 5 seconds)
      if (duration < 5000) {
        console.log('ℹ️ Session too short to save:', Math.round(duration/1000), 'seconds');
        return;
      }

      const sessionData = {
        userId: this.userId,
        sessionId: this.sessionId,
        pdfName: this.pdfName,
        chapter: this.chapter,
        startTime: Timestamp.fromMillis(this.startTime),
        endTime: Timestamp.fromMillis(this.endTime),
        duration: duration,
        stats: {
          pagesViewed: Array.from(this.stats.pagesViewed),
          totalAIQueries: this.stats.totalAIQueries,
          flashcardsReviewed: this.stats.flashcardsReviewed,
          doubtsSubmitted: this.stats.doubtsSubmitted,
          breaksTaken: this.stats.breaksTaken,
          avgCognitiveLoad: Math.round(this.stats.avgCognitiveLoad),
          peakCognitiveLoad: Math.round(this.stats.peakCognitiveLoad),
          conceptsMastered: this.stats.conceptsMastered,
          totalFocusTime: this.stats.totalFocusTime
        },
        eventCount: this.events.length,
        createdAt: Timestamp.now()
      };

      console.log('📊 Saving session:', {
        sessionId: this.sessionId,
        duration: Math.round(duration/1000) + 's',
        pagesViewed: sessionData.stats.pagesViewed.length,
        events: this.events.length,
        aiQueries: sessionData.stats.totalAIQueries
      });

      await setDoc(doc(db, COLLECTIONS.SESSION_HISTORY, this.sessionId), sessionData);

      // Save events separately (for detailed timeline)
      if (this.events.length > 0) {
        const eventsData = {
          sessionId: this.sessionId,
          userId: this.userId,
          events: this.events.slice(0, 100), // Limit to first 100 events
          createdAt: Timestamp.now()
        };
        await setDoc(doc(db, COLLECTIONS.SESSION_EVENTS, this.sessionId), eventsData);
      }

      console.log('✅ Session history saved successfully');
    } catch (error) {
      console.error('❌ Error saving session history:', error);
      throw error; // Re-throw so callers can handle
    }
  }
}

// ===== SESSION RETRIEVAL =====

/**
 * Get session history for a user
 */
export async function getSessionHistory(userId, limitCount = 10) {
  if (!userId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.SESSION_HISTORY),
    where('userId', '==', userId),
    orderBy('startTime', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get specific session details with timeline
 */
export async function getSessionDetails(sessionId) {
  if (!sessionId || !db) return null;

  // Get session metadata
  const sessionDoc = await getDoc(doc(db, COLLECTIONS.SESSION_HISTORY, sessionId));

  if (!sessionDoc.exists()) return null;

  // Get session events
  const eventsDoc = await getDoc(doc(db, COLLECTIONS.SESSION_EVENTS, sessionId));

  return {
    ...sessionDoc.data(),
    events: eventsDoc.exists() ? eventsDoc.data().events : []
  };
}

/**
 * Get sessions for a specific chapter
 */
export async function getChapterSessions(userId, chapter) {
  if (!userId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.SESSION_HISTORY),
    where('userId', '==', userId),
    where('chapter', '==', chapter),
    orderBy('startTime', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== LEARNING ANALYTICS =====

/**
 * Get learning patterns analysis
 */
export async function getLearningPatterns(userId, days = 30) {
  if (!userId || !db) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    collection(db, COLLECTIONS.SESSION_HISTORY),
    where('userId', '==', userId),
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    orderBy('startTime', 'asc')
  );

  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(doc => doc.data());

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalStudyTime: 0,
      avgSessionDuration: 0,
      totalPagesRead: 0,
      totalAIQueries: 0,
      conceptsMastered: 0,
      avgCognitiveLoad: 0
    };
  }

  // Calculate aggregates
  const totalStudyTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgSessionDuration = totalStudyTime / sessions.length;

  const allPagesViewed = new Set();
  let totalAIQueries = 0;
  let totalConceptsMastered = new Set();
  let totalCognitiveLoad = 0;

  sessions.forEach(session => {
    session.stats.pagesViewed?.forEach(page => allPagesViewed.add(page));
    totalAIQueries += session.stats.totalAIQueries || 0;
    session.stats.conceptsMastered?.forEach(concept => totalConceptsMastered.add(concept));
    totalCognitiveLoad += session.stats.avgCognitiveLoad || 0;
  });

  return {
    totalSessions: sessions.length,
    totalStudyTime: Math.round(totalStudyTime / 60000), // minutes
    avgSessionDuration: Math.round(avgSessionDuration / 60000), // minutes
    totalPagesRead: allPagesViewed.size,
    totalAIQueries: totalAIQueries,
    conceptsMastered: totalConceptsMastered.size,
    avgCognitiveLoad: Math.round(totalCognitiveLoad / sessions.length),
    sessionsPerWeek: Math.round((sessions.length / days) * 7)
  };
}

/**
 * Get milestones for a user
 */
export async function getMilestones(userId) {
  if (!userId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.LEARNING_MILESTONES),
    where('userId', '==', userId),
    orderBy('achievedAt', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a learning milestone
 */
export async function createMilestone(userId, type, title, description, metadata) {
  if (!userId || !db) return;

  const milestoneId = `${userId}_${Date.now()}`;

  const milestone = {
    userId: userId,
    type: type, // 'first_session', '10_sessions', 'chapter_complete', etc.
    title: title,
    description: description,
    metadata: metadata,
    achievedAt: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.LEARNING_MILESTONES, milestoneId), milestone);

  console.log(`🎉 Milestone achieved: ${title}`);

  return { id: milestoneId, ...milestone };
}

// ===== EXPORTS =====

export default {
  SessionHistoryTracker,
  getSessionHistory,
  getSessionDetails,
  getChapterSessions,
  getLearningPatterns,
  getMilestones,
  createMilestone,
  EVENT_TYPES
};
