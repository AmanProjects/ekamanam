/**
 * 🤝 Peer Learning Network Service
 *
 * Matches students with complementary knowledge for peer learning.
 * Creates knowledge graphs and skill-based matching algorithms.
 *
 * Key Features:
 * - Knowledge profile creation
 * - Skill-based peer matching
 * - Peer chat and collaboration
 * - Reputation system
 * - Learning circles
 *
 * @version 5.6.0
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
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ===== CONSTANTS =====

const COLLECTIONS = {
  USER_PROFILES: 'userProfiles',
  KNOWLEDGE_GRAPHS: 'knowledgeGraphs',
  PEER_MATCHES: 'peerMatches',
  PEER_REQUESTS: 'peerRequests',
  LEARNING_CIRCLES: 'learningCircles',
  PEER_MESSAGES: 'peerMessages'
};

const SKILL_LEVELS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4
};

const MATCH_TYPES = {
  HELPER: 'helper', // Someone who can help you
  PEER: 'peer', // Someone at your level
  LEARNER: 'learner' // Someone you can help
};

// ===== KNOWLEDGE PROFILE =====

/**
 * Create or update user's knowledge profile
 */
export async function updateKnowledgeProfile(userId, updates) {
  if (!userId || !db) return;

  const profileRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const existingProfile = await getDoc(profileRef);

  if (existingProfile.exists()) {
    await updateDoc(profileRef, {
      ...updates,
      lastUpdated: Timestamp.now()
    });
  } else {
    await setDoc(profileRef, {
      userId: userId,
      subjects: [],
      concepts: {},
      strengths: [],
      weaknesses: [],
      learningGoals: [],
      helpingAvailability: true,
      reputation: 0,
      helpedCount: 0,
      receivedHelpCount: 0,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      ...updates
    });
  }

  console.log(`✅ Knowledge profile updated for user: ${userId}`);
}

/**
 * Add concept mastery to profile
 */
export async function addConceptMastery(userId, concept, subject, skillLevel) {
  if (!userId || !db) return;

  const profileRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const profile = await getDoc(profileRef);

  if (!profile.exists()) {
    // Create profile first
    await updateKnowledgeProfile(userId, {});
  }

  const data = profile.exists() ? profile.data() : {};
  const concepts = data.concepts || {};

  // Update concept skill level
  concepts[concept] = {
    subject: subject,
    skillLevel: skillLevel,
    masteredAt: Timestamp.now(),
    confidenceScore: skillLevel * 25 // 1=25, 2=50, 3=75, 4=100
  };

  // Update strengths (concepts with skill level 3+)
  const strengths = Object.entries(concepts)
    .filter(([_, data]) => data.skillLevel >= SKILL_LEVELS.ADVANCED)
    .map(([concept, _]) => concept);

  // Update weaknesses (concepts with skill level 1-2)
  const weaknesses = Object.entries(concepts)
    .filter(([_, data]) => data.skillLevel <= SKILL_LEVELS.INTERMEDIATE)
    .map(([concept, _]) => concept);

  await updateDoc(profileRef, {
    concepts: concepts,
    strengths: strengths,
    weaknesses: weaknesses,
    lastUpdated: Timestamp.now()
  });

  console.log(`✅ Concept mastery added: ${concept} (Level ${skillLevel})`);
}

/**
 * Update concept skill level based on performance
 */
export async function updateConceptSkillLevel(userId, concept, performanceScore) {
  if (!userId || !db) return;

  const profileRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const profile = await getDoc(profileRef);

  if (!profile.exists()) return;

  const concepts = profile.data().concepts || {};
  const conceptData = concepts[concept];

  if (!conceptData) return;

  // Calculate new skill level based on performance
  let newSkillLevel = conceptData.skillLevel;

  if (performanceScore >= 90 && conceptData.skillLevel < SKILL_LEVELS.EXPERT) {
    newSkillLevel = conceptData.skillLevel + 1;
  } else if (performanceScore < 60 && conceptData.skillLevel > SKILL_LEVELS.BEGINNER) {
    newSkillLevel = conceptData.skillLevel - 1;
  }

  if (newSkillLevel !== conceptData.skillLevel) {
    concepts[concept].skillLevel = newSkillLevel;
    concepts[concept].confidenceScore = Math.min(100, performanceScore);

    await updateDoc(profileRef, {
      concepts: concepts,
      lastUpdated: Timestamp.now()
    });

    console.log(`✅ Skill level updated: ${concept} → Level ${newSkillLevel}`);
  }
}

// ===== PEER MATCHING =====

/**
 * Find peer matches for a user
 */
export async function findPeerMatches(userId, subject, concept) {
  if (!userId || !db) return { helpers: [], peers: [], learners: [] };

  // Get user's profile
  const userProfile = await getDoc(doc(db, COLLECTIONS.USER_PROFILES, userId));

  if (!userProfile.exists()) {
    return { helpers: [], peers: [], learners: [] };
  }

  const userData = userProfile.data();
  const userSkillLevel = userData.concepts?.[concept]?.skillLevel || SKILL_LEVELS.BEGINNER;

  // Query all users with this concept
  const q = query(
    collection(db, COLLECTIONS.USER_PROFILES),
    where('helpingAvailability', '==', true)
  );

  const snapshot = await getDocs(q);
  const allUsers = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => user.id !== userId); // Exclude self

  // Categorize matches
  const helpers = [];
  const peers = [];
  const learners = [];

  for (const user of allUsers) {
    const userConceptData = user.concepts?.[concept];

    if (!userConceptData) continue;

    const theirSkillLevel = userConceptData.skillLevel;
    const skillDifference = theirSkillLevel - userSkillLevel;

    // Calculate match score (0-100)
    const matchScore = calculateMatchScore(userData, user, concept);

    const match = {
      userId: user.id,
      userName: user.userName || 'Anonymous',
      userAvatar: user.userAvatar || null,
      skillLevel: theirSkillLevel,
      confidenceScore: userConceptData.confidenceScore || 0,
      reputation: user.reputation || 0,
      helpedCount: user.helpedCount || 0,
      matchScore: matchScore,
      commonStrengths: getCommonConcepts(userData.strengths || [], user.strengths || []),
      commonGoals: getCommonConcepts(userData.learningGoals || [], user.learningGoals || [])
    };

    // Categorize by skill difference
    if (skillDifference >= 1) {
      // They can help you
      helpers.push(match);
    } else if (skillDifference === 0) {
      // Same level - peer learning
      peers.push(match);
    } else {
      // You can help them
      learners.push(match);
    }
  }

  // Sort by match score
  helpers.sort((a, b) => b.matchScore - a.matchScore);
  peers.sort((a, b) => b.matchScore - a.matchScore);
  learners.sort((a, b) => b.matchScore - a.matchScore);

  // Limit results
  return {
    helpers: helpers.slice(0, 5),
    peers: peers.slice(0, 5),
    learners: learners.slice(0, 5)
  };
}

/**
 * Calculate match score between two users
 */
function calculateMatchScore(user1, user2, concept) {
  let score = 0;

  // Factor 1: Common strengths (30%)
  const commonStrengths = getCommonConcepts(user1.strengths || [], user2.strengths || []);
  score += (commonStrengths.length / Math.max(user1.strengths?.length || 1, 1)) * 30;

  // Factor 2: Common goals (20%)
  const commonGoals = getCommonConcepts(user1.learningGoals || [], user2.learningGoals || []);
  score += (commonGoals.length / Math.max(user1.learningGoals?.length || 1, 1)) * 20;

  // Factor 3: Reputation (25%)
  score += Math.min((user2.reputation || 0) / 100, 1) * 25;

  // Factor 4: Helping history (15%)
  score += Math.min((user2.helpedCount || 0) / 20, 1) * 15;

  // Factor 5: Availability (10%)
  score += user2.helpingAvailability ? 10 : 0;

  return Math.round(score);
}

/**
 * Get common concepts between two arrays
 */
function getCommonConcepts(array1, array2) {
  return array1.filter(item => array2.includes(item));
}

// ===== PEER REQUESTS =====

/**
 * Send peer learning request
 */
export async function sendPeerRequest(fromUserId, toUserId, concept, message) {
  if (!fromUserId || !toUserId || !db) return;

  const requestId = `${fromUserId}_${toUserId}_${Date.now()}`;

  const request = {
    id: requestId,
    fromUserId: fromUserId,
    toUserId: toUserId,
    concept: concept,
    message: message,
    status: 'pending', // pending, accepted, declined
    createdAt: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.PEER_REQUESTS, requestId), request);

  console.log(`✅ Peer request sent: ${fromUserId} → ${toUserId}`);

  return request;
}

/**
 * Accept peer request
 */
export async function acceptPeerRequest(requestId) {
  if (!requestId || !db) return;

  const requestRef = doc(db, COLLECTIONS.PEER_REQUESTS, requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) return;

  const request = requestDoc.data();

  // Update request status
  await updateDoc(requestRef, {
    status: 'accepted',
    acceptedAt: Timestamp.now()
  });

  // Add to peer matches
  const matchId = `${request.fromUserId}_${request.toUserId}`;

  await setDoc(doc(db, COLLECTIONS.PEER_MATCHES, matchId), {
    user1Id: request.fromUserId,
    user2Id: request.toUserId,
    concept: request.concept,
    matchedAt: Timestamp.now(),
    lastInteraction: Timestamp.now(),
    interactionCount: 0
  });

  // Update reputation for helper
  await updateDoc(doc(db, COLLECTIONS.USER_PROFILES, request.toUserId), {
    helpedCount: increment(1),
    reputation: increment(5)
  });

  console.log(`✅ Peer request accepted: ${requestId}`);
}

/**
 * Get pending requests for a user
 */
export async function getPendingRequests(userId) {
  if (!userId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.PEER_REQUESTS),
    where('toUserId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== LEARNING CIRCLES =====

/**
 * Create a learning circle
 */
export async function createLearningCircle(creatorId, name, subject, concepts, maxMembers = 5) {
  if (!creatorId || !db) return;

  const circleId = `circle_${Date.now()}`;

  const circle = {
    id: circleId,
    name: name,
    subject: subject,
    concepts: concepts,
    creatorId: creatorId,
    members: [creatorId],
    maxMembers: maxMembers,
    createdAt: Timestamp.now(),
    lastActivity: Timestamp.now(),
    isActive: true
  };

  await setDoc(doc(db, COLLECTIONS.LEARNING_CIRCLES, circleId), circle);

  console.log(`✅ Learning circle created: ${name}`);

  return circle;
}

/**
 * Join a learning circle
 */
export async function joinLearningCircle(userId, circleId) {
  if (!userId || !circleId || !db) return;

  const circleRef = doc(db, COLLECTIONS.LEARNING_CIRCLES, circleId);
  const circle = await getDoc(circleRef);

  if (!circle.exists()) return;

  const circleData = circle.data();

  // Check if circle is full
  if (circleData.members.length >= circleData.maxMembers) {
    throw new Error('Learning circle is full');
  }

  // Add user to members
  await updateDoc(circleRef, {
    members: arrayUnion(userId),
    lastActivity: Timestamp.now()
  });

  console.log(`✅ User joined learning circle: ${circleId}`);
}

/**
 * Get available learning circles
 */
export async function getAvailableLearningCircles(subject, limitCount = 10) {
  if (!db) return [];

  const q = query(
    collection(db, COLLECTIONS.LEARNING_CIRCLES),
    where('subject', '==', subject),
    where('isActive', '==', true),
    orderBy('lastActivity', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== PEER MESSAGING =====

/**
 * Send peer message
 */
export async function sendPeerMessage(fromUserId, toUserId, message, concept) {
  if (!fromUserId || !toUserId || !db) return;

  const messageId = `${Date.now()}`;

  const messageData = {
    id: messageId,
    fromUserId: fromUserId,
    toUserId: toUserId,
    message: message,
    concept: concept,
    createdAt: Timestamp.now(),
    read: false
  };

  await setDoc(doc(db, COLLECTIONS.PEER_MESSAGES, messageId), messageData);

  console.log(`✅ Peer message sent: ${fromUserId} → ${toUserId}`);

  return messageData;
}

/**
 * Get peer messages
 */
export async function getPeerMessages(userId1, userId2, limitCount = 50) {
  if (!userId1 || !userId2 || !db) return [];

  // Get messages in both directions
  const q1 = query(
    collection(db, COLLECTIONS.PEER_MESSAGES),
    where('fromUserId', '==', userId1),
    where('toUserId', '==', userId2),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );

  const q2 = query(
    collection(db, COLLECTIONS.PEER_MESSAGES),
    where('fromUserId', '==', userId2),
    where('toUserId', '==', userId1),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const messages = [
    ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  ];

  // Sort by timestamp
  messages.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

  return messages;
}

// ===== ANALYTICS =====

/**
 * Get peer learning statistics
 */
export async function getPeerLearningStats(userId) {
  if (!userId || !db) return null;

  const profile = await getDoc(doc(db, COLLECTIONS.USER_PROFILES, userId));

  if (!profile.exists()) {
    return {
      reputation: 0,
      helpedCount: 0,
      receivedHelpCount: 0,
      totalConcepts: 0,
      strengths: 0,
      weaknesses: 0
    };
  }

  const data = profile.data();

  return {
    reputation: data.reputation || 0,
    helpedCount: data.helpedCount || 0,
    receivedHelpCount: data.receivedHelpCount || 0,
    totalConcepts: Object.keys(data.concepts || {}).length,
    strengths: data.strengths?.length || 0,
    weaknesses: data.weaknesses?.length || 0,
    expertConcepts: Object.values(data.concepts || {}).filter(c => c.skillLevel === SKILL_LEVELS.EXPERT).length
  };
}

// ===== EXPORTS =====

export default {
  updateKnowledgeProfile,
  addConceptMastery,
  updateConceptSkillLevel,
  findPeerMatches,
  sendPeerRequest,
  acceptPeerRequest,
  getPendingRequests,
  createLearningCircle,
  joinLearningCircle,
  getAvailableLearningCircles,
  sendPeerMessage,
  getPeerMessages,
  getPeerLearningStats,
  SKILL_LEVELS,
  MATCH_TYPES
};
