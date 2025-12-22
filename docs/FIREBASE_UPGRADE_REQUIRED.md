# 🔥 Firebase Plan Upgrade Required

## Issue Detected

Your Firebase project **`ekamanam`** is currently on the **Spark (Free) Plan**.

To deploy Firebase Functions (required for Razorpay payments), you need to upgrade to the **Blaze (Pay-as-you-go) Plan**.

---

## Why Upgrade is Needed

Firebase Functions require:
- Cloud Functions API
- Cloud Build API
- Artifact Registry API

These APIs are only available on the Blaze plan.

---

## About the Blaze Plan

### 💰 Cost Structure

**Good News:** The Blaze plan includes a **generous free tier**, and you'll likely stay within it:

#### Free Tier Limits (Every Month):
- ✅ **2 million function invocations** (FREE)
- ✅ **400,000 GB-seconds compute time** (FREE)
- ✅ **200,000 CPU-seconds** (FREE)
- ✅ **5 GB outbound networking** (FREE)

#### Estimated Cost for Ekamanam:

For a payment system with moderate traffic (100 payments/month):
- **Monthly Invocations:** ~400 (well within 2M free tier)
- **Compute Time:** Minimal (within free tier)
- **Expected Cost:** **$0/month** (within free tier)

Even with **1000 payments/month**, you'd likely pay **less than $1-2/month**.

### 🛡️ Billing Protection

- You can set **spending limits** to avoid unexpected charges
- Get **email alerts** when approaching limits
- Can **disable functions** at any time to stop charges

---

## How to Upgrade (2 minutes)

### Step 1: Visit Firebase Console

Click this link to upgrade:

**https://console.firebase.google.com/project/ekamanam/usage/details**

Or manually:
1. Go to: https://console.firebase.google.com
2. Select your project: **ekamanam**
3. Click on **⚙️ Settings** (gear icon)
4. Select **Usage and billing**
5. Click **Modify plan**

### Step 2: Select Blaze Plan

1. Click **"Upgrade to Blaze"**
2. Review the pricing
3. Add a **billing account** (credit/debit card)
4. Confirm upgrade

### Step 3: Set Spending Limits (Recommended)

After upgrade:
1. Go to **Usage and billing** → **Budget alerts**
2. Set a **monthly budget** (e.g., $5 or $10)
3. Enable **email notifications**
4. This protects you from unexpected charges

---

## After Upgrade

Once upgraded to Blaze plan:

```bash
# Deploy Firebase Functions
firebase deploy --only functions
```

This will deploy your Razorpay payment functions:
- ✅ createRazorpayOrder
- ✅ verifyRazorpayPayment
- ✅ razorpayWebhook
- ✅ cancelRazorpaySubscription

---

## Alternative: Use Firebase Emulator (Local Testing Only)

If you want to test locally before upgrading, you can use the Firebase Emulator:

```bash
# Install emulator
firebase init emulators

# Start emulator
firebase emulators:start --only functions
```

**Note:** This only works for local testing. For production payments, you **must** upgrade to Blaze.

---

## FAQ

### Q: Will I be charged immediately?
**A:** No, you're only charged for usage beyond the free tier. Most small to medium apps stay within the free tier.

### Q: What if I exceed the free tier?
**A:** You'll be charged based on usage. Set budget alerts to get notified before this happens.

### Q: Can I downgrade later?
**A:** Yes, but you'll lose access to Firebase Functions.

### Q: How much will Ekamanam cost?
**A:** Based on typical usage:
- **0-500 payments/month:** $0 (free tier)
- **500-2000 payments/month:** $0-2/month
- **2000+ payments/month:** $2-5/month

### Q: Are there alternatives to Firebase Functions?
**A:** Yes, you could:
1. Use **Razorpay's redirect flow** (no backend needed, but less seamless UX)
2. Host functions on **Vercel/Netlify** (free tier available)
3. Use a **simple Node.js server** on Heroku/Railway

But Firebase Functions is the most integrated solution for your current setup.

---

## Current Status

- ✅ Firebase CLI installed
- ✅ Logged in to Firebase
- ✅ Functions code ready
- ✅ Razorpay integrated
- ⏳ **Waiting for Blaze plan upgrade**

---

## Next Steps

1. **Upgrade to Blaze Plan:**
   https://console.firebase.google.com/project/ekamanam/usage/details

2. **Set Budget Alerts:**
   Protect yourself from unexpected charges

3. **Deploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

4. **Test Payments:**
   ```bash
   npm start
   ```

---

## Need Help?

- Firebase Pricing: https://firebase.google.com/pricing
- Firebase Support: https://firebase.google.com/support
- Budget Alerts Guide: https://firebase.google.com/docs/projects/billing/avoid-surprise-bills

---

**Upgrade Link:** https://console.firebase.google.com/project/ekamanam/usage/details

Once you upgrade, let me know and I'll help you deploy the functions! 🚀
