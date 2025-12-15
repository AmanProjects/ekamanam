/**
 * 🔮 AI Doubt Prediction Service
 *
 * Predicts which concepts will confuse students BEFORE they encounter them.
 * Uses crowdsourced doubt data and AI concept extraction.
 *
 * Key Features:
 * - Proactive confusion detection
 * - Crowdsourced doubt library
 * - Concept extraction from pages
 * - Confusion rate calculation
 * - Pre-emptive explanations
 * - Community voting on doubts
 *
 * @version 5.4.0
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
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { callLLM } from './llmService';

// ===== CONSTANTS =====

const COLLECTIONS = {
  DOUBT_HOTSPOTS: 'doubtHotspots',
  USER_DOUBTS: 'userDoubts',
  DOUBT_SUBMISSIONS: 'doubtSubmissions'
};

const CONFUSION_THRESHOLD = 0.6; // 60% of students confused = hotspot

// ===== CONCEPT EXTRACTION =====

/**
 * Extract key concepts from page text using AI
 */
export async function extractConcepts(pageText) {
  if (!pageText || pageText.trim().length < 100) {
    return [];
  }

  const prompt = `Extract the 3-5 most important concepts/terms from this educational text.
Return ONLY a JSON array of strings (no explanations):

Text:
${pageText.substring(0, 2000)}

Example response:
["Photosynthesis", "Chlorophyll", "Glucose production"]

Your response (JSON array only):`;

  try {
    const response = await callLLM(prompt, {
      feature: 'concept_extraction',
      temperature: 0.2,
      maxTokens: 200
    });

    const concepts = JSON.parse(response);

    if (!Array.isArray(concepts)) {
      throw new Error('Invalid response format');
    }

    console.log(`✅ Extracted ${concepts.length} concepts`);
    return concepts;

  } catch (error) {
    console.error('❌ Concept extraction failed:', error);
    return [];
  }
}

// ===== DOUBT HOTSPOT MANAGEMENT =====

/**
 * Get doubt hotspot for a specific concept
 */
export async function getDoubtHotspot(concept) {
  if (!db) return null;

  const conceptId = concept.toLowerCase().replace(/\s+/g, '_');
  const hotspotDoc = await getDoc(doc(db, COLLECTIONS.DOUBT_HOTSPOTS, conceptId));

  if (!hotspotDoc.exists()) return null;

  return { id: hotspotDoc.id, ...hotspotDoc.data() };
}

/**
 * Create or update doubt hotspot
 */
export async function updateDoubtHotspot(concept, doubtData) {
  if (!db) return;

  const conceptId = concept.toLowerCase().replace(/\s+/g, '_');
  const hotspotRef = doc(db, COLLECTIONS.DOUBT_HOTSPOTS, conceptId);

  const existingHotspot = await getDoc(hotspotRef);

  if (existingHotspot.exists()) {
    // Update existing
    const data = existingHotspot.data();
    const newTotalStudents = data.totalStudents + 1;
    const newConfusedStudents = data.confusedStudents + (doubtData.wasConfused ? 1 : 0);
    const newConfusionRate = newConfusedStudents / newTotalStudents;

    // Add new doubt to list if provided
    if (doubtData.doubtQuestion) {
      const existingDoubt = data.commonDoubts.find(d => d.question === doubtData.doubtQuestion);

      if (existingDoubt) {
        // Increment upvotes
        existingDoubt.upvotes += 1;
      } else {
        // Add new doubt
        data.commonDoubts.push({
          question: doubtData.doubtQuestion,
          upvotes: 1,
          answeredBy: 'ai',
          answer: doubtData.answer || null
        });
      }

      // Sort by upvotes
      data.commonDoubts.sort((a, b) => b.upvotes - a.upvotes);

      // Keep top 10
      data.commonDoubts = data.commonDoubts.slice(0, 10);
    }

    await updateDoc(hotspotRef, {
      totalStudents: newTotalStudents,
      confusedStudents: newConfusedStudents,
      confusionRate: newConfusionRate,
      commonDoubts: data.commonDoubts,
      lastUpdated: Timestamp.now()
    });

    console.log(`✅ Updated hotspot: ${concept} (Confusion: ${Math.round(newConfusionRate * 100)}%)`);

  } else {
    // Create new hotspot
    await setDoc(hotspotRef, {
      concept: concept,
      conceptId: conceptId,
      totalStudents: 1,
      confusedStudents: doubtData.wasConfused ? 1 : 0,
      confusionRate: doubtData.wasConfused ? 1.0 : 0,
      commonDoubts: doubtData.doubtQuestion ? [
        {
          question: doubtData.doubtQuestion,
          upvotes: 1,
          answeredBy: 'ai',
          answer: doubtData.answer || null
        }
      ] : [],
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    });

    console.log(`✅ Created new hotspot: ${concept}`);
  }
}

// ===== DOUBT PREDICTION =====

/**
 * Predict which concepts on the page will confuse the student
 */
export async function predictDoubts(pageText, userId) {
  // Extract concepts from page
  const concepts = await extractConcepts(pageText);

  if (concepts.length === 0) {
    return [];
  }

  // Check confusion rate for each concept
  const hotspots = [];

  for (const concept of concepts) {
    const hotspot = await getDoubtHotspot(concept);

    if (hotspot && hotspot.confusionRate >= CONFUSION_THRESHOLD) {
      hotspots.push({
        concept: concept,
        confusionRate: hotspot.confusionRate,
        commonDoubts: hotspot.commonDoubts.slice(0, 3), // Top 3 doubts
        totalStudents: hotspot.totalStudents
      });
    }
  }

  // Sort by confusion rate (highest first)
  hotspots.sort((a, b) => b.confusionRate - a.confusionRate);

  console.log(`🔮 Predicted ${hotspots.length} confusion hotspots`);

  return hotspots;
}

/**
 * Generate pre-emptive AI explanation for confusing concepts
 */
export async function generatePreEmptiveExplanation(concept, commonDoubts) {
  const doubtsList = commonDoubts.map(d => `- ${d.question}`).join('\n');

  const prompt = `A student is about to study the concept: "${concept}"

Previous students had these doubts:
${doubtsList}

Provide a clear, pre-emptive explanation that addresses these common confusions BEFORE the student encounters them.

Format your response as:
1. Quick Overview (2-3 sentences)
2. Common Confusion Points (address each doubt)
3. Simple Analogy
4. Key Takeaway

Make it friendly and encouraging!`;

  try {
    const explanation = await callLLM(prompt, {
      feature: 'doubt_prediction',
      temperature: 0.7,
      maxTokens: 800
    });

    return explanation;
  } catch (error) {
    console.error('Error generating pre-emptive explanation:', error);
    return null;
  }
}

// ===== USER DOUBT SUBMISSION =====

/**
 * Record a user's doubt (for crowdsourcing)
 */
export async function submitDoubt(userId, concept, doubtQuestion, pageNumber, chapter) {
  if (!userId || !db) return;

  const doubtId = `${userId}_${Date.now()}`;

  const doubt = {
    userId: userId,
    concept: concept,
    question: doubtQuestion,
    pageNumber: pageNumber,
    chapter: chapter,
    upvotes: 0,
    downvotes: 0,
    resolved: false,
    answer: null,
    submittedAt: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.USER_DOUBTS, doubtId), doubt);

  // Update hotspot
  await updateDoubtHotspot(concept, {
    wasConfused: true,
    doubtQuestion: doubtQuestion,
    answer: null
  });

  console.log(`✅ Doubt submitted: ${concept} - ${doubtQuestion}`);

  return { id: doubtId, ...doubt };
}

/**
 * Upvote a doubt (indicates relevance)
 */
export async function upvoteDoubt(doubtId) {
  if (!db) return;

  const doubtRef = doc(db, COLLECTIONS.USER_DOUBTS, doubtId);
  await updateDoc(doubtRef, {
    upvotes: increment(1)
  });

  console.log(`👍 Upvoted doubt: ${doubtId}`);
}

/**
 * Get answer for a doubt (AI-generated or community)
 */
export async function getDoubtAnswer(doubtQuestion, concept, chapter) {
  const prompt = `A student studying "${chapter}" is confused about "${concept}".

Their question: "${doubtQuestion}"

Provide a clear, concise answer (3-4 sentences). Use simple language and include an analogy if helpful.`;

  try {
    const answer = await callLLM(prompt, {
      feature: 'doubt_answer',
      temperature: 0.7,
      maxTokens: 300
    });

    return answer;
  } catch (error) {
    console.error('Error generating doubt answer:', error);
    return 'Sorry, I couldn\'t generate an answer. Please try rephrasing your question.';
  }
}

// ===== DOUBT LIBRARY =====

/**
 * Get popular doubts for a chapter
 */
export async function getPopularDoubts(chapter, limitCount = 10) {
  if (!db) return [];

  const q = query(
    collection(db, COLLECTIONS.USER_DOUBTS),
    where('chapter', '==', chapter),
    orderBy('upvotes', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get all hotspots for a subject/chapter
 */
export async function getHotspotsForChapter(chapterKeywords) {
  if (!db) return [];

  const q = query(
    collection(db, COLLECTIONS.DOUBT_HOTSPOTS),
    where('confusionRate', '>=', CONFUSION_THRESHOLD),
    orderBy('confusionRate', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);
  const allHotspots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filter by chapter keywords (basic text matching)
  const filtered = allHotspots.filter(h =>
    chapterKeywords.some(keyword =>
      h.concept.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  return filtered;
}

// ===== ANALYTICS =====

/**
 * Get doubt prediction statistics
 */
export async function getDoubtStats() {
  if (!db) return { totalHotspots: 0, totalDoubts: 0, avgConfusionRate: 0 };

  // Get all hotspots
  const hotspotsSnapshot = await getDocs(collection(db, COLLECTIONS.DOUBT_HOTSPOTS));
  const hotspots = hotspotsSnapshot.docs.map(doc => doc.data());

  // Get total doubts
  const doubtsSnapshot = await getDocs(collection(db, COLLECTIONS.USER_DOUBTS));
  const totalDoubts = doubtsSnapshot.size;

  // Calculate average confusion rate
  const totalConfusion = hotspots.reduce((sum, h) => sum + h.confusionRate, 0);
  const avgConfusionRate = hotspots.length > 0 ? totalConfusion / hotspots.length : 0;

  return {
    totalHotspots: hotspots.length,
    totalDoubts: totalDoubts,
    avgConfusionRate: Math.round(avgConfusionRate * 100),
    topHotspots: hotspots
      .sort((a, b) => b.confusionRate - a.confusionRate)
      .slice(0, 5)
  };
}

// ===== EXPORTS =====

export default {
  extractConcepts,
  getDoubtHotspot,
  updateDoubtHotspot,
  predictDoubts,
  generatePreEmptiveExplanation,
  submitDoubt,
  upvoteDoubt,
  getDoubtAnswer,
  getPopularDoubts,
  getHotspotsForChapter,
  getDoubtStats
};
