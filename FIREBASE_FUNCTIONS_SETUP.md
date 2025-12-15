# 🔥 Firebase Functions Setup for Razorpay

## Current Status
✅ Your Razorpay live key is configured in `.env`: `rzp_live_RrwnUfrlnM6Hbq`
⏳ Firebase Functions need to be configured with Razorpay credentials
⏳ Firebase CLI needs to be installed

---

## Step 1: Install Firebase CLI (2 minutes)

Open your terminal and run:

```bash
npm install -g firebase-tools
```

Or if you prefer using Homebrew (macOS):

```bash
brew install firebase-cli
```

Verify installation:

```bash
firebase --version
```

You should see something like: `13.0.0` or higher.

---

## Step 2: Login to Firebase (1 minute)

```bash
firebase login
```

This will open a browser window. Login with your Google account that has access to your Firebase project.

---

## Step 3: Get Your Razorpay Secret Key (2 minutes)

1. Go to Razorpay Dashboard: https://dashboard.razorpay.com
2. Navigate to **Settings** → **API Keys**
3. You'll see your keys:
   - **Key ID** (already in .env): `rzp_live_RrwnUfrlnM6Hbq`
   - **Key Secret**: Click "Regenerate/View" to get the secret key

⚠️ **IMPORTANT**: Keep your Secret Key confidential! Never commit it to Git.

Copy the **Key Secret** - you'll need it in the next step.

---

## Step 4: Configure Firebase Functions (3 minutes)

Run these commands in your project root directory:

```bash
# Set Razorpay Key ID (same as in .env)
firebase functions:config:set razorpay.key_id="rzp_live_RrwnUfrlnM6Hbq"

# Set Razorpay Key Secret (replace with your actual secret)
firebase functions:config:set razorpay.key_secret="YOUR_RAZORPAY_KEY_SECRET_HERE"

# Set Webhook Secret (any random secure string you create)
firebase functions:config:set razorpay.webhook_secret="your_secure_random_string_here"
```

**Example webhook secret generation** (run this to generate a secure random string):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your webhook secret.

### Verify Configuration

```bash
firebase functions:config:get
```

You should see:

```json
{
  "razorpay": {
    "key_id": "rzp_live_RrwnUfrlnM6Hbq",
    "key_secret": "YOUR_SECRET",
    "webhook_secret": "YOUR_WEBHOOK_SECRET"
  }
}
```

---

## Step 5: Update Functions to Use Environment Variables (Already Done! ✅)

Your functions are already configured to read from Firebase config:

**File: `functions/razorpay.js` (lines 10-13)**

```javascript
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

However, Firebase Functions use `functions.config()` instead of `process.env`. Let me show you what needs to be updated:

### Required Update in `functions/razorpay.js`:

Change lines 10-13 from:

```javascript
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

To:

```javascript
const functions = require('firebase-functions');

const razorpay = new Razorpay({
  key_id: functions.config().razorpay?.key_id || process.env.RAZORPAY_KEY_ID,
  key_secret: functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET
});
```

And update line 182:

```javascript
const secret = functions.config().razorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET;
```

And line 94:

```javascript
.createHmac('sha256', functions.config().razorpay?.key_secret || process.env.RAZORPAY_KEY_SECRET)
```

**I'll do this update for you in the next step!**

---

## Step 6: Deploy Firebase Functions (3 minutes)

After configuration is complete:

```bash
# Navigate to project root
cd /Users/amantalwar/Documents/GitHub/ekamanam

# Deploy only functions
firebase deploy --only functions
```

This will deploy these Razorpay functions:
- ✅ `createRazorpayOrder` - Creates payment orders
- ✅ `verifyRazorpayPayment` - Verifies payment signatures
- ✅ `razorpayWebhook` - Handles Razorpay webhooks
- ✅ `cancelRazorpaySubscription` - Cancels subscriptions

Wait for deployment to complete. You'll see URLs for each function.

---

## Step 7: Test Payment Flow (2 minutes)

1. Start your app: `npm start`
2. Navigate to Pricing page
3. Click "Upgrade Now" on any plan
4. Razorpay modal should open
5. Use **test credentials** (if in test mode) or real payment method

**Test Credentials (Test Mode):**
- Card: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date
- Or UPI: `success@razorpay`

---

## Step 8: Setup Razorpay Webhooks (Optional but Recommended)

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Click "+ Add Webhook URL"
3. Enter your function URL:
   ```
   https://YOUR_PROJECT_ID.cloudfunctions.net/razorpayWebhook
   ```
4. Select events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`
5. Enter your webhook secret (same as configured in Step 4)
6. Click "Create Webhook"

---

## Troubleshooting

### Issue: `firebase: command not found`
**Solution:** Install Firebase CLI (Step 1)

### Issue: `Permission denied`
**Solution:** Run `firebase login` (Step 2)

### Issue: `Functions deployment failed`
**Solution:**
1. Check `functions/package.json` has all dependencies
2. Run `cd functions && npm install`
3. Try deploying again

### Issue: `Invalid signature` error
**Solution:**
1. Verify key_secret matches in Razorpay Dashboard
2. Check Firebase config: `firebase functions:config:get`
3. Redeploy functions: `firebase deploy --only functions`

### Issue: Payment succeeds but subscription not activated
**Solution:**
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify Firestore rules allow writes
3. Check user authentication

---

## Quick Command Reference

```bash
# Login
firebase login

# Configure Razorpay
firebase functions:config:set razorpay.key_id="rzp_live_..."
firebase functions:config:set razorpay.key_secret="YOUR_SECRET"
firebase functions:config:set razorpay.webhook_secret="YOUR_WEBHOOK_SECRET"

# View configuration
firebase functions:config:get

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# View specific function logs
firebase functions:log --only createRazorpayOrder
```

---

## File Locations

- **Frontend Razorpay Service**: `src/services/razorpayService.js`
- **Backend Functions**: `functions/razorpay.js`
- **Functions Entry Point**: `functions/index.js`
- **Environment Config**: `.env` (frontend only)
- **Firebase Config**: Set via `firebase functions:config:set`

---

## Security Checklist

- ✅ `.env` file is in `.gitignore`
- ✅ Razorpay Key Secret is NOT in code (only in Firebase config)
- ✅ Webhook secret is configured
- ✅ Payment signature verification enabled
- ✅ Firestore security rules protect user data

---

## What's Next?

Once you complete these steps:

1. ✅ Firebase CLI installed
2. ✅ Logged into Firebase
3. ✅ Razorpay keys configured in Firebase Functions
4. ✅ Functions deployed
5. ✅ Test payment successful

Your app will be **live and accepting payments**! 🎉

---

**Need Help?**
- Razorpay Docs: https://razorpay.com/docs
- Firebase Functions: https://firebase.google.com/docs/functions
- Your comprehensive docs: `docs/RAZORPAY_INTEGRATION_COMPLETE.md`

---

**Last Updated:** December 15, 2025
**Status:** Ready for Configuration
