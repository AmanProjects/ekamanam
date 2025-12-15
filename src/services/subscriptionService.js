import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

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
      'Local notes'
    ],
    limits: {
      aiQueriesPerDay: 3,
      pdfStorageGB: 0.1,
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
      '⚡ Priority AI processing',
      '📚 Unlimited PDFs'
    ],
    limits: {
      aiQueriesPerDay: -1, // unlimited
      pdfStorageGB: 1,
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
export async function getUserSubscription(userId) {
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
      await initializeUserSubscription(userId);
      return {
        tier: 'FREE',
        status: 'active',
        features: SUBSCRIPTION_TIERS.FREE.limits
      };
    }

    const userData = userDoc.data();
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

// Initialize new user with FREE tier
async function initializeUserSubscription(userId) {
  if (!db) return;
  
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
export function subscribeToUserSubscription(userId, callback) {
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
        const subscription = docSnapshot.data().subscription || {
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
export async function trackAIQueryUsage(userId) {
  if (!userId || !db) return { allowed: true, remaining: -1 };

  try {
    // Get user's subscription
    const subscription = await getUserSubscription(userId);

    // Unlimited for paid tiers
    if (subscription.tier !== 'FREE') {
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
export async function getTodayUsage(userId) {
  if (!userId || !db) return { count: 0, limit: 5 };

  try {
    const subscription = await getUserSubscription(userId);
    
    // Unlimited for paid tiers
    if (subscription.tier !== 'FREE') {
      return { count: 0, limit: -1, unlimited: true };
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

