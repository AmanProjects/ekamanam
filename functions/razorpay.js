const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors')({ origin: true });

const db = admin.firestore();

// Initialize Razorpay with your keys
// Reads from Firebase Functions config (set via: firebase functions:config:set)
// Falls back to process.env for local testing
const razorpay = new Razorpay({
  key_id: functions.config().razorpay?.key_id || process.env.RAZORPAY_KEY_ID,
  key_secret: functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET
});

// ==========================================
// 🎟️ CREATE RAZORPAY ORDER
// ==========================================
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { amount, currency, userId, tier, isYearly, planId } = req.body;

      if (!amount || !userId || !tier) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log(`📝 Creating Razorpay order for user: ${userId}, tier: ${tier}, yearly: ${isYearly}`);

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount, // Amount in paise
        currency: currency || 'INR',
        receipt: `order_${userId}_${Date.now()}`,
        notes: {
          userId: userId,
          tier: tier,
          isYearly: isYearly ? 'true' : 'false',
          planId: planId
        }
      });

      console.log(`✅ Razorpay order created: ${order.id}`);

      // Store order details in Firestore for verification
      await db.collection('razorpayOrders').doc(order.id).set({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        userId: userId,
        tier: tier,
        isYearly: isYearly,
        planId: planId,
        status: 'created',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });

    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==========================================
// ✅ VERIFY RAZORPAY PAYMENT
// ==========================================
exports.verifyRazorpayPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { orderId, paymentId, signature, userId, tier, isYearly } = req.body;

      if (!orderId || !paymentId || !signature || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log(`🔍 Verifying Razorpay payment: ${paymentId}`);

      // Verify signature
      const keySecret = functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        console.error('❌ Signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }

      console.log('✅ Signature verified successfully');

      // Get order details
      const orderDoc = await db.collection('razorpayOrders').doc(orderId).get();
      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const orderData = orderDoc.data();

      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(paymentId);

      // Calculate subscription period
      const isYearlySubscription = orderData.isYearly || isYearly;
      const durationMonths = isYearlySubscription ? 12 : 1;
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + durationMonths);

      // Update user's subscription in Firestore
      await db.collection('users').doc(userId).set({
        subscription: {
          tier: orderData.tier || tier,
          status: 'active',
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          currentPeriodStart: admin.firestore.Timestamp.fromDate(currentPeriodStart),
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(currentPeriodEnd),
          cancelAtPeriodEnd: false,
          amount: payment.amount / 100, // Convert paise to rupees
          currency: payment.currency,
          isYearly: isYearlySubscription,
          features: getTierFeatures(orderData.tier || tier),
          paymentMethod: payment.method,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });

      // Update order status
      await db.collection('razorpayOrders').doc(orderId).update({
        status: 'paid',
        paymentId: paymentId,
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Store payment record
      await db.collection('payments').add({
        userId: userId,
        orderId: orderId,
        paymentId: paymentId,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        tier: orderData.tier || tier,
        isYearly: isYearlySubscription,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ User ${userId} upgraded to ${orderData.tier || tier}`);

      return res.status(200).json({
        success: true,
        message: 'Payment verified and subscription activated'
      });

    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==========================================
// 🔔 RAZORPAY WEBHOOK HANDLER
// ==========================================
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const secret = functions.config().razorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('⚠️ Webhook signature verification failed');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`🔔 Received webhook event: ${event}`);

    // Handle different event types
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'order.paid':
        console.log('✅ Order paid:', payload.order.entity.id);
        break;

      default:
        console.log(`🔔 Unhandled event type: ${event}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error(`❌ Error handling webhook: ${error}`);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

// ==========================================
// 🗑️ CANCEL SUBSCRIPTION
// ==========================================
exports.cancelRazorpaySubscription = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      console.log(`🗑️ Cancelling subscription for user: ${userId}`);

      // Update user's subscription status
      await db.collection('users').doc(userId).update({
        'subscription.cancelAtPeriodEnd': true,
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Subscription cancelled for user: ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully'
      });

    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==========================================
// 🎯 WEBHOOK EVENT HANDLERS
// ==========================================

async function handlePaymentCaptured(payment) {
  console.log('✅ Payment captured:', payment.id);

  try {
    const orderId = payment.order_id;

    // Get order details
    const orderDoc = await db.collection('razorpayOrders').doc(orderId).get();
    if (!orderDoc.exists) {
      console.error('❌ Order not found:', orderId);
      return;
    }

    const orderData = orderDoc.data();
    const userId = orderData.userId;

    // Update payment record
    await db.collection('payments').add({
      userId: userId,
      orderId: orderId,
      paymentId: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: 'captured',
      method: payment.method,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('❌ Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment) {
  console.log('❌ Payment failed:', payment.id);

  try {
    const orderId = payment.order_id;

    // Get order details
    const orderDoc = await db.collection('razorpayOrders').doc(orderId).get();
    if (!orderDoc.exists) {
      return;
    }

    const orderData = orderDoc.data();

    // Update order status
    await db.collection('razorpayOrders').doc(orderId).update({
      status: 'failed',
      failureReason: payment.error_description,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`📉 Payment failed for user ${orderData.userId}`);

  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
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
