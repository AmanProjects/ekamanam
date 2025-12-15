/**
 * 🧠 Cognitive Load Tracker Service
 *
 * Monitors student's cognitive state in real-time by analyzing:
 * - Reading pace and patterns
 * - Page revisits and navigation
 * - AI query frequency and complexity
 * - Interaction patterns (hover, scroll)
 *
 * Provides adaptive difficulty adjustment to optimize learning.
 *
 * Key Features:
 * - Real-time cognitive load score (0-100)
 * - Adaptive AI prompt modification
 * - Break suggestions
 * - Learning zone optimization (40-70 = optimal)
 * - Session analytics
 *
 * @version 5.3.0
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
  COGNITIVE_LOAD_HISTORY: 'cognitiveLoadHistory',
  SESSION_METRICS: 'sessionMetrics',
  BREAK_SUGGESTIONS: 'breakSuggestions'
};

// Cognitive load zones
export const LOAD_ZONES = {
  UNDERUTILIZED: { min: 0, max: 40, label: 'Too Easy', color: '#4CAF50' },
  OPTIMAL: { min: 40, max: 70, label: 'Perfect!', color: '#2196F3' },
  OVERLOADED: { min: 70, max: 100, label: 'Struggling', color: '#F44336' }
};

// Expected reading times (words per minute)
const READING_SPEED = {
  FAST: 250,      // Advanced readers
  NORMAL: 200,    // Average speed
  SLOW: 150,      // Careful reading
  VERY_SLOW: 100  // Struggling
};

// ===== COGNITIVE LOAD CALCULATOR =====

/**
 * Main cognitive load tracker class
 */
export class CognitiveLoadTracker {
  constructor(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId;

    // Tracking metrics
    this.currentPage = null;
    this.pageStartTime = null;
    this.pageReadingTimes = {}; // page -> time spent
    this.pageRevisits = {}; // page -> revisit count
    this.aiQueries = [];
    this.scrollPatterns = [];
    this.mouseHovers = [];

    // Calculated metrics
    this.currentLoad = 50; // Start at neutral
    this.loadHistory = [];

    // Session stats
    this.sessionStartTime = Date.now();
    this.totalFocusTime = 0;
    this.breaksTaken = 0;
  }

  /**
   * Called when user starts reading a page
   */
  startPageReading(pageNumber, pageText) {
    // Save previous page time
    if (this.currentPage !== null) {
      this.endPageReading();
    }

    this.currentPage = pageNumber;
    this.pageStartTime = Date.now();

    // Initialize revisit counter if first time
    if (!this.pageRevisits[pageNumber]) {
      this.pageRevisits[pageNumber] = 0;
    } else {
      this.pageRevisits[pageNumber]++;
    }

    console.log(`📖 Started reading page ${pageNumber} (Revisit: ${this.pageRevisits[pageNumber]})`);
  }

  /**
   * Called when user leaves a page
   */
  endPageReading() {
    if (this.currentPage === null || this.pageStartTime === null) return;

    const timeSpent = Date.now() - this.pageStartTime;

    // Store reading time
    if (!this.pageReadingTimes[this.currentPage]) {
      this.pageReadingTimes[this.currentPage] = 0;
    }
    this.pageReadingTimes[this.currentPage] += timeSpent;

    // Update total focus time
    this.totalFocusTime += timeSpent;

    // Recalculate cognitive load
    this.calculateCognitiveLoad();

    console.log(`📕 Ended reading page ${this.currentPage} (Time: ${Math.round(timeSpent / 1000)}s)`);

    this.currentPage = null;
    this.pageStartTime = null;
  }

  /**
   * Record AI query (indicates confusion or curiosity)
   */
  recordAIQuery(queryText, queryType, pageNumber) {
    const query = {
      text: queryText,
      type: queryType, // 'explain', 'teacherMode', 'activities', etc.
      page: pageNumber,
      timestamp: Date.now()
    };

    this.aiQueries.push(query);

    // Recalculate load
    this.calculateCognitiveLoad();

    console.log(`💬 AI Query recorded: ${queryType} on page ${pageNumber}`);
  }

  /**
   * Record scroll pattern (rapid scrolling = confusion or boredom)
   */
  recordScrollPattern(scrollSpeed, direction, pageNumber) {
    const pattern = {
      speed: scrollSpeed, // pixels/second
      direction: direction, // 'up' or 'down'
      page: pageNumber,
      timestamp: Date.now()
    };

    this.scrollPatterns.push(pattern);

    // Keep only last 10
    if (this.scrollPatterns.length > 10) {
      this.scrollPatterns.shift();
    }
  }

  /**
   * Record mouse hover (hovering = reading carefully or confused)
   */
  recordMouseHover(duration, pageNumber) {
    const hover = {
      duration: duration, // milliseconds
      page: pageNumber,
      timestamp: Date.now()
    };

    this.mouseHovers.push(hover);

    // Keep only last 20
    if (this.mouseHovers.length > 20) {
      this.mouseHovers.shift();
    }
  }

  /**
   * Calculate cognitive load score (0-100)
   */
  calculateCognitiveLoad() {
    let load = 0;

    // Factor 1: Reading Speed (40% weight)
    const readingSpeedScore = this.calculateReadingSpeedScore();
    load += readingSpeedScore * 0.4;

    // Factor 2: Page Revisits (20% weight)
    const revisitScore = this.calculateRevisitScore();
    load += revisitScore * 0.2;

    // Factor 3: AI Query Frequency (30% weight)
    const queryScore = this.calculateQueryScore();
    load += queryScore * 0.3;

    // Factor 4: Scroll/Hover Patterns (10% weight)
    const interactionScore = this.calculateInteractionScore();
    load += interactionScore * 0.1;

    // Clamp to 0-100
    load = Math.max(0, Math.min(100, load));

    // Update current load
    this.currentLoad = load;

    // Store in history
    this.loadHistory.push({
      load: load,
      timestamp: Date.now(),
      page: this.currentPage
    });

    // Keep only last 50 readings
    if (this.loadHistory.length > 50) {
      this.loadHistory.shift();
    }

    console.log(`🧠 Cognitive Load: ${Math.round(load)}/100 (${this.getLoadZone(load).label})`);

    return load;
  }

  /**
   * Calculate reading speed score
   * Slow reading = high cognitive load
   */
  calculateReadingSpeedScore() {
    if (!this.currentPage || !this.pageReadingTimes[this.currentPage]) {
      return 50; // Neutral
    }

    const timeSpent = this.pageReadingTimes[this.currentPage];
    const expectedTime = 60000; // Assume 1 min per page (adjust based on content)

    const ratio = timeSpent / expectedTime;

    // ratio > 2 = very slow (high load)
    // ratio = 1 = normal (medium load)
    // ratio < 0.5 = very fast (low load, maybe not reading)

    if (ratio > 2.5) return 90; // Very slow = struggling
    if (ratio > 2) return 75;
    if (ratio > 1.5) return 60;
    if (ratio > 1) return 50; // Normal
    if (ratio > 0.7) return 40;
    if (ratio > 0.5) return 30;
    return 20; // Very fast = too easy or skimming
  }

  /**
   * Calculate revisit score
   * More revisits = higher confusion
   */
  calculateRevisitScore() {
    if (!this.currentPage) return 0;

    const revisits = this.pageRevisits[this.currentPage] || 0;

    if (revisits === 0) return 0;
    if (revisits === 1) return 15;
    if (revisits === 2) return 30;
    if (revisits >= 3) return 50; // High confusion

    return 0;
  }

  /**
   * Calculate AI query score
   * More queries = higher confusion OR curiosity
   */
  calculateQueryScore() {
    const recentWindow = 5 * 60 * 1000; // Last 5 minutes
    const now = Date.now();

    const recentQueries = this.aiQueries.filter(q => now - q.timestamp < recentWindow);

    const queryCount = recentQueries.length;

    // 0-1 queries = low (20)
    // 2-3 queries = medium (50)
    // 4+ queries = high (80)

    if (queryCount === 0) return 20;
    if (queryCount === 1) return 30;
    if (queryCount === 2) return 50;
    if (queryCount === 3) return 65;
    if (queryCount >= 4) return 80;

    return 50;
  }

  /**
   * Calculate interaction score
   * Rapid scrolling or long hovers = confusion
   */
  calculateInteractionScore() {
    // Rapid scrolling (recent)
    const recentScrolls = this.scrollPatterns.filter(p => Date.now() - p.timestamp < 30000);
    const rapidScrolls = recentScrolls.filter(p => p.speed > 1000); // Fast scrolling

    // Long hovers (recent)
    const recentHovers = this.mouseHovers.filter(h => Date.now() - h.timestamp < 30000);
    const longHovers = recentHovers.filter(h => h.duration > 3000); // > 3 seconds

    let score = 0;

    // Rapid scrolling suggests confusion or searching
    if (rapidScrolls.length > 3) score += 30;
    else if (rapidScrolls.length > 1) score += 15;

    // Long hovers suggest careful reading or confusion
    if (longHovers.length > 5) score += 30;
    else if (longHovers.length > 2) score += 15;

    return score;
  }

  /**
   * Get current cognitive load zone
   */
  getLoadZone(load = null) {
    const currentLoad = load !== null ? load : this.currentLoad;

    if (currentLoad <= LOAD_ZONES.UNDERUTILIZED.max) {
      return LOAD_ZONES.UNDERUTILIZED;
    } else if (currentLoad <= LOAD_ZONES.OPTIMAL.max) {
      return LOAD_ZONES.OPTIMAL;
    } else {
      return LOAD_ZONES.OVERLOADED;
    }
  }

  /**
   * Get average load over session
   */
  getAverageLoad() {
    if (this.loadHistory.length === 0) return 50;

    const sum = this.loadHistory.reduce((acc, entry) => acc + entry.load, 0);
    return sum / this.loadHistory.length;
  }

  /**
   * Save session to Firestore
   */
  async saveSession() {
    if (!this.userId || !db) return;

    const sessionData = {
      userId: this.userId,
      sessionId: this.sessionId,
      startTime: Timestamp.fromMillis(this.sessionStartTime),
      endTime: Timestamp.now(),
      totalFocusTime: this.totalFocusTime,
      averageLoad: this.getAverageLoad(),
      peakLoad: Math.max(...this.loadHistory.map(h => h.load)),
      pagesVisited: Object.keys(this.pageReadingTimes).length,
      pageRevisits: Object.values(this.pageRevisits).reduce((sum, count) => sum + count, 0),
      aiQueriesCount: this.aiQueries.length,
      breaksTaken: this.breaksTaken,
      loadHistory: this.loadHistory.slice(-20) // Last 20 readings
    };

    await setDoc(doc(db, COLLECTIONS.SESSION_METRICS, this.sessionId), sessionData);

    console.log('✅ Cognitive load session saved');
  }
}

// ===== ADAPTIVE AI SYSTEM =====

/**
 * Modify AI prompt based on cognitive load
 */
export function getAdaptiveAIPrompt(basePrompt, cognitiveLoad, loadZone) {
  if (loadZone.label === 'Too Easy') {
    // Add challenge
    return `${basePrompt}

🎯 CHALLENGE MODE (Student is doing great!):
- Add critical thinking questions
- Connect to advanced topics
- Suggest deeper exploration
- Use more sophisticated language`;
  } else if (loadZone.label === 'Struggling') {
    // Simplify
    return `${basePrompt}

🆘 SIMPLIFIED MODE (Student is struggling):
- Use VERY SIMPLE language (explain like to a 10-year-old)
- Break into SMALL chunks (3-4 sentences max per paragraph)
- Add 3+ REAL-WORLD analogies
- Focus on CORE concept only (no extras)
- Use short sentences (10-15 words max)
- Add step-by-step breakdown`;
  } else {
    // Optimal - no modification
    return basePrompt;
  }
}

/**
 * Get break suggestion based on session metrics
 */
export function shouldSuggestBreak(tracker) {
  const sessionDuration = Date.now() - tracker.sessionStartTime;
  const highLoadDuration = tracker.loadHistory
    .filter(h => h.load > 70)
    .length * 60000; // Approximate minutes in high load

  // Suggest break if:
  // 1. Session > 45 mins AND high load > 15 mins
  // 2. Session > 90 mins
  // 3. Current load > 85 for last 10 readings

  const recentLoad = tracker.loadHistory.slice(-10);
  const allHighLoad = recentLoad.every(h => h.load > 85);

  if (sessionDuration > 45 * 60 * 1000 && highLoadDuration > 15 * 60 * 1000) {
    return {
      shouldBreak: true,
      reason: 'You\'ve been studying at high cognitive load for 15+ minutes. Take a 5-minute break!',
      suggestedDuration: 5
    };
  }

  if (sessionDuration > 90 * 60 * 1000) {
    return {
      shouldBreak: true,
      reason: 'You\'ve been studying for 90+ minutes. Time for a longer break!',
      suggestedDuration: 15
    };
  }

  if (allHighLoad) {
    return {
      shouldBreak: true,
      reason: 'Your cognitive load has been very high. Take a short break to refresh!',
      suggestedDuration: 3
    };
  }

  return { shouldBreak: false };
}

// ===== ANALYTICS =====

/**
 * Get cognitive load statistics for a user
 */
export async function getCognitiveLoadStats(userId, days = 7) {
  if (!userId || !db) {
    return {
      averageLoad: 0,
      sessionsAnalyzed: 0,
      timeInOptimalZone: 0,
      timeOverloaded: 0,
      breaksTaken: 0
    };
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    collection(db, COLLECTIONS.SESSION_METRICS),
    where('userId', '==', userId),
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    orderBy('startTime', 'desc')
  );

  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(doc => doc.data());

  if (sessions.length === 0) {
    return {
      averageLoad: 0,
      sessionsAnalyzed: 0,
      timeInOptimalZone: 0,
      timeOverloaded: 0,
      breaksTaken: 0
    };
  }

  // Calculate aggregates
  const totalLoad = sessions.reduce((sum, s) => sum + s.averageLoad, 0);
  const averageLoad = totalLoad / sessions.length;

  // Time in each zone (approximate)
  const totalTime = sessions.reduce((sum, s) => sum + s.totalFocusTime, 0);
  const optimalSessions = sessions.filter(s => s.averageLoad >= 40 && s.averageLoad <= 70);
  const timeInOptimalZone = optimalSessions.reduce((sum, s) => sum + s.totalFocusTime, 0);

  const overloadedSessions = sessions.filter(s => s.averageLoad > 70);
  const timeOverloaded = overloadedSessions.reduce((sum, s) => sum + s.totalFocusTime, 0);

  const breaksTaken = sessions.reduce((sum, s) => sum + s.breaksTaken, 0);

  return {
    averageLoad: Math.round(averageLoad),
    sessionsAnalyzed: sessions.length,
    timeInOptimalZone: Math.round(timeInOptimalZone / 60000), // minutes
    timeOverloaded: Math.round(timeOverloaded / 60000), // minutes
    breaksTaken: breaksTaken
  };
}

// ===== EXPORTS =====

export default {
  CognitiveLoadTracker,
  getAdaptiveAIPrompt,
  shouldSuggestBreak,
  getCognitiveLoadStats,
  LOAD_ZONES
};
