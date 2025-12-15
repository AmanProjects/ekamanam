# 💳 Subscription System Setup Guide

This guide will walk you through setting up the complete subscription system for Ekamanam, including Stripe payment integration, Firebase Cloud Functions, and feature gating.

---

## 📋 Overview

The subscription system includes:
- **3 Tiers**: Free, Student (₹99/month), Educator (₹299/month)
- **Payment Methods**: Credit/Debit cards + UPI (via Stripe)
- **Backend**: Firebase Cloud Functions for secure webhook handling
- **Frontend**: React components for pricing, checkout, and subscription management
- **Feature Gating**: AI query limits and premium feature restrictions

---

## 🛠️ Prerequisites

Before you begin, make sure you have:
- [ ] Firebase account with Blaze (pay-as-you-go) plan enabled
- [ ] Stripe account (test mode for development)
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Node.js 18+ installed

---

## 📝 Step 1: Set Up Stripe

### 1.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete account verification
3. Enable test mode (toggle in top-right corner)

### 1.2 Create Products and Prices

**Student Plan:**
1. Go to **Products** → **Add product**
2. Product details:
   - Name: `Student Plan`
   - Description: `Unlimited AI queries and advanced features`
   - Pricing model: `Recurring`
   - Price: `₹99` (or `$1.99` for international)
   - Billing period: `Monthly`
   - Currency: `INR` (or `USD`)
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_`)

**Educator Plan:**
1. Repeat above steps with:
   - Name: `Educator Plan`
   - Description: `Everything in Student + classroom management`
   - Price: `₹299` (or `$5.99`)
2. Copy the **Price ID**

### 1.3 Enable UPI Payments
1. Go to **Settings** → **Payment methods**
2. Enable **UPI** (available for INR currency)
3. Save changes

### 1.4 Get API Keys
1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)
3. Keep these secure! Never commit to Git.

---

## 🔥 Step 2: Set Up Firebase Cloud Functions

### 2.1 Initialize Firebase (if not done)
```bash
cd /path/to/ekamanam
firebase login
firebase init
```

Select:
- ✅ Functions
- ✅ Firestore
- Choose your Firebase project

### 2.2 Install Dependencies
```bash
cd functions
npm install
```

### 2.3 Set Environment Variables

**For local development:**
```bash
# In /functions directory, create .env file
cd functions
cp .env.example .env
```

Edit `.env`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_PRICE_ID_STUDENT=price_YOUR_STUDENT_PRICE_ID
STRIPE_PRICE_ID_EDUCATOR=price_YOUR_EDUCATOR_PRICE_ID
APP_URL=http://localhost:3000
```

**For production:**
```bash
# From project root
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_SECRET_KEY" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET" \
  stripe.price_id_student="price_YOUR_STUDENT_PRICE_ID" \
  stripe.price_id_educator="price_YOUR_EDUCATOR_PRICE_ID" \
  app.url="https://www.ekamanam.com"
```

### 2.4 Update Cloud Functions Code

In `functions/index.js`, update the Stripe initialization to use environment config:

```javascript
const functions = require('firebase-functions');
const stripe = require('stripe')(
  process.env.STRIPE_SECRET_KEY || functions.config().stripe.secret_key
);
```

### 2.5 Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createCheckoutSession,functions:stripeWebhook
```

Copy the deployed function URLs (you'll need them later):
- `createCheckoutSession`: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/createCheckoutSession`
- `stripeWebhook`: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook`
- `createPortalSession`: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/createPortalSession`

---

## 🪝 Step 3: Configure Stripe Webhooks

### 3.1 Add Webhook Endpoint
1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Endpoint URL: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook`
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **Add endpoint**

### 3.2 Get Webhook Secret
1. Click on the webhook you just created
2. Click **Reveal** next to **Signing secret**
3. Copy the secret (starts with `whsec_`)
4. Update your environment variables:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
   ```

### 3.3 Test Webhook (Optional)
Use Stripe CLI to test locally:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local functions
stripe listen --forward-to http://localhost:5001/YOUR-PROJECT/us-central1/stripeWebhook
```

---

## ⚛️ Step 4: Configure React App

### 4.1 Create Environment File
```bash
# In project root
cp .env.example .env
```

### 4.2 Update .env
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
REACT_APP_STRIPE_PRICE_ID_STUDENT=price_YOUR_STUDENT_PRICE_ID
REACT_APP_STRIPE_PRICE_ID_EDUCATOR=price_YOUR_EDUCATOR_PRICE_ID
REACT_APP_CLOUD_FUNCTION_URL=https://us-central1-YOUR-PROJECT.cloudfunctions.net/createCheckoutSession
REACT_APP_CLOUD_FUNCTION_URL_PORTAL=https://us-central1-YOUR-PROJECT.cloudfunctions.net/createPortalSession
REACT_APP_APP_URL=https://www.ekamanam.com
```

### 4.3 Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Step 5: Test the System

### 5.1 Test Payment Flow (Development)
1. Start local development:
   ```bash
   npm start
   ```
2. Sign in with Google
3. Click on your subscription tier badge (shows "FREE")
4. Select "Student Plan" and click "Upgrade Now"
5. You'll be redirected to Stripe Checkout
6. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
7. Complete payment
8. You should be redirected back with success message
9. Check Firestore to confirm subscription is updated

### 5.2 Test UPI Payment (Development)
1. In Stripe Checkout, select **UPI** payment method
2. Use test UPI ID: `success@stripeupi`
3. Complete payment
4. Verify subscription updated

### 5.3 Test Feature Gating
1. Sign out and use app without signing in (or in incognito)
2. Try to use AI features
3. After 5 queries, you should see upgrade prompt
4. Sign in with paid subscription
5. Verify unlimited queries work

### 5.4 Test Subscription Management
1. Go to Dashboard
2. Click on subscription tier badge
3. For paid users, click "Manage Subscription"
4. You'll be redirected to Stripe Customer Portal
5. Test cancel/update subscription

---

## 🚀 Step 6: Production Deployment

### 6.1 Update Environment for Production
1. Switch Stripe to **Live mode** (toggle in top-right)
2. Copy **Live API keys**
3. Create new products and prices in live mode
4. Update Cloud Functions config with live keys:
   ```bash
   firebase functions:config:set \
     stripe.secret_key="sk_live_YOUR_LIVE_KEY" \
     stripe.price_id_student="price_LIVE_STUDENT_ID" \
     stripe.price_id_educator="price_LIVE_EDUCATOR_ID"
   ```
5. Update React app `.env` with live keys

### 6.2 Deploy to Production
```bash
# Build React app
npm run build

# Deploy everything
firebase deploy

# Or deploy separately
npm run deploy  # Deploy to GitHub Pages
firebase deploy --only functions,firestore
```

### 6.3 Update Stripe Webhooks
1. Add production webhook endpoint in Stripe Dashboard
2. URL: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook`
3. Update webhook secret in Cloud Functions config

---

## 📊 Step 7: Monitor & Manage

### 7.1 Monitor Stripe Dashboard
- **Payments**: Track successful/failed payments
- **Subscriptions**: View active/cancelled subscriptions
- **Customers**: Manage customer information
- **Webhooks**: Check webhook delivery status

### 7.2 Monitor Firebase Console
- **Firestore**: Check user subscription data
- **Functions**: Monitor function execution and logs
- **Usage**: Track Firebase costs

### 7.3 View Logs
```bash
# View Cloud Functions logs
firebase functions:log

# View real-time logs
firebase functions:log --only createCheckoutSession
```

---

## 🔐 Security Best Practices

1. **Never commit secrets to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables for all sensitive data

2. **Use Firestore security rules**
   - Restrict subscription writes to Cloud Functions only
   - Users can only read their own subscription data

3. **Verify webhook signatures**
   - Always validate Stripe webhook signatures (already implemented)

4. **Use HTTPS everywhere**
   - Cloud Functions automatically use HTTPS
   - Ensure your app is deployed on HTTPS

5. **Test in test mode first**
   - Always test with Stripe test keys before going live
   - Use test cards and UPI IDs

---

## 🐛 Troubleshooting

### Payment Not Processing
- Check Stripe webhook logs in Stripe Dashboard
- Verify webhook secret is correct
- Check Firebase Functions logs for errors
- Ensure CORS is enabled for your domain

### Subscription Not Updating
- Check Firestore rules allow Cloud Functions to write
- Verify user ID is being passed correctly in metadata
- Check Firebase Functions logs for errors

### Features Not Gating Correctly
- Clear browser cache and localStorage
- Check subscription data in Firestore
- Verify usage tracking is working (`usage` collection)

### Local Development Issues
- Ensure `.env` file exists with correct values
- Check Firebase emulator is running if testing locally
- Verify Stripe CLI is forwarding webhooks correctly

---

## 💰 Cost Estimates

### Firebase (Blaze Plan)
- Functions: ~$5-25/month for 1000 users
- Firestore: ~$1-5/month for typical usage
- Hosting: Free (< 10GB/month)

### Stripe
- 2.9% + ₹2 per transaction (India)
- 2.9% + $0.30 per transaction (International)
- No monthly fees

### Total Monthly Cost
- **1000 users**: ~$10-35/month
- **10,000 users**: ~$50-150/month

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Firebase Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## ✅ Checklist

Before going live, ensure:
- [ ] All Stripe products and prices created
- [ ] Cloud Functions deployed and tested
- [ ] Webhooks configured and verified
- [ ] Firestore rules deployed
- [ ] Environment variables set for production
- [ ] Payment flow tested end-to-end
- [ ] Feature gating working correctly
- [ ] Subscription management tested
- [ ] Error handling and logging verified
- [ ] Security best practices followed

---

## 🆘 Support

If you encounter issues:
1. Check Firebase Functions logs
2. Check Stripe webhook delivery logs
3. Review Firestore security rules
4. Test with Stripe test mode first
5. Check browser console for errors

---

**🎉 Congratulations! Your subscription system is now live!**

