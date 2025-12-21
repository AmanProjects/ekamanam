import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import demoAccountsConfig from '../config/demoAccounts.json';

// Demo account configuration - hybrid system
// Priority 1: Firestore (admin-managed, live updates)
// Priority 2: JSON config (fallback, defaults)
let DEMO_EMAILS_FROM_FIRESTORE = [];
let DEMO_EMAILS_FROM_JSON = demoAccountsConfig.demoEmails || [];
const DEMO_SETTINGS = demoAccountsConfig.demoSettings || {};

// Load demo emails from Firestore on initialization
let firestoreLoaded = false;
let firestoreLoadPromise = null;

/**
 * Load demo accounts from Firestore (admin-managed)
 */
async function loadDemoAccountsFromFirestore() {
  if (!db) {
    console.log('📋 [Demo] Firestore not available, using JSON config only');
    return;
  }

  try {
    const demoDoc = await getDoc(doc(db, 'admin', 'demoAccounts'));
    
    if (demoDoc.exists()) {
      const data = demoDoc.data();
      DEMO_EMAILS_FROM_FIRESTORE = data.emails || [];
      console.log('📋 [Demo] Loaded from Firestore:', DEMO_EMAILS_FROM_FIRESTORE.length, 'accounts');
    } else {
      console.log('📋 [Demo] No Firestore config found, using JSON only');
    }
    
    firestoreLoaded = true;
  } catch (error) {
    console.error('❌ [Demo] Error loading from Firestore:', error);
    console.log('📋 [Demo] Falling back to JSON config');
  }
}

// Initialize Firestore loading
firestoreLoadPromise = loadDemoAccountsFromFirestore();

/**
 * Get all demo emails (merged from Firestore + JSON)
 * @returns {Array<string>} Combined list of demo emails
 */
function getAllDemoEmails() {
  // Merge Firestore and JSON, remove duplicates
  const allEmails = [...new Set([...DEMO_EMAILS_FROM_FIRESTORE, ...DEMO_EMAILS_FROM_JSON])];
  return allEmails;
}

/**
 * Check if user is demo account
 * Checks both Firestore (live) and JSON (fallback) sources
 * @param {string} userEmail - User's email address
 * @returns {boolean} True if user is demo account
 */
export function isDemoAccount(userEmail) {
  if (!userEmail) return false;
  
  const normalizedEmail = userEmail.toLowerCase().trim();
  
  // Get merged list from both sources
  const allDemoEmails = getAllDemoEmails();
  
  // Check against all demo emails
  const isDemo = allDemoEmails.some(demoEmail => 
    normalizedEmail === demoEmail.toLowerCase().trim()
  );
  
  if (isDemo) {
    const source = DEMO_EMAILS_FROM_FIRESTORE.includes(userEmail) ? 'Firestore' : 'JSON';
    console.log(`🎭 [Demo] Account detected from ${source}:`, userEmail);
  }
  
  return isDemo;
}

/**
 * Get list of all demo emails (for admin purposes)
 * @returns {Promise<Array<string>>} Array of demo email addresses
 */
export async function getDemoEmails() {
  // Wait for Firestore to load
  await firestoreLoadPromise;
  
  // Return merged list
  return [...getAllDemoEmails()]; // Return copy to prevent modification
}

/**
 * Refresh demo accounts from Firestore (call after admin changes)
 */
export async function refreshDemoAccounts() {
  console.log('🔄 [Demo] Refreshing demo accounts from Firestore...');
  await loadDemoAccountsFromFirestore();
  const allEmails = getAllDemoEmails();
  console.log('✅ [Demo] Refreshed. Total accounts:', allEmails.length);
  return allEmails;
}

/**
 * Get demo subscription (full access from config)
 * @returns {Object} Demo subscription with unlimited features
 */
export function getDemoSubscription() {
  const tier = DEMO_SETTINGS.tier || 'STUDENT';
  const displayName = DEMO_SETTINGS.displayName || 'Demo Account (Full Access)';
  const note = DEMO_SETTINGS.note || 'Demo account with unlimited access';
  
  return {
    tier: tier,
    status: 'active',
    features: SUBSCRIPTION_TIERS[tier]?.limits || SUBSCRIPTION_TIERS.STUDENT.limits,
    isDemo: true,
    displayName: displayName,
    createdAt: Timestamp.now(),
    currentPeriodEnd: DEMO_SETTINGS.expiryDate ? new Date(DEMO_SETTINGS.expiryDate) : null,
    allowUnlimitedQueries: DEMO_SETTINGS.allowUnlimitedQueries !== false,
    note: note,
    demoConfig: DEMO_SETTINGS // Store full config for reference
  };
}

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: 0,
    currency: '₹',
    billingPeriod: null,
    description: 'Perfect for trying out Ekamanam',
    features: [
      '3 AI queries per day',
      'Basic PDF viewing',
      'Text selection & highlights',
      'Sample PDFs included'
    ],
    limits: {
      aiQueriesPerDay: 3,
      advancedFeatures: false,
      cloudSync: false,
      prioritySupport: false
    },
    highlighted: false
  },
  
  STUDENT: {
    id: 'STUDENT',
    name: 'Student',
    price: 299,
    yearlyPrice: 2999,
    currency: '₹',
    billingPeriod: 'month',
    description: 'Unlimited learning for serious students',
    priceId: process.env.REACT_APP_STRIPE_PRICE_ID_STUDENT_MONTHLY || 'price_student_monthly_placeholder',
    yearlyPriceId: process.env.REACT_APP_STRIPE_PRICE_ID_STUDENT_YEARLY || 'price_student_yearly_placeholder',
    features: [
      '✨ Unlimited AI queries',
      '🎨 3D visualizations & chemistry models',
      '🗺️ Interactive maps',
      '🔊 Text-to-speech (multilingual)',
      '📱 Multi-device sync',
      '📚 Auto-generated flashcards',
      '📊 Learning analytics'
    ],
    limits: {
      aiQueriesPerDay: -1, // unlimited
      advancedFeatures: true,
      cloudSync: true,
      prioritySupport: false
    },
    highlighted: true,
    popular: true
  },
  
  EDUCATOR: {
    id: 'EDUCATOR',
    name: 'Educator',
    price: 1299,
    yearlyPrice: 12999,
    currency: '₹',
    billingPeriod: 'month',
    description: 'For teachers & schools',
    priceId: process.env.REACT_APP_STRIPE_PRICE_ID_EDUCATOR_MONTHLY || 'price_educator_monthly_placeholder',
    yearlyPriceId: process.env.REACT_APP_STRIPE_PRICE_ID_EDUCATOR_YEARLY || 'price_educator_yearly_placeholder',
    features: [
      '🎓 Everything in Student plan',
      '👥 Classroom management (50 students)',
      '📊 Student progress tracking',
      '📝 Custom quiz & assignments',
      '🏫 Institution branding',
      '📧 Priority email support',
      '📈 Advanced analytics'
    ],
    limits: {
      aiQueriesPerDay: -1,
      pdfStorageGB: 5,
      advancedFeatures: true,
      cloudSync: true,
      prioritySupport: true,
      classroomManagement: true,
      studentsManaged: 50
    },
    highlighted: false
  }
};

// Get user's current subscription
export async function getUserSubscription(userId, userEmail = null) {
  // Check for demo account first
  if (userEmail && isDemoAccount(userEmail)) {
    console.log('🎭 Demo account detected:', userEmail, '- Granting full access');
    return getDemoSubscription();
  }

  if (!userId || !db) {
    return {
      tier: 'FREE',
      status: 'active',
      features: SUBSCRIPTION_TIERS.FREE.limits
    };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      // New user - set up FREE tier
      await initializeUserSubscription(userId, userEmail);
      return {
        tier: 'FREE',
        status: 'active',
        features: SUBSCRIPTION_TIERS.FREE.limits
      };
    }

    const userData = userDoc.data();
    
    // Double-check for demo account from stored email
    if (userData.email && isDemoAccount(userData.email)) {
      console.log('🎭 Demo account detected from Firestore:', userData.email, '- Granting full access');
      return getDemoSubscription();
    }
    
    return userData.subscription || {
      tier: 'FREE',
      status: 'active',
      features: SUBSCRIPTION_TIERS.FREE.limits
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return {
      tier: 'FREE',
      status: 'active',
      features: SUBSCRIPTION_TIERS.FREE.limits
    };
  }
}

// Initialize new user with FREE tier (or STUDENT tier for demo)
async function initializeUserSubscription(userId, userEmail = null) {
  if (!db) return;
  
  // Check if this is a demo account
  if (userEmail && isDemoAccount(userEmail)) {
    console.log('🎭 Initializing demo account:', userEmail, '- Granting full access');
    try {
      await setDoc(doc(db, 'users', userId), {
        email: userEmail,
        subscription: getDemoSubscription()
      }, { merge: true });
      console.log('✅ Demo account initialized successfully:', userEmail);
    } catch (error) {
      console.error('Error initializing demo subscription:', error);
    }
    return;
  }
  
  // Regular user - initialize with FREE tier
  try {
    await setDoc(doc(db, 'users', userId), {
      subscription: {
        tier: 'FREE',
        status: 'active',
        features: SUBSCRIPTION_TIERS.FREE.limits,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    }, { merge: true });
    
    console.log('✅ Initialized FREE subscription for user:', userId);
  } catch (error) {
    console.error('Error initializing subscription:', error);
  }
}

// Subscribe to real-time subscription updates
export function subscribeToUserSubscription(userId, callback, userEmail = null) {
  // Check for demo account first
  if (userEmail && isDemoAccount(userEmail)) {
    console.log('🎭 Demo account detected:', userEmail, '- Providing unlimited access');
    callback(getDemoSubscription());
    return () => {}; // No-op unsubscribe for demo
  }

  if (!userId || !db) {
    callback({
      tier: 'FREE',
      status: 'active',
      features: SUBSCRIPTION_TIERS.FREE.limits
    });
    return () => {};
  }

  const unsubscribe = onSnapshot(
    doc(db, 'users', userId),
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        
        // Check for demo account from stored email
        if (userData.email && isDemoAccount(userData.email)) {
          console.log('🎭 Demo account detected from Firestore:', userData.email, '- Providing unlimited access');
          callback(getDemoSubscription());
          return;
        }
        
        const subscription = userData.subscription || {
          tier: 'FREE',
          status: 'active',
          features: SUBSCRIPTION_TIERS.FREE.limits
        };
        callback(subscription);
      } else {
        callback({
          tier: 'FREE',
          status: 'active',
          features: SUBSCRIPTION_TIERS.FREE.limits
        });
      }
    },
    (error) => {
      console.error('Error subscribing to subscription updates:', error);
      callback({
        tier: 'FREE',
        status: 'active',
        features: SUBSCRIPTION_TIERS.FREE.limits
      });
    }
  );

  return unsubscribe;
}

// Check if user can use a feature
export function canUseFeature(subscription, feature) {
  if (!subscription || !subscription.features) {
    return false;
  }

  const features = subscription.features;

  switch (feature) {
    case 'unlimited_ai':
      return features.aiQueriesPerDay === -1;
    case 'advanced_features':
      return features.advancedFeatures === true;
    case 'cloud_sync':
      return features.cloudSync === true;
    case 'priority_support':
      return features.prioritySupport === true;
    case 'classroom_management':
      return features.classroomManagement === true;
    default:
      return false;
  }
}

// Track AI query usage (for FREE tier rate limiting)
export async function trackAIQueryUsage(userId, userEmail = null) {
  if (!userId || !db) return { allowed: true, remaining: -1 };

  try {
    // Get user's subscription (will check for demo account)
    const subscription = await getUserSubscription(userId, userEmail);

    // Unlimited for paid tiers (including demo accounts)
    if (subscription.tier !== 'FREE' || subscription.isDemo) {
      console.log(`✅ Unlimited AI queries for ${subscription.isDemo ? 'demo account' : subscription.tier}`);
      return { allowed: true, remaining: -1 };
    }

    // Check today's usage for FREE tier
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const usageDocRef = doc(db, 'usage', `${userId}_${todayStr}`);
    const usageDoc = await getDoc(usageDocRef);

    let currentCount = 0;
    if (usageDoc.exists()) {
      currentCount = usageDoc.data().count || 0;
    }

    const limit = SUBSCRIPTION_TIERS.FREE.limits.aiQueriesPerDay;

    // Check if limit exceeded
    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit: limit,
        message: 'Daily AI query limit reached. Upgrade to Student plan for unlimited queries!'
      };
    }

    // Increment usage
    await setDoc(usageDocRef, {
      userId: userId,
      date: todayStr,
      count: currentCount + 1,
      lastUpdated: Timestamp.now()
    }, { merge: true });

    return {
      allowed: true,
      remaining: limit - (currentCount + 1),
      limit: limit
    };
  } catch (error) {
    console.error('Error tracking AI query usage:', error);
    // On error, allow the query (fail-open)
    return { allowed: true, remaining: -1 };
  }
}

// Get today's usage count
export async function getTodayUsage(userId, userEmail = null) {
  if (!userId || !db) return { count: 0, limit: 3 };

  try {
    const subscription = await getUserSubscription(userId, userEmail);

    // Unlimited for paid tiers (including demo accounts)
    if (subscription.tier !== 'FREE' || subscription.isDemo) {
      return { count: 0, limit: -1, unlimited: true, isDemo: subscription.isDemo };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const usageDocRef = doc(db, 'usage', `${userId}_${todayStr}`);
    const usageDoc = await getDoc(usageDocRef);

    const count = usageDoc.exists() ? (usageDoc.data().count || 0) : 0;
    const limit = SUBSCRIPTION_TIERS.FREE.limits.aiQueriesPerDay;

    return { count, limit, unlimited: false };
  } catch (error) {
    console.error('Error getting today usage:', error);
    return { count: 0, limit: 3, unlimited: false };
  }
}

// Create Stripe Checkout Session (calls Cloud Function)
export async function createCheckoutSession(priceId, userId, userEmail, tier, isYearly = false) {
  try {
    const functionUrl = process.env.REACT_APP_CLOUD_FUNCTION_URL || 
      'https://us-central1-ekamanam.cloudfunctions.net/createCheckoutSession';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        tier,
        isYearly
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create Customer Portal Session (for managing subscriptions)
export async function createPortalSession(customerId) {
  try {
    const functionUrl = process.env.REACT_APP_CLOUD_FUNCTION_URL_PORTAL || 
      'https://us-central1-ekamanam.cloudfunctions.net/createPortalSession';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

