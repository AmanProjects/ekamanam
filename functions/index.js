const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ==========================================
// 🎟️ CREATE CHECKOUT SESSION
// ==========================================
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { priceId, userId, userEmail, tier, isYearly } = req.body;

      if (!priceId || !userId || !userEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log(`📝 Creating checkout session for user: ${userId}, tier: ${tier}, yearly: ${isYearly}`);

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card', 'upi'], // Support both cards and UPI
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.APP_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/?payment=cancelled`,
        customer_email: userEmail,
        client_reference_id: userId,
        metadata: {
          userId: userId,
          tier: tier,
          isYearly: isYearly ? 'true' : 'false'
        },
        subscription_data: {
          metadata: {
            userId: userId,
            tier: tier,
            isYearly: isYearly ? 'true' : 'false'
          },
        },
        // Enable automatic tax calculation (optional)
        automatic_tax: { enabled: false },
        // Currency
        currency: 'inr', // Indian Rupees
      });

      console.log(`✅ Checkout session created: ${session.id}`);
      
      return res.status(200).json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==========================================
// 🔔 STRIPE WEBHOOK HANDLER
// ==========================================
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Received webhook event: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`❌ Error handling webhook: ${error}`);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

// ==========================================
// 📊 CREATE CUSTOMER PORTAL SESSION
// ==========================================
exports.createPortalSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID required' });
      }

      // Create portal session for subscription management
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.APP_URL}/`,
      });

      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('❌ Error creating portal session:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==========================================
// 🔍 GET SUBSCRIPTION STATUS
// ==========================================
exports.getSubscriptionStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // Get user's subscription from Firestore
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      const subscription = userData.subscription || {
        tier: 'FREE',
        status: 'active',
        features: {
          aiQueriesPerDay: 5,
          pdfStorageGB: 0.1,
          advancedFeatures: false
        }
      };

      return res.status(200).json(subscription);
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==========================================
// 🎯 WEBHOOK EVENT HANDLERS
// ==========================================

async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);
  
  const userId = session.client_reference_id || session.metadata.userId;
  const tier = session.metadata.tier;

  if (!userId) {
    console.error('❌ No user ID found in session');
    return;
  }

  // Update user's subscription status
  await db.collection('users').doc(userId).set({
    subscription: {
      tier: tier,
      status: 'active',
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      features: getTierFeatures(tier),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  }, { merge: true });

  console.log(`✅ User ${userId} upgraded to ${tier}`);
}

async function handleSubscriptionCreated(subscription) {
  console.log('🆕 Subscription created:', subscription.id);
  
  const userId = subscription.metadata.userId;
  const tier = subscription.metadata.tier;

  if (!userId) {
    console.error('❌ No user ID found in subscription');
    return;
  }

  await db.collection('users').doc(userId).set({
    subscription: {
      tier: tier,
      status: subscription.status,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features: getTierFeatures(tier),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  }, { merge: true });
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('❌ No user ID found in subscription');
    return;
  }

  // Get current tier from subscription
  const userDoc = await db.collection('users').doc(userId).get();
  const currentTier = userDoc.exists ? userDoc.data().subscription?.tier : 'FREE';

  await db.collection('users').doc(userId).set({
    subscription: {
      tier: currentTier,
      status: subscription.status,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features: getTierFeatures(currentTier),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  }, { merge: true });
}

async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);
  
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('❌ No user ID found in subscription');
    return;
  }

  // Downgrade to FREE tier
  await db.collection('users').doc(userId).set({
    subscription: {
      tier: 'FREE',
      status: 'cancelled',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      features: getTierFeatures('FREE'),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  }, { merge: true });

  console.log(`📉 User ${userId} downgraded to FREE`);
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Invoice payment succeeded:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;

    if (userId) {
      await db.collection('users').doc(userId).set({
        subscription: {
          status: 'active',
          lastPaymentDate: new Date(invoice.status_transitions.paid_at * 1000),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
    }
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;

    if (userId) {
      await db.collection('users').doc(userId).set({
        subscription: {
          status: 'past_due',
          paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
    }
  }
}

// ==========================================
// 🎁 HELPER FUNCTIONS
// ==========================================

function getTierFeatures(tier) {
  const features = {
    'FREE': {
      aiQueriesPerDay: 5,
      pdfStorageGB: 0.1,
      advancedFeatures: false,
      cloudSync: false,
      prioritySupport: false
    },
    'STUDENT': {
      aiQueriesPerDay: -1, // unlimited
      pdfStorageGB: 1,
      advancedFeatures: true,
      cloudSync: true,
      prioritySupport: false
    },
    'EDUCATOR': {
      aiQueriesPerDay: -1, // unlimited
      pdfStorageGB: 5,
      advancedFeatures: true,
      cloudSync: true,
      prioritySupport: true,
      classroomManagement: true,
      studentsManaged: 50
    }
  };

  return features[tier] || features['FREE'];
}

// ==========================================
// 💳 RAZORPAY FUNCTIONS
// ==========================================

const razorpayFunctions = require('./razorpay');

// Export Razorpay functions
exports.createRazorpayOrder = razorpayFunctions.createRazorpayOrder;
exports.verifyRazorpayPayment = razorpayFunctions.verifyRazorpayPayment;
exports.razorpayWebhook = razorpayFunctions.razorpayWebhook;
exports.cancelRazorpaySubscription = razorpayFunctions.cancelRazorpaySubscription;

