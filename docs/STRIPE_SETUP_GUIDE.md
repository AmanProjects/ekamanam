# 💳 Stripe Integration Setup Guide

Complete guide to setting up Stripe payment processing for Ekamanam subscriptions.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Stripe Account](#step-1-create-stripe-account)
4. [Step 2: Create Products & Prices](#step-2-create-products--prices)
5. [Step 3: Configure Environment Variables](#step-3-configure-environment-variables)
6. [Step 4: Deploy Firebase Functions](#step-4-deploy-firebase-functions)
7. [Step 5: Setup Stripe Webhook](#step-5-setup-stripe-webhook)
8. [Step 6: Test Payment Flow](#step-6-test-payment-flow)
9. [Step 7: Go Live](#step-7-go-live)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What We're Building

- **Student Plan**: ₹299/month or ₹2999/year (17% savings)
- **Educator Plan**: ₹1299/month or ₹12999/year (17% savings)
- **Payment Methods**: UPI, Cards (Visa, Mastercard, etc.)
- **Currency**: Indian Rupees (INR)
- **Features**: Automatic billing, instant activation, subscription management

### Architecture

```
User clicks "Upgrade"
  → Frontend calls Firebase Function
    → Function creates Stripe Checkout Session
      → User redirected to Stripe Checkout
        → Payment processed
          → Stripe Webhook notifies your server
            → Firebase Function updates Firestore
              → User subscription activated!
```

---

## Prerequisites

✅ Firebase project set up
✅ Firebase Functions initialized (`/functions` directory)
✅ Firestore database configured
✅ Node.js 18+ installed
✅ Firebase CLI installed (`npm install -g firebase-tools`)

---

## Step 1: Create Stripe Account

### 1.1 Sign Up for Stripe

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create an account
3. Complete business verification (required for India)
4. Enable **Indian rupees (INR)** in Settings → Business settings → Currency

### 1.2 Activate Your Account

1. Go to **Settings** → **Business Profile**
2. Fill in:
   - Business name: "Ekamanam"
   - Business type: "Software/SaaS"
   - Business address: Your registered address
   - Tax ID: Your GST number (if applicable)

### 1.3 Enable Payment Methods

1. Go to **Settings** → **Payment methods**
2. Enable:
   - ✅ Cards (Visa, Mastercard, RuPay)
   - ✅ UPI (most popular in India)
   - ✅ Netbanking (optional)
   - ✅ Wallets (optional: Paytm, PhonePe, etc.)

---

## Step 2: Create Products & Prices

### 2.1 Create Student Plan Product

1. Go to **Products** → **Add product**
2. Fill in:
   ```
   Name: Ekamanam Student Plan
   Description: Unlimited AI-powered learning for students
   ```
3. Click **Add pricing**

#### Student Monthly Price
```
Price: ₹299
Billing period: Monthly
Price ID: (copy this - e.g., price_1AbC2dEf...)
```

#### Student Yearly Price
```
Price: ₹2999
Billing period: Yearly
Price ID: (copy this - e.g., price_1XyZ2wQr...)
```

4. Click **Save product**

### 2.2 Create Educator Plan Product

1. Go to **Products** → **Add product**
2. Fill in:
   ```
   Name: Ekamanam Educator Plan
   Description: Advanced features for teachers and tutors
   ```
3. Click **Add pricing**

#### Educator Monthly Price
```
Price: ₹1299
Billing period: Monthly
Price ID: (copy this - e.g., price_2AbC3dEf...)
```

#### Educator Yearly Price
```
Price: ₹12999
Billing period: Yearly
Price ID: (copy this - e.g., price_2XyZ3wQr...)
```

4. Click **Save product**

### 2.3 Copy Your Price IDs

You'll need these 4 Price IDs for the next step:

```
STUDENT_MONTHLY_PRICE_ID: price_xxxxxxxxxxxxx
STUDENT_YEARLY_PRICE_ID: price_xxxxxxxxxxxxx
EDUCATOR_MONTHLY_PRICE_ID: price_xxxxxxxxxxxxx
EDUCATOR_YEARLY_PRICE_ID: price_xxxxxxxxxxxxx
```

---

## Step 3: Configure Environment Variables

### 3.1 Get Your Stripe API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

⚠️ **Never commit your secret key to Git!**

### 3.2 Update `.env` File

Create `.env` in your project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
nano .env
```

Fill in:

```bash
# Stripe Publishable Key (frontend)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here

# Student Monthly Plan (₹299/month)
REACT_APP_STRIPE_STUDENT_MONTHLY_PRICE_ID=price_your_actual_id_here

# Student Yearly Plan (₹2999/year)
REACT_APP_STRIPE_STUDENT_YEARLY_PRICE_ID=price_your_actual_id_here

# Educator Monthly Plan (₹1299/month)
REACT_APP_STRIPE_EDUCATOR_MONTHLY_PRICE_ID=price_your_actual_id_here

# Educator Yearly Plan (₹12999/year)
REACT_APP_STRIPE_EDUCATOR_YEARLY_PRICE_ID=price_your_actual_id_here
```

### 3.3 Configure Firebase Functions

Set environment variables for Firebase Functions:

```bash
# Set Stripe Secret Key
firebase functions:config:set stripe.secret_key="sk_test_your_actual_secret_key"

# Set App URL (for payment redirects)
firebase functions:config:set app.url="https://yourapp.com"

# For local development, use:
# firebase functions:config:set app.url="http://localhost:3000"

# Verify configuration
firebase functions:config:get
```

---

## Step 4: Deploy Firebase Functions

### 4.1 Install Dependencies

```bash
cd functions
npm install
cd ..
```

### 4.2 Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createCheckoutSession,functions:stripeWebhook,functions:createPortalSession
```

### 4.3 Note Your Function URLs

After deployment, you'll see URLs like:

```
✔  functions[createCheckoutSession(us-central1)]: Successful create operation.
   https://us-central1-your-project.cloudfunctions.net/createCheckoutSession

✔  functions[stripeWebhook(us-central1)]: Successful create operation.
   https://us-central1-your-project.cloudfunctions.net/stripeWebhook

✔  functions[createPortalSession(us-central1)]: Successful create operation.
   https://us-central1-your-project.cloudfunctions.net/createPortalSession
```

**Copy the webhook URL** - you'll need it in the next step!

---

## Step 5: Setup Stripe Webhook

### 5.1 Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://us-central1-your-project.cloudfunctions.net/stripeWebhook
   ```

### 5.2 Select Events to Listen

Select these events:

```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
```

### 5.3 Get Webhook Signing Secret

1. After creating the webhook, click on it
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_...`)

### 5.4 Add Webhook Secret to Firebase

```bash
firebase functions:config:set stripe.webhook_secret="whsec_your_actual_webhook_secret"

# Redeploy functions with new config
firebase deploy --only functions
```

---

## Step 6: Test Payment Flow

### 6.1 Use Stripe Test Mode

Stripe provides test card numbers:

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Test UPI:**
```
UPI ID: success@razorpay
```

**Payment Requires Authentication (3D Secure):**
```
Card Number: 4000 0027 6000 3184
```

**Payment Fails:**
```
Card Number: 4000 0000 0000 0002
```

### 6.2 Test the Complete Flow

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Navigate to pricing**: Click "Upgrade" button

3. **Select a plan**: Choose Student Monthly (₹299)

4. **Checkout**: Click "Upgrade Now"

5. **Enter test card**: Use `4242 4242 4242 4242`

6. **Complete payment**: You should be redirected back to your app

7. **Verify subscription**: Check that:
   - User's subscription tier updated in Firestore
   - Success message appears
   - Features unlocked

### 6.3 Test Webhook Delivery

1. Go to **Developers** → **Webhooks** → Your webhook
2. Click **Send test webhook**
3. Select `checkout.session.completed`
4. Check that your Firebase Function receives and processes it

---

## Step 7: Go Live

### 7.1 Switch to Live Mode

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode** (top right)

### 7.2 Get Live API Keys

1. Go to **Developers** → **API keys**
2. Copy your **Live** keys:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

### 7.3 Update Production Environment

```bash
# Update .env for production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key

# Update Firebase Functions config
firebase functions:config:set stripe.secret_key="sk_live_your_actual_key"
firebase functions:config:set app.url="https://www.ekamanam.com"

# Redeploy
firebase deploy --only functions
```

### 7.4 Create Live Webhook

1. Go to **Developers** → **Webhooks** (in Live mode)
2. Create a new webhook with the same URL and events
3. Get the new webhook signing secret
4. Update Firebase config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_your_live_secret"
   firebase deploy --only functions
   ```

### 7.5 Activate Your Stripe Account

Before going live, Stripe requires:

✅ Business verification completed
✅ Bank account added for payouts
✅ Tax information provided
✅ Terms of service accepted

Go to **Settings** → **Business settings** to complete activation.

---

## Troubleshooting

### Issue: Payment succeeds but subscription not activated

**Solution:**
1. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```
2. Verify webhook is receiving events:
   - Go to **Developers** → **Webhooks**
   - Check "Attempted events" tab
3. Ensure webhook secret is correctly set

### Issue: "Price ID not found" error

**Solution:**
1. Verify Price IDs in `.env` match Stripe Dashboard
2. Check that you're using Test mode Price IDs for development
3. Rebuild app after updating `.env`:
   ```bash
   npm run build
   ```

### Issue: Webhook signature verification failed

**Solution:**
1. Verify webhook secret is correct:
   ```bash
   firebase functions:config:get
   ```
2. Ensure you're using the correct secret (test vs live)
3. Redeploy functions after updating config

### Issue: User redirected to wrong URL after payment

**Solution:**
1. Check `app.url` config:
   ```bash
   firebase functions:config:get app.url
   ```
2. Update if incorrect:
   ```bash
   firebase functions:config:set app.url="https://correct-url.com"
   firebase deploy --only functions
   ```

### Issue: UPI payments not working

**Solution:**
1. Ensure UPI is enabled in Stripe Settings → Payment methods
2. UPI only works in India - test with Indian test accounts
3. Check that your Stripe account is activated for Indian payments

---

## Testing Checklist

Before going live, test:

- [ ] Student Monthly subscription (₹299)
- [ ] Student Yearly subscription (₹2999)
- [ ] Educator Monthly subscription (₹1299)
- [ ] Educator Yearly subscription (₹12999)
- [ ] UPI payment flow
- [ ] Card payment flow
- [ ] Payment failure handling
- [ ] Subscription cancellation
- [ ] Subscription renewal
- [ ] Webhook event processing
- [ ] Firestore subscription updates
- [ ] Customer portal access
- [ ] Invoice generation

---

## Additional Resources

- [Stripe India Guide](https://stripe.com/docs/india)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)

---

## Support

If you encounter issues:

1. Check Firebase Functions logs: `firebase functions:log`
2. Check Stripe Dashboard → Developers → Events
3. Check browser console for frontend errors
4. Review this guide's troubleshooting section
5. Contact Stripe Support for payment-specific issues

---

**Last Updated:** 2025-12-15
**Version:** 1.0.0
**Status:** ✅ Production Ready
