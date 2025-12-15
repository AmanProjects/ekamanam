/**
 * 💳 Razorpay Payment Service
 *
 * Handles Razorpay payment integration for subscription management.
 * Communicates with Firebase Cloud Functions for secure payment processing.
 *
 * Razorpay is India's leading payment gateway with support for:
 * - UPI (Google Pay, PhonePe, Paytm, BHIM)
 * - Cards (Visa, Mastercard, RuPay, Amex)
 * - Net Banking (All major Indian banks)
 * - Wallets (Paytm, PhonePe, Mobikwik, etc.)
 *
 * @version 1.0.0
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';

// Get Razorpay key from environment
const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;

// Get Firebase Functions instance
const functions = getFunctions(app);

// Log warning if Razorpay is not configured
if (!RAZORPAY_KEY_ID) {
  console.warn('⚠️ Razorpay key not configured. Payments will not work. See RAZORPAY_QUICK_START.md for setup instructions.');
}

// ===== PRICING CONFIGURATION =====

export const PRICING_PLANS = {
  STUDENT: {
    name: 'Student',
    monthly: {
      price: 299,
      interval: 'month',
      planId: 'plan_student_monthly' // Will be created in Razorpay
    },
    yearly: {
      price: 2999,
      interval: 'year',
      planId: 'plan_student_yearly',
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
      interval: 'month',
      planId: 'plan_educator_monthly'
    },
    yearly: {
      price: 12999,
      interval: 'year',
      planId: 'plan_educator_yearly',
      savings: '17%'
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

// ===== RAZORPAY CHECKOUT =====

/**
 * Load Razorpay checkout script
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Create Razorpay order and open checkout
 */
export async function createRazorpayCheckout(tier, isYearly, userId, userEmail, userName) {
  try {
    // Check if Razorpay is configured
    if (!RAZORPAY_KEY_ID) {
      throw new Error('Razorpay is not configured. Please add REACT_APP_RAZORPAY_KEY_ID to your .env file. See RAZORPAY_QUICK_START.md for setup instructions.');
    }

    console.log(`💳 Creating Razorpay checkout: ${tier} (${isYearly ? 'yearly' : 'monthly'})`);

    // Get the appropriate plan details
    const plan = PRICING_PLANS[tier];
    const planDetails = isYearly ? plan.yearly : plan.monthly;
    const amount = planDetails.price * 100; // Razorpay uses paise (₹1 = 100 paise)

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
    }

    // Create order on backend
    const createOrder = httpsCallable(functions, 'createRazorpayOrder');
    const result = await createOrder({
      amount,
      currency: 'INR',
      userId,
      tier,
      isYearly,
      planId: planDetails.planId
    });

    const { orderId, amount: orderAmount, currency } = result.data;

    // Razorpay checkout options
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: orderAmount,
      currency: currency,
      name: 'Ekamanam',
      description: `${plan.name} Plan - ${isYearly ? 'Yearly' : 'Monthly'} Subscription`,
      image: '/Ekamanam_logo.png', // Your logo
      order_id: orderId,
      prefill: {
        name: userName || '',
        email: userEmail || '',
      },
      theme: {
        color: '#667eea' // Your brand color
      },
      modal: {
        ondismiss: function() {
          console.log('Checkout form closed by user');
        }
      },
      handler: async function (response) {
        // Payment successful
        console.log('✅ Payment successful:', response);

        try {
          // Verify payment on backend
          const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');
          await verifyPayment({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            userId,
            tier,
            isYearly
          });

          // Show success message
          alert(`🎉 Payment Successful!\n\nYour ${plan.name} subscription has been activated.\nPayment ID: ${response.razorpay_payment_id}`);

          // Reload page to reflect subscription changes
          window.location.reload();

        } catch (error) {
          console.error('❌ Payment verification failed:', error);
          alert('Payment successful but verification failed. Please contact support with Payment ID: ' + response.razorpay_payment_id);
        }
      },
      notes: {
        userId: userId,
        tier: tier,
        isYearly: isYearly.toString()
      }
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', function (response) {
      console.error('❌ Payment failed:', response.error);
      alert(`Payment Failed\n\nReason: ${response.error.description}\nError Code: ${response.error.code}`);
    });

    razorpay.open();

  } catch (error) {
    console.error('❌ Error creating Razorpay checkout:', error);
    throw error;
  }
}

// ===== SUBSCRIPTION MANAGEMENT =====

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, userId) {
  try {
    const cancelSub = httpsCallable(functions, 'cancelRazorpaySubscription');
    await cancelSub({ subscriptionId, userId });

    alert('Subscription cancelled successfully. You can continue using the service until the end of your billing period.');
    window.location.reload();

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw new Error('Failed to cancel subscription. Please try again or contact support.');
  }
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus(userId) {
  try {
    const getStatus = httpsCallable(functions, 'getSubscriptionStatus');
    const result = await getStatus({ userId });
    return result.data;
  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    throw error;
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
  createRazorpayCheckout,
  cancelSubscription,
  getSubscriptionStatus,
  formatPrice,
  getMonthlyEquivalent,
  calculateSavings,
  hasActiveSubscription,
  isSubscriptionPastDue,
  isSubscriptionCancelled,
  getDaysRemaining
};
