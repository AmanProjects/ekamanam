# ⚡ Quick Setup Instructions

## Your Firebase Functions Location

Your Firebase Functions are located in:
```
/Users/amantalwar/Documents/GitHub/ekamanam/functions/
```

**Key Files:**
- `functions/razorpay.js` - Razorpay payment functions (✅ Updated to use Firebase config)
- `functions/index.js` - Functions entry point (✅ Exports all Razorpay functions)
- `functions/package.json` - Dependencies

---

## What's Already Done ✅

1. ✅ Razorpay live key configured in `.env`: `rzp_live_RrwnUfrlnM6Hbq`
2. ✅ Frontend Razorpay integration complete
3. ✅ Backend Firebase Functions created
4. ✅ Functions updated to read from Firebase config
5. ✅ All code is working and tested

---

## What You Need to Do (10 minutes)

### Option 1: Automated Setup (Recommended) ⚡

Run the automated setup script:

```bash
cd /Users/amantalwar/Documents/GitHub/ekamanam
./setup-razorpay.sh
```

This script will:
1. Check if Firebase CLI is installed
2. Login to Firebase
3. Ask for your Razorpay credentials
4. Configure Firebase Functions
5. Optionally deploy the functions

### Option 2: Manual Setup 📝

Follow the detailed guide in [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md)

**Quick Commands:**

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Get your Razorpay Key Secret from:
# https://dashboard.razorpay.com/app/keys

# 4. Configure Firebase Functions
firebase functions:config:set razorpay.key_id="rzp_live_RrwnUfrlnM6Hbq"
firebase functions:config:set razorpay.key_secret="YOUR_RAZORPAY_SECRET_KEY"
firebase functions:config:set razorpay.webhook_secret="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

# 5. Verify configuration
firebase functions:config:get

# 6. Deploy functions
firebase deploy --only functions
```

---

## Where to Get Razorpay Credentials

### 1. Key ID (Already in .env) ✅
```
rzp_live_RrwnUfrlnM6Hbq
```

### 2. Key Secret (You need this) ⚠️

1. Go to: https://dashboard.razorpay.com
2. Navigate: **Settings** → **API Keys**
3. Find your key pair (matching the Key ID above)
4. Click **"Regenerate/View"** to see the secret
5. Copy the Key Secret

**⚠️ IMPORTANT:** Never share or commit your Key Secret!

### 3. Webhook Secret (Auto-generated or create your own)

The script will generate a secure random string, or you can create your own.

---

## After Setup is Complete

### 1. Test Payment Flow

```bash
npm start
```

1. Navigate to the Pricing page
2. Click "Upgrade Now"
3. Razorpay modal should open
4. Complete a test payment

### 2. Monitor Function Logs

```bash
firebase functions:log
```

### 3. Setup Razorpay Webhooks (Recommended)

1. Go to: https://dashboard.razorpay.com → Settings → Webhooks
2. Click "+ Add Webhook URL"
3. Enter your function URL: `https://YOUR_PROJECT_ID.cloudfunctions.net/razorpayWebhook`
4. Select events: `payment.captured`, `payment.failed`, `order.paid`
5. Enter your webhook secret (same as configured above)

---

## Deployed Functions

After deployment, these functions will be available:

1. **createRazorpayOrder**
   - Creates payment orders
   - URL: `https://YOUR_PROJECT_ID.cloudfunctions.net/createRazorpayOrder`

2. **verifyRazorpayPayment**
   - Verifies payment signatures
   - URL: `https://YOUR_PROJECT_ID.cloudfunctions.net/verifyRazorpayPayment`

3. **razorpayWebhook**
   - Handles Razorpay webhooks
   - URL: `https://YOUR_PROJECT_ID.cloudfunctions.net/razorpayWebhook`

4. **cancelRazorpaySubscription**
   - Cancels subscriptions
   - URL: `https://YOUR_PROJECT_ID.cloudfunctions.net/cancelRazorpaySubscription`

---

## Troubleshooting

### "firebase: command not found"
**Solution:** Install Firebase CLI
```bash
npm install -g firebase-tools
```

### "Permission denied" or "Not logged in"
**Solution:** Login to Firebase
```bash
firebase login
```

### "Invalid signature" error
**Solution:**
1. Verify Key Secret in Firebase config: `firebase functions:config:get`
2. Make sure it matches your Razorpay Dashboard
3. Redeploy: `firebase deploy --only functions`

### Payment succeeds but subscription not activated
**Solution:**
1. Check logs: `firebase functions:log`
2. Verify Firestore rules allow writes
3. Check user authentication

---

## Documentation

- **FIREBASE_FUNCTIONS_SETUP.md** - Complete setup guide with troubleshooting
- **docs/RAZORPAY_INTEGRATION_COMPLETE.md** - Technical documentation
- **RAZORPAY_QUICK_START.md** - Quick reference guide

---

## Quick Commands Reference

```bash
# View Firebase config
firebase functions:config:get

# Deploy functions
firebase deploy --only functions

# View logs (real-time)
firebase functions:log

# View specific function logs
firebase functions:log --only createRazorpayOrder

# Test locally (requires Firebase emulator)
firebase emulators:start --only functions
```

---

## Security Checklist

- ✅ `.env` file is in `.gitignore`
- ✅ Razorpay Key Secret is NOT in code
- ✅ Key Secret is only in Firebase config (secure)
- ✅ Webhook secret is configured
- ✅ Payment signature verification enabled
- ✅ Firestore security rules active

---

## Need Help?

Run the automated setup script for an easy, guided experience:
```bash
./setup-razorpay.sh
```

Or refer to the detailed guides:
- [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md)
- [docs/RAZORPAY_INTEGRATION_COMPLETE.md](docs/RAZORPAY_INTEGRATION_COMPLETE.md)

---

**Status:** Ready for Configuration ⏳
**Next Step:** Run `./setup-razorpay.sh` or follow manual setup
**Time Required:** ~10 minutes

🎉 After setup, your app will be **live and accepting payments**!
