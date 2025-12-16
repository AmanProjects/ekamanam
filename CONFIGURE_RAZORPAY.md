# 🔐 Configure Razorpay Keys - Step by Step Guide

## Two Options to Configure:

### Option 1: Automated Script (Recommended) ⚡

Run the automated configuration script:

```bash
./configure-razorpay.sh
```

This script will:
- ✅ Check Firebase login
- ✅ Guide you through getting your Key Secret
- ✅ Set all Razorpay configuration
- ✅ Verify the configuration
- ✅ Optionally deploy functions

**Just follow the prompts!**

---

### Option 2: Manual Configuration 📝

If you prefer to do it manually, follow these steps:

---

## Step 1: Get Your Razorpay Key Secret (2 minutes)

### 1.1 Visit Razorpay Dashboard

Go to: **https://dashboard.razorpay.com**

### 1.2 Navigate to API Keys

In the left sidebar:
- Click **"Settings"** (gear icon)
- Click **"API Keys"**

### 1.3 Find Your Key

Look for the key pair with Key ID: **`rzp_live_YOUR_KEY_ID`**

### 1.4 Reveal the Secret

- Click **"Regenerate/View"** or **"Show Key"** button
- You'll see your Key Secret (format: `rzp_live_xxxxxxxxxxxxxxxx`)
- **Copy this secret** - you'll need it in the next step

⚠️ **IMPORTANT:** Never share this secret or commit it to Git!

---

## Step 2: Configure Firebase Functions (3 minutes)

### 2.1 Open Terminal

Make sure you're in your project directory:

```bash
cd /Users/amantalwar/Documents/GitHub/ekamanam
```

### 2.2 Set Razorpay Key ID

```bash
firebase functions:config:set razorpay.key_id="rzp_live_YOUR_KEY_ID"
```

You should see: ✔ Functions config updated.

### 2.3 Set Razorpay Key Secret

**Replace `YOUR_ACTUAL_SECRET` with the secret you copied in Step 1:**

```bash
firebase functions:config:set razorpay.key_secret="YOUR_ACTUAL_SECRET"
```

Example (don't use this - use your own):
```bash
firebase functions:config:set razorpay.key_secret="rzp_live_abc123xyz789def456"
```

You should see: ✔ Functions config updated.

### 2.4 Set Webhook Secret

This is already generated for you:

```bash
firebase functions:config:set razorpay.webhook_secret="d7b324af53c4e0c889ea767e48aa7fdfd743d6ea288c6c64b5108d7cd6af625a"
```

You should see: ✔ Functions config updated.

---

## Step 3: Verify Configuration (30 seconds)

Check that all keys are set correctly:

```bash
firebase functions:config:get
```

You should see:

```json
{
  "razorpay": {
    "key_id": "rzp_live_YOUR_KEY_ID",
    "key_secret": "rzp_live_xxxxx...",
    "webhook_secret": "d7b324af53c4e0c889ea767e48aa7fdfd743d6ea288c6c64b5108d7cd6af625a"
  }
}
```

✅ If you see all three keys, you're good to go!

---

## Step 4: Redeploy Functions (2 minutes)

The functions need to be redeployed to use the new configuration:

```bash
firebase deploy --only functions
```

Wait for deployment to complete. You should see:

```
✔ Deploy complete!
```

---

## Step 5: Test Payment Flow (2 minutes)

### 5.1 Start Your App

```bash
npm start
```

### 5.2 Navigate to Pricing Page

Open your browser and go to the Pricing page.

### 5.3 Click "Upgrade Now"

Click the "Upgrade Now" button on any plan (Student or Educator).

### 5.4 Razorpay Modal Should Open

You should see the Razorpay payment modal with:
- Ekamanam logo
- Plan details
- Payment options (UPI, Card, Net Banking, Wallets)

### 5.5 Complete Test Payment

**Test Card (Success):**
- Card Number: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date (e.g., `12/26`)
- Name: Any name

**Or Test UPI:**
- UPI ID: `success@razorpay`

### 5.6 Verify Success

After payment:
- ✅ Success message appears
- ✅ Page reloads
- ✅ Subscription tier updates
- ✅ Features unlock

---

## Step 6: Setup Webhooks (Optional - 2 minutes)

Webhooks ensure payment status updates even if users close their browser.

### 6.1 Go to Razorpay Dashboard

Visit: **https://dashboard.razorpay.com**

### 6.2 Navigate to Webhooks

- Settings → Webhooks
- Click **"+ Add Webhook URL"**

### 6.3 Enter Webhook URL

```
https://us-central1-ekamanam.cloudfunctions.net/razorpayWebhook
```

### 6.4 Select Events

Check these events:
- ✅ `payment.captured`
- ✅ `payment.failed`
- ✅ `order.paid`

### 6.5 Enter Webhook Secret

```
d7b324af53c4e0c889ea767e48aa7fdfd743d6ea288c6c64b5108d7cd6af625a
```

### 6.6 Save Webhook

Click **"Create Webhook"** or **"Save"**.

---

## 🎉 You're Done!

Your payment system is now fully configured and ready to accept real payments!

---

## 📊 Configuration Summary

| Item | Value | Status |
|------|-------|--------|
| **Key ID** (Frontend) | `rzp_live_YOUR_KEY_ID` | ✅ In `.env` |
| **Key ID** (Backend) | `rzp_live_YOUR_KEY_ID` | ⏳ Set in Step 2.2 |
| **Key Secret** (Backend) | Your secret from dashboard | ⏳ Set in Step 2.3 |
| **Webhook Secret** | Auto-generated | ⏳ Set in Step 2.4 |
| **Functions Deployed** | All 4 Razorpay functions | ✅ Already done |

---

## 🔍 Troubleshooting

### Issue: "Functions config not found"

**Solution:** Make sure you're logged in to Firebase:
```bash
firebase login
```

### Issue: "Permission denied"

**Solution:** Verify you have admin access to the Firebase project.

### Issue: Config set successfully but functions still fail

**Solution:** Redeploy the functions:
```bash
firebase deploy --only functions
```

### Issue: Payment succeeds but subscription not activated

**Solution:**
1. Check logs: `firebase functions:log --only verifyRazorpayPayment`
2. Verify Key Secret is correct
3. Redeploy if needed

---

## 📚 Quick Commands Reference

```bash
# View current configuration
firebase functions:config:get

# Set a specific key
firebase functions:config:set razorpay.key_id="VALUE"

# Remove a key (if needed)
firebase functions:config:unset razorpay.key_id

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# Test locally (requires emulator)
firebase emulators:start --only functions
```

---

## 🎯 Checklist

- [ ] Got Razorpay Key Secret from dashboard
- [ ] Set `razorpay.key_id` in Firebase config
- [ ] Set `razorpay.key_secret` in Firebase config
- [ ] Set `razorpay.webhook_secret` in Firebase config
- [ ] Verified config with `firebase functions:config:get`
- [ ] Redeployed functions with `firebase deploy --only functions`
- [ ] Started app with `npm start`
- [ ] Tested payment flow successfully
- [ ] Setup Razorpay webhooks (optional)

---

## 🆘 Need Help?

- **Razorpay Docs:** https://razorpay.com/docs
- **Firebase Functions Config:** https://firebase.google.com/docs/functions/config-env
- **Your Guides:**
  - [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)
  - [NEXT_STEPS.md](NEXT_STEPS.md)
  - [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md)

---

**Total Time:** ~10 minutes
**Current Step:** Get Razorpay Key Secret
**Script:** Run `./configure-razorpay.sh` for guided setup
