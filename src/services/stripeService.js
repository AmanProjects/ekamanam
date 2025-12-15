/**
 * 💳 Stripe Payment Service
 *
 * Handles Stripe payment integration for subscription management.
 * Communicates with Firebase Cloud Functions for secure payment processing.
 *
 * @version 1.0.0
 */

import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Get Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe (only if key is provided)
// For development without Stripe configured, this will be null
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

// Get Firebase Functions instance
const functions = getFunctions();

// Log warning if Stripe is not configured (development mode)
if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ Stripe publishable key not configured. Payments will not work. See STRIPE_QUICK_START.md for setup instructions.');
}

// ===== PRICING CONFIGURATION =====

export const PRICING_PLANS = {
  STUDENT: {
    name: 'Student',
    monthly: {
      price: 299,
      priceId: process.env.REACT_APP_STRIPE_STUDENT_MONTHLY_PRICE_ID,
      interval: 'month'
    },
    yearly: {
      price: 2999,
      priceId: process.env.REACT_APP_STRIPE_STUDENT_YEARLY_PRICE_ID,
      interval: 'year',
      savings: '17%' // (299*12 - 2999) / (299*12) * 100
    },
    features: [
      'Unlimited AI queries',
      '1 GB PDF storage',
      'Advanced learning features',
      'Cloud synchronization',
      'Spaced repetition system',
      'Cognitive load tracking',
      'Session history & analytics',
      'Doubt prediction & library'
    ]
  },
  EDUCATOR: {
    name: 'Educator',
    monthly: {
      price: 1299,
      priceId: process.env.REACT_APP_STRIPE_EDUCATOR_MONTHLY_PRICE_ID,
      interval: 'month'
    },
    yearly: {
      price: 12999,
      priceId: process.env.REACT_APP_STRIPE_EDUCATOR_YEARLY_PRICE_ID,
      interval: 'year',
      savings: '17%' // (1299*12 - 12999) / (1299*12) * 100
    },
    features: [
      'Everything in Student plan',
      '5 GB PDF storage',
      'Priority support',
      'Classroom management',
      'Manage up to 50 students',
      'Student progress tracking',
      'Bulk content upload',
      'Custom branding (coming soon)'
    ]
  }
};

// ===== STRIPE CHECKOUT =====

/**
 * Create Stripe checkout session and redirect to payment
 */
export async function createCheckoutSession(tier, isYearly, userId, userEmail) {
  try {
    // Check if Stripe is configured
    if (!STRIPE_PUBLISHABLE_KEY) {
      throw new Error('Stripe is not configured. Please add REACT_APP_STRIPE_PUBLISHABLE_KEY to your .env file. See STRIPE_QUICK_START.md for setup instructions.');
    }

    console.log(`💳 Creating checkout session: ${tier} (${isYearly ? 'yearly' : 'monthly'})`);

    // Get the appropriate price ID
    const plan = PRICING_PLANS[tier];
    const priceId = isYearly ? plan.yearly.priceId : plan.monthly.priceId;

    if (!priceId) {
      throw new Error(`Price ID not configured for ${tier} ${isYearly ? 'yearly' : 'monthly'}. Please add the Price ID to your .env file.`);
    }

    // Call Firebase Function to create checkout session
    const createCheckout = httpsCallable(functions, 'createCheckoutSession');
    const result = await createCheckout({
      priceId,
      userId,
      userEmail,
      tier,
      isYearly
    });

    const { sessionId, url } = result.data;

    if (!url) {
      throw new Error('No checkout URL returned from server');
    }

    // Redirect to Stripe Checkout
    window.location.href = url;

    return { sessionId, url };
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}

/**
 * Redirect to checkout page directly (alternative method)
 */
export async function redirectToCheckout(sessionId) {
  try {
    const stripe = await stripePromise;

    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('❌ Error redirecting to checkout:', error);
    throw new Error(`Failed to redirect to checkout: ${error.message}`);
  }
}

// ===== CUSTOMER PORTAL =====

/**
 * Open Stripe Customer Portal for subscription management
 */
export async function openCustomerPortal(customerId) {
  try {
    console.log('📊 Opening customer portal...');

    // Call Firebase Function to create portal session
    const createPortal = httpsCallable(functions, 'createPortalSession');
    const result = await createPortal({ customerId });

    const { url } = result.data;

    if (!url) {
      throw new Error('No portal URL returned from server');
    }

    // Redirect to Stripe Customer Portal
    window.location.href = url;

    return { url };
  } catch (error) {
    console.error('❌ Error opening customer portal:', error);
    throw new Error(`Failed to open customer portal: ${error.message}`);
  }
}

// ===== SUBSCRIPTION STATUS =====

/**
 * Get subscription status from Firebase Functions
 */
export async function getSubscriptionStatus(userId) {
  try {
    const getStatus = httpsCallable(functions, 'getSubscriptionStatus');
    const result = await getStatus({ userId });

    return result.data;
  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    throw new Error(`Failed to get subscription status: ${error.message}`);
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Format price in INR
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate monthly price from yearly (for comparison)
 */
export function getMonthlyEquivalent(yearlyPrice) {
  return Math.round(yearlyPrice / 12);
}

/**
 * Calculate savings percentage
 */
export function calculateSavings(monthlyPrice, yearlyPrice) {
  const annualMonthlyTotal = monthlyPrice * 12;
  const savings = annualMonthlyTotal - yearlyPrice;
  const savingsPercent = Math.round((savings / annualMonthlyTotal) * 100);
  return {
    amount: savings,
    percentage: savingsPercent
  };
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(subscription) {
  if (!subscription) return false;
  return subscription.status === 'active' && subscription.tier !== 'FREE';
}

/**
 * Check if subscription is past due
 */
export function isSubscriptionPastDue(subscription) {
  if (!subscription) return false;
  return subscription.status === 'past_due';
}

/**
 * Check if subscription is cancelled
 */
export function isSubscriptionCancelled(subscription) {
  if (!subscription) return false;
  return subscription.status === 'cancelled' || subscription.cancelAtPeriodEnd;
}

/**
 * Get days remaining in subscription
 */
export function getDaysRemaining(subscription) {
  if (!subscription || !subscription.currentPeriodEnd) return 0;

  const endDate = subscription.currentPeriodEnd.toDate ?
    subscription.currentPeriodEnd.toDate() :
    new Date(subscription.currentPeriodEnd);

  const now = new Date();
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

// ===== EXPORTS =====

export default {
  PRICING_PLANS,
  createCheckoutSession,
  redirectToCheckout,
  openCustomerPortal,
  getSubscriptionStatus,
  formatPrice,
  getMonthlyEquivalent,
  calculateSavings,
  hasActiveSubscription,
  isSubscriptionPastDue,
  isSubscriptionCancelled,
  getDaysRemaining
};
