# 🚀 Subscription System - Quick Start

Get the subscription system up and running in 15 minutes!

---

## ⚡ 1-Minute Setup (Test Mode)

### Step 1: Get Stripe Keys (2 min)
1. Sign up at [stripe.com](https://stripe.com)
2. Go to **Developers** → **API keys**
3. Copy test keys (`pk_test_...` and `sk_test_...`)

### Step 2: Create Products (3 min)
1. Go to **Products** → **Add product**
2. Create **Student Plan**: ₹99/month
3. Create **Educator Plan**: ₹299/month
4. Copy both Price IDs (`price_...`)

### Step 3: Configure Functions (2 min)
```bash
cd functions
cp .env.example .env
```

Edit `functions/.env`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PRICE_ID_STUDENT=price_YOUR_ID
STRIPE_PRICE_ID_EDUCATOR=price_YOUR_ID
APP_URL=http://localhost:3000
```

### Step 4: Deploy Functions (3 min)
```bash
firebase deploy --only functions
```

Copy the deployed URLs.

### Step 5: Configure Webhooks (2 min)
1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. Add endpoint: `https://...cloudfunctions.net/stripeWebhook`
3. Select all subscription events
4. Copy webhook secret → update `functions/.env`

### Step 6: Configure React App (2 min)
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
REACT_APP_STRIPE_PRICE_ID_STUDENT=price_YOUR_ID
REACT_APP_STRIPE_PRICE_ID_EDUCATOR=price_YOUR_ID
REACT_APP_CLOUD_FUNCTION_URL=https://...cloudfunctions.net/createCheckoutSession
```

### Step 7: Test! (3 min)
```bash
npm start
```

1. Open app
2. Click subscription badge
3. Click "Upgrade Now"
4. Use test card: `4242 4242 4242 4242`
5. Complete payment ✅

---

## 🧪 Test Cards

- **Successful payment**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **UPI success**: `success@stripeupi`
- **UPI failure**: `failure@stripeupi`

Expiry: Any future date  
CVC: Any 3 digits  
ZIP: Any 5 digits

---

## 🔥 Quick Commands

```bash
# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# Test locally
npm start

# Deploy app
npm run deploy
```

---

## 📋 Subscription Tiers

| Feature | Free | Student (₹99) | Educator (₹299) |
|---------|------|---------------|-----------------|
| AI Queries | 5/day | Unlimited | Unlimited |
| 3D Visualizations | ❌ | ✅ | ✅ |
| Maps & Charts | ❌ | ✅ | ✅ |
| Cloud Sync | ❌ | ✅ | ✅ |
| Storage | 100MB | 1GB | 5GB |
| Classroom Mgmt | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

---

## 🎯 Key Files

```
functions/
  ├── index.js              # Cloud Functions (webhooks)
  └── .env                  # Stripe secrets

src/
  ├── services/
  │   └── subscriptionService.js  # Subscription logic
  ├── hooks/
  │   └── useSubscription.js      # React hook
  ├── components/
  │   ├── PricingPlans.js         # Pricing page
  │   ├── SubscriptionDialog.js   # Payment modal
  │   └── UpgradePrompt.js        # Upgrade CTAs

firestore.rules              # Security rules
.env                        # React app secrets
```

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Can see pricing page
- [ ] Test payment completes successfully
- [ ] Subscription updates in Firestore
- [ ] Free tier shows 5/5 queries used
- [ ] Paid tier shows "unlimited"
- [ ] Webhooks delivering successfully

---

## 🐛 Common Issues

**"Payment not updating subscription"**
→ Check webhook is configured and secret is correct

**"Cloud function not found"**
→ Deploy functions: `firebase deploy --only functions`

**"CORS error"**
→ Restart React app after updating `.env`

**"Stripe key invalid"**
→ Ensure using test keys (`pk_test_...` not `pk_live_...`)

---

## 📖 Full Documentation

See [SUBSCRIPTION_SETUP_GUIDE.md](./SUBSCRIPTION_SETUP_GUIDE.md) for detailed instructions.

---

**Need help? Check Firebase Functions logs and Stripe webhook delivery logs first!**

