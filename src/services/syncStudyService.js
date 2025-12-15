/**
 * 🔄 Sync Study Service - Multi-Student Real-Time Collaboration
 *
 * Enables multiple students to study together in real-time with synchronized:
 * - PDF navigation
 * - AI queries and answers
 * - Annotations and highlights
 * - Voice/text chat
 *
 * Key Features:
 * - Real-time room management
 * - Synchronized page navigation
 * - Shared AI assistance
 * - Collaborative annotations
 * - Turn-taking system
 * - Session recording
 *
 * @version 6.0.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ===== CONSTANTS =====

const COLLECTIONS = {
  STUDY_ROOMS: 'studyRooms',
  ROOM_MEMBERS: 'roomMembers',
  ROOM_EVENTS: 'roomEvents',
  ROOM_CHAT: 'roomChat',
  ROOM_ANNOTATIONS: 'roomAnnotations'
};

const ROOM_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended'
};

const EVENT_TYPES = {
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  PAGE_CHANGED: 'page_changed',
  AI_QUERY: 'ai_query',
  ANNOTATION_ADDED: 'annotation_added',
  HOST_CHANGED: 'host_changed',
  ROOM_PAUSED: 'room_paused',
  ROOM_RESUMED: 'room_resumed'
};

// ===== STUDY ROOM MANAGEMENT =====

/**
 * Create a study room
 */
export async function createStudyRoom(hostUserId, roomName, pdfName, chapter, maxMembers = 5, isPrivate = false) {
  if (!hostUserId || !db) return null;

  const roomId = `room_${Date.now()}`;

  const room = {
    id: roomId,
    name: roomName,
    hostUserId: hostUserId,
    pdfName: pdfName,
    chapter: chapter,
    currentPage: 1,
    maxMembers: maxMembers,
    isPrivate: isPrivate,
    status: ROOM_STATUS.WAITING,
    members: [hostUserId],
    memberCount: 1,
    allowedUsers: isPrivate ? [hostUserId] : [],
    settings: {
      syncNavigation: true,
      syncAI: true,
      allowAnnotations: true,
      allowChat: true,
      hostControlOnly: false
    },
    createdAt: Timestamp.now(),
    startedAt: null,
    endedAt: null,
    lastActivity: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.STUDY_ROOMS, roomId), room);

  console.log(`✅ Study room created: ${roomName} (${roomId})`);

  return room;
}

/**
 * Join a study room
 */
export async function joinStudyRoom(userId, roomId, userName) {
  if (!userId || !roomId || !db) return null;

  const roomRef = doc(db, COLLECTIONS.STUDY_ROOMS, roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) {
    throw new Error('Room not found');
  }

  const room = roomDoc.data();

  // Check if room is full
  if (room.memberCount >= room.maxMembers) {
    throw new Error('Room is full');
  }

  // Check if private and user is allowed
  if (room.isPrivate && !room.allowedUsers.includes(userId)) {
    throw new Error('Room is private');
  }

  // Add member
  await updateDoc(roomRef, {
    members: arrayUnion(userId),
    memberCount: room.memberCount + 1,
    lastActivity: Timestamp.now()
  });

  // Create member document
  const memberData = {
    roomId: roomId,
    userId: userId,
    userName: userName,
    currentPage: room.currentPage,
    joinedAt: Timestamp.now(),
    isActive: true
  };

  await setDoc(doc(db, COLLECTIONS.ROOM_MEMBERS, `${roomId}_${userId}`), memberData);

  // Record event
  await recordRoomEvent(roomId, EVENT_TYPES.MEMBER_JOINED, {
    userId: userId,
    userName: userName
  });

  console.log(`✅ User joined room: ${userId} → ${roomId}`);

  return room;
}

/**
 * Leave a study room
 */
export async function leaveStudyRoom(userId, roomId) {
  if (!userId || !roomId || !db) return;

  const roomRef = doc(db, COLLECTIONS.STUDY_ROOMS, roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) return;

  const room = roomDoc.data();

  // Remove member
  await updateDoc(roomRef, {
    members: arrayRemove(userId),
    memberCount: room.memberCount - 1,
    lastActivity: Timestamp.now()
  });

  // Delete member document
  await deleteDoc(doc(db, COLLECTIONS.ROOM_MEMBERS, `${roomId}_${userId}`));

  // If host left, assign new host
  if (room.hostUserId === userId && room.members.length > 1) {
    const newHost = room.members.find(id => id !== userId);
    await updateDoc(roomRef, {
      hostUserId: newHost
    });

    await recordRoomEvent(roomId, EVENT_TYPES.HOST_CHANGED, {
      oldHost: userId,
      newHost: newHost
    });
  }

  // If no members left, end room
  if (room.memberCount <= 1) {
    await endStudyRoom(roomId);
  }

  // Record event
  await recordRoomEvent(roomId, EVENT_TYPES.MEMBER_LEFT, {
    userId: userId
  });

  console.log(`✅ User left room: ${userId} ← ${roomId}`);
}

/**
 * End a study room
 */
export async function endStudyRoom(roomId) {
  if (!roomId || !db) return;

  const roomRef = doc(db, COLLECTIONS.STUDY_ROOMS, roomId);

  await updateDoc(roomRef, {
    status: ROOM_STATUS.ENDED,
    endedAt: Timestamp.now()
  });

  console.log(`✅ Study room ended: ${roomId}`);
}

// ===== SYNCHRONIZED NAVIGATION =====

/**
 * Change current page (synced to all members)
 */
export async function changeRoomPage(roomId, userId, newPage) {
  if (!roomId || !userId || !db) return;

  const roomRef = doc(db, COLLECTIONS.STUDY_ROOMS, roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) return;

  const room = roomDoc.data();

  // Check if host control only
  if (room.settings.hostControlOnly && room.hostUserId !== userId) {
    throw new Error('Only host can change pages');
  }

  // Update room page
  await updateDoc(roomRef, {
    currentPage: newPage,
    lastActivity: Timestamp.now()
  });

  // Record event
  await recordRoomEvent(roomId, EVENT_TYPES.PAGE_CHANGED, {
    userId: userId,
    oldPage: room.currentPage,
    newPage: newPage
  });

  console.log(`✅ Room page changed: ${roomId} → Page ${newPage}`);
}

/**
 * Subscribe to room updates (real-time)
 */
export function subscribeToRoom(roomId, callback) {
  if (!roomId || !db) return () => {};

  const roomRef = doc(db, COLLECTIONS.STUDY_ROOMS, roomId);

  const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() });
    }
  });

  return unsubscribe;
}

/**
 * Subscribe to room members (real-time)
 */
export function subscribeToRoomMembers(roomId, callback) {
  if (!roomId || !db) return () => {};

  const q = query(
    collection(db, COLLECTIONS.ROOM_MEMBERS),
    where('roomId', '==', roomId),
    where('isActive', '==', true)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(members);
  });

  return unsubscribe;
}

// ===== SHARED AI ASSISTANCE =====

/**
 * Submit AI query to room (visible to all members)
 */
export async function submitRoomAIQuery(roomId, userId, userName, queryType, queryText, pageNumber) {
  if (!roomId || !userId || !db) return;

  // Record event
  await recordRoomEvent(roomId, EVENT_TYPES.AI_QUERY, {
    userId: userId,
    userName: userName,
    queryType: queryType,
    queryText: queryText,
    pageNumber: pageNumber
  });

  console.log(`✅ AI query submitted to room: ${roomId}`);
}

/**
 * Get room AI queries
 */
export async function getRoomAIQueries(roomId, limitCount = 20) {
  if (!roomId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.ROOM_EVENTS),
    where('roomId', '==', roomId),
    where('eventType', '==', EVENT_TYPES.AI_QUERY),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== COLLABORATIVE ANNOTATIONS =====

/**
 * Add annotation (visible to all members)
 */
export async function addRoomAnnotation(roomId, userId, userName, pageNumber, annotation) {
  if (!roomId || !userId || !db) return;

  const annotationId = `${roomId}_${userId}_${Date.now()}`;

  const annotationData = {
    id: annotationId,
    roomId: roomId,
    userId: userId,
    userName: userName,
    pageNumber: pageNumber,
    type: annotation.type, // 'highlight', 'note', 'drawing'
    content: annotation.content,
    position: annotation.position, // { x, y, width, height }
    color: annotation.color || '#FFEB3B',
    createdAt: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.ROOM_ANNOTATIONS, annotationId), annotationData);

  // Record event
  await recordRoomEvent(roomId, EVENT_TYPES.ANNOTATION_ADDED, {
    userId: userId,
    userName: userName,
    pageNumber: pageNumber,
    annotationType: annotation.type
  });

  console.log(`✅ Annotation added to room: ${roomId}`);

  return annotationData;
}

/**
 * Get room annotations for a page
 */
export async function getRoomAnnotations(roomId, pageNumber) {
  if (!roomId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.ROOM_ANNOTATIONS),
    where('roomId', '==', roomId),
    where('pageNumber', '==', pageNumber),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Subscribe to room annotations (real-time)
 */
export function subscribeToRoomAnnotations(roomId, pageNumber, callback) {
  if (!roomId || !db) return () => {};

  const q = query(
    collection(db, COLLECTIONS.ROOM_ANNOTATIONS),
    where('roomId', '==', roomId),
    where('pageNumber', '==', pageNumber)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const annotations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(annotations);
  });

  return unsubscribe;
}

// ===== CHAT SYSTEM =====

/**
 * Send chat message
 */
export async function sendRoomChatMessage(roomId, userId, userName, message) {
  if (!roomId || !userId || !db) return;

  const messageId = `${roomId}_${Date.now()}`;

  const messageData = {
    id: messageId,
    roomId: roomId,
    userId: userId,
    userName: userName,
    message: message,
    createdAt: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.ROOM_CHAT, messageId), messageData);

  console.log(`✅ Chat message sent: ${roomId}`);

  return messageData;
}

/**
 * Subscribe to room chat (real-time)
 */
export function subscribeToRoomChat(roomId, callback) {
  if (!roomId || !db) return () => {};

  const q = query(
    collection(db, COLLECTIONS.ROOM_CHAT),
    where('roomId', '==', roomId),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });

  return unsubscribe;
}

// ===== ROOM EVENTS =====

/**
 * Record room event
 */
async function recordRoomEvent(roomId, eventType, eventData) {
  if (!roomId || !db) return;

  const eventId = `${roomId}_${Date.now()}`;

  const event = {
    id: eventId,
    roomId: roomId,
    eventType: eventType,
    eventData: eventData,
    timestamp: Timestamp.now()
  };

  await setDoc(doc(db, COLLECTIONS.ROOM_EVENTS, eventId), event);
}

/**
 * Get room events (for session replay)
 */
export async function getRoomEvents(roomId, limitCount = 100) {
  if (!roomId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.ROOM_EVENTS),
    where('roomId', '==', roomId),
    orderBy('timestamp', 'asc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== ROOM DISCOVERY =====

/**
 * Get available public rooms
 */
export async function getAvailableRooms(chapter, limitCount = 10) {
  if (!db) return [];

  const q = query(
    collection(db, COLLECTIONS.STUDY_ROOMS),
    where('isPrivate', '==', false),
    where('status', '==', ROOM_STATUS.ACTIVE),
    where('chapter', '==', chapter),
    orderBy('lastActivity', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get user's active rooms
 */
export async function getUserActiveRooms(userId) {
  if (!userId || !db) return [];

  const q = query(
    collection(db, COLLECTIONS.STUDY_ROOMS),
    where('members', 'array-contains', userId),
    where('status', '!=', ROOM_STATUS.ENDED),
    orderBy('status'),
    orderBy('lastActivity', 'desc'),
    limit(10)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ===== ROOM SETTINGS =====

/**
 * Update room settings (host only)
 */
export async function updateRoomSettings(roomId, userId, settings) {
  if (!roomId || !userId || !db) return;

  const roomRef = doc(db, COLLECTIONS.STUDY_ROOMS, roomId);
  const roomDoc = await getDoc(roomRef);

  if (!roomDoc.exists()) return;

  const room = roomDoc.data();

  // Check if user is host
  if (room.hostUserId !== userId) {
    throw new Error('Only host can update settings');
  }

  await updateDoc(roomRef, {
    settings: { ...room.settings, ...settings },
    lastActivity: Timestamp.now()
  });

  console.log(`✅ Room settings updated: ${roomId}`);
}

// ===== ANALYTICS =====

/**
 * Get room statistics
 */
export async function getRoomStats(roomId) {
  if (!roomId || !db) return null;

  const roomDoc = await getDoc(doc(db, COLLECTIONS.STUDY_ROOMS, roomId));

  if (!roomDoc.exists()) return null;

  const room = roomDoc.data();

  // Get event counts
  const eventsSnapshot = await getDocs(
    collection(db, COLLECTIONS.ROOM_EVENTS),
    where('roomId', '==', roomId)
  );

  const events = eventsSnapshot.docs.map(doc => doc.data());

  const aiQueries = events.filter(e => e.eventType === EVENT_TYPES.AI_QUERY).length;
  const annotations = events.filter(e => e.eventType === EVENT_TYPES.ANNOTATION_ADDED).length;
  const pageChanges = events.filter(e => e.eventType === EVENT_TYPES.PAGE_CHANGED).length;

  const duration = room.endedAt
    ? room.endedAt.toMillis() - room.startedAt.toMillis()
    : Date.now() - room.createdAt.toMillis();

  return {
    roomId: roomId,
    roomName: room.name,
    duration: Math.round(duration / 60000), // minutes
    maxMembers: room.memberCount,
    totalEvents: events.length,
    aiQueries: aiQueries,
    annotations: annotations,
    pageChanges: pageChanges,
    status: room.status
  };
}

// ===== EXPORTS =====

export default {
  createStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  endStudyRoom,
  changeRoomPage,
  subscribeToRoom,
  subscribeToRoomMembers,
  submitRoomAIQuery,
  getRoomAIQueries,
  addRoomAnnotation,
  getRoomAnnotations,
  subscribeToRoomAnnotations,
  sendRoomChatMessage,
  subscribeToRoomChat,
  getRoomEvents,
  getAvailableRooms,
  getUserActiveRooms,
  updateRoomSettings,
  getRoomStats,
  ROOM_STATUS,
  EVENT_TYPES
};
