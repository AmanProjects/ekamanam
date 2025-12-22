# 🚀 Stripe Quick Start - 15 Minutes to Payment

Follow these steps to get Stripe payments working in Ekamanam.

---

## Step 1: Create Stripe Account (5 mins)

1. Go to https://dashboard.stripe.com/register
2. Sign up with your email
3. Skip the onboarding for now (you can complete it later)
4. Toggle to **Test Mode** (top right corner)

---

## Step 2: Create Products & Get Price IDs (5 mins)

### Create Student Plan

1. Go to **Products** → **Add product**
2. Name: `Ekamanam Student Plan`
3. Add pricing:
   - **Monthly**: ₹299
   - **Yearly**: ₹2999
4. Save and **copy both Price IDs** (they look like `price_1AbC...`)

### Create Educator Plan

1. **Add product** again
2. Name: `Ekamanam Educator Plan`
3. Add pricing:
   - **Monthly**: ₹1299
   - **Yearly**: ₹12999
4. Save and **copy both Price IDs**

---

## Step 3: Get API Keys (2 mins)

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

---

## Step 4: Configure Environment (3 mins)

Create `.env` file in project root:

```bash
# Stripe Frontend Key
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Student Plan Price IDs
REACT_APP_STRIPE_STUDENT_MONTHLY_PRICE_ID=price_xxx
REACT_APP_STRIPE_STUDENT_YEARLY_PRICE_ID=price_yyy

# Educator Plan Price IDs
REACT_APP_STRIPE_EDUCATOR_MONTHLY_PRICE_ID=price_zzz
REACT_APP_STRIPE_EDUCATOR_YEARLY_PRICE_ID=price_www
```

Configure Firebase Functions:

```bash
firebase functions:config:set stripe.secret_key="sk_test_your_secret_key"
firebase functions:config:set app.url="http://localhost:3000"
```

---

## Step 5: Deploy & Test (5 mins)

### Deploy Functions

```bash
firebase deploy --only functions
```

**Copy the webhook URL from the output!**

### Start App

```bash
npm start
```

### Test Payment

1. Click "Upgrade" button
2. Select Student Monthly (₹299)
3. Click "Upgrade Now"
4. Enter test card: `4242 4242 4242 4242`
5. Expiry: `12/34`, CVC: `123`
6. Complete payment

---

## ✅ Done!

If payment succeeds and your subscription updates, you're ready to go!

### What's Next?

1. **Setup Webhook** (for production): See [STRIPE_SETUP_GUIDE.md](docs/STRIPE_SETUP_GUIDE.md#step-5-setup-stripe-webhook)
2. **Go Live**: Switch to live mode and update API keys
3. **Complete Stripe Activation**: Add bank account for payouts

---

## 🐛 Troubleshooting

**Payment works but subscription not updating?**
- Webhook not configured yet - that's OK for testing
- Manually update user subscription in Firestore

**"Price ID not found" error?**
- Double-check Price IDs in .env match Stripe Dashboard
- Restart app after changing .env: `npm start`

**Need detailed help?**
- See [STRIPE_SETUP_GUIDE.md](docs/STRIPE_SETUP_GUIDE.md)
- See [STRIPE_INTEGRATION_COMPLETE.md](docs/STRIPE_INTEGRATION_COMPLETE.md)

---

**Total Time:** ~15-20 minutes
**Ready to accept payments!** 💳✨
