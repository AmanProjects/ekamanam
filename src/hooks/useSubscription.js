import { useState, useEffect } from 'react';
import { 
  subscribeToUserSubscription, 
  canUseFeature, 
  getTodayUsage,
  SUBSCRIPTION_TIERS 
} from '../services/subscriptionService';

/**
 * React hook for managing user subscription state
 * @param {string} userId - The user's Firebase UID
 * @param {string} userEmail - The user's email (for demo account detection)
 * @returns {Object} Subscription state and helper functions
 */
export function useSubscription(userId, userEmail = null) {
  const [subscription, setSubscription] = useState({
    tier: 'FREE',
    status: 'active',
    features: SUBSCRIPTION_TIERS.FREE.limits,
    loading: true
  });
  const [usage, setUsage] = useState({ count: 0, limit: 3, unlimited: false });

  // Subscribe to real-time subscription updates
  useEffect(() => {
    if (!userId) {
      setSubscription({
        tier: 'FREE',
        status: 'active',
        features: SUBSCRIPTION_TIERS.FREE.limits,
        loading: false
      });
      return;
    }

    const unsubscribe = subscribeToUserSubscription(userId, (subscriptionData) => {
      setSubscription({
        ...subscriptionData,
        loading: false
      });
    }, userEmail);

    return () => unsubscribe();
  }, [userId, userEmail]);

  // Load today's usage
  useEffect(() => {
    if (!userId) return;

    const loadUsage = async () => {
      const usageData = await getTodayUsage(userId, userEmail);
      setUsage(usageData);
    };

    loadUsage();

    // Refresh usage every minute
    const interval = setInterval(loadUsage, 60000);
    return () => clearInterval(interval);
  }, [userId, userEmail, subscription.tier]);

  // Helper: Check if user can use a specific feature
  const hasFeature = (feature) => {
    return canUseFeature(subscription, feature);
  };

  // Helper: Check if user is on FREE tier
  const isFree = subscription.tier === 'FREE';

  // Helper: Check if user is on paid tier
  const isPaid = subscription.tier === 'STUDENT' || subscription.tier === 'EDUCATOR';

  // Helper: Check if user has active subscription
  const isActive = subscription.status === 'active';

  // Helper: Get tier details
  const tierDetails = SUBSCRIPTION_TIERS[subscription.tier] || SUBSCRIPTION_TIERS.FREE;

  // Helper: Check if limit reached
  const isLimitReached = isFree && usage.count >= usage.limit;

  // Helper: Get remaining queries
  const remainingQueries = isFree ? Math.max(0, usage.limit - usage.count) : -1;

  // Helper: Calculate days remaining for paid subscriptions
  const getDaysRemaining = () => {
    if (!isPaid || !subscription.currentPeriodEnd) return null;
    
    const endDate = subscription.currentPeriodEnd?.toDate 
      ? subscription.currentPeriodEnd.toDate() 
      : new Date(subscription.currentPeriodEnd);
    
    const now = new Date();
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const daysRemaining = getDaysRemaining();

  // Refresh usage counter (call after AI query)
  const refreshUsage = async () => {
    if (!userId) return;
    const usageData = await getTodayUsage(userId, userEmail);
    setUsage(usageData);
  };

  return {
    // Subscription data
    subscription,
    tier: subscription.tier,
    status: subscription.status,
    features: subscription.features,
    loading: subscription.loading,
    daysRemaining,

    // Usage data
    usage,
    isLimitReached,
    remainingQueries,

    // Tier checks
    isFree,
    isPaid,
    isActive,
    tierDetails,

    // Feature checks
    hasFeature,

    // Actions
    refreshUsage
  };
}

