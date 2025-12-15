# 🚀 Next Steps - Firebase Functions Configuration

## ✅ What's Done:
- ✅ Firebase CLI installed (version 15.0.0)
- ✅ Razorpay live key in `.env`: `rzp_live_RrwnUfrlnM6Hbq`
- ✅ Functions code updated and ready
- ✅ All dependencies installed

## 📍 What You Need to Do Now:

### Step 1: Login to Firebase (2 minutes)

Run this command in your terminal:

```bash
firebase login
```

This will:
1. Open a browser window
2. Ask you to login with your Google account
3. Grant permissions to Firebase CLI

**Choose the Google account that has access to your Ekamanam Firebase project.**

---

### Step 2: Verify Your Firebase Project (1 minute)

After logging in, check your Firebase projects:

```bash
firebase projects:list
```

You should see your Ekamanam project listed. Note the **Project ID**.

If you need to select/use a specific project:

```bash
firebase use YOUR_PROJECT_ID
```

---

### Step 3: Get Your Razorpay Key Secret (2 minutes)

1. Visit: https://dashboard.razorpay.com
2. Login to your account
3. Go to: **Settings** → **API Keys**
4. Find the key pair with Key ID: `rzp_live_RrwnUfrlnM6Hbq`
5. Click **"Regenerate/View"** to reveal the Key Secret
6. Copy the Key Secret (it will look like: `rzp_live_xxxxxxxxxxxxxxxx`)

⚠️ **IMPORTANT:** Keep this secret confidential! Never share it or commit it to Git.

---

### Step 4: Configure Firebase Functions (3 minutes)

Run these commands one by one:

```bash
# Set Razorpay Key ID
firebase functions:config:set razorpay.key_id="rzp_live_RrwnUfrlnM6Hbq"

# Set Razorpay Key Secret (replace with YOUR actual secret from Step 3)
firebase functions:config:set razorpay.key_secret="YOUR_RAZORPAY_KEY_SECRET_HERE"

# Generate and set Webhook Secret
firebase functions:config:set razorpay.webhook_secret="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
```

**Verify the configuration:**

```bash
firebase functions:config:get
```

You should see:

```json
{
  "razorpay": {
    "key_id": "rzp_live_RrwnUfrlnM6Hbq",
    "key_secret": "rzp_live_xxxxx...",
    "webhook_secret": "some_long_hex_string..."
  }
}
```

---

### Step 5: Deploy Firebase Functions (2 minutes)

Deploy the Razorpay functions to Firebase:

```bash
firebase deploy --only functions
```

This will deploy 4 functions:
- ✅ createRazorpayOrder
- ✅ verifyRazorpayPayment
- ✅ razorpayWebhook
- ✅ cancelRazorpaySubscription

**Wait for deployment to complete.** You'll see URLs for each function.

---

### Step 6: Test Payment Flow (2 minutes)

1. Start your app:
   ```bash
   npm start
   ```

2. Navigate to the Pricing page

3. Click **"Upgrade Now"** on any plan

4. Razorpay payment modal should open

5. Complete a test payment:
   - **Card:** `4111 1111 1111 1111`
   - **CVV:** `123`
   - **Expiry:** Any future date (e.g., `12/25`)
   - Or use **UPI:** `success@razorpay`

6. After payment, your subscription should be activated! 🎉

---

### Step 7: Setup Webhooks (Optional but Recommended)

Webhooks ensure payment status updates are received even if the user closes the browser:

1. Go to: https://dashboard.razorpay.com
2. Navigate: **Settings** → **Webhooks**
3. Click **"+ Add Webhook URL"**
4. Enter your function URL:
   ```
   https://YOUR_PROJECT_ID.cloudfunctions.net/razorpayWebhook
   ```
   *(Replace `YOUR_PROJECT_ID` with your actual Firebase project ID)*

5. Select these events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
   - ✅ `order.paid`

6. Get your webhook secret:
   ```bash
   firebase functions:config:get razorpay.webhook_secret
   ```

7. Enter the webhook secret in Razorpay Dashboard

8. Click **"Create Webhook"**

---

## 🎯 Quick Command Reference

```bash
# Login to Firebase
firebase login

# List projects
firebase projects:list

# Use a specific project
firebase use PROJECT_ID

# Set configuration
firebase functions:config:set KEY="VALUE"

# View configuration
firebase functions:config:get

# Deploy functions
firebase deploy --only functions

# View logs (real-time)
firebase functions:log

# View specific function logs
firebase functions:log --only createRazorpayOrder
```

---

## 🔍 Troubleshooting

### Issue: "Failed to authenticate"
**Solution:** Run `firebase login`

### Issue: "No project active"
**Solution:**
1. List projects: `firebase projects:list`
2. Use project: `firebase use YOUR_PROJECT_ID`

### Issue: "Permission denied" during deployment
**Solution:**
1. Check you're logged in: `firebase projects:list`
2. Verify you have admin access to the Firebase project
3. Try logging in again: `firebase logout` then `firebase login`

### Issue: "Invalid signature" error during payment
**Solution:**
1. Verify Key Secret matches Razorpay Dashboard
2. Check config: `firebase functions:config:get`
3. Redeploy: `firebase deploy --only functions`

### Issue: Payment succeeds but subscription not activated
**Solution:**
1. Check logs: `firebase functions:log`
2. Look for the `verifyRazorpayPayment` function logs
3. Verify Firestore rules allow writes to the `users` collection

---

## 📚 Documentation

- **This file** - Quick next steps
- **[FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md)** - Detailed setup guide
- **[docs/RAZORPAY_INTEGRATION_COMPLETE.md](docs/RAZORPAY_INTEGRATION_COMPLETE.md)** - Technical documentation
- **[RAZORPAY_QUICK_START.md](RAZORPAY_QUICK_START.md)** - Quick reference

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ Firebase CLI is logged in
✅ Firebase Functions config is set
✅ Functions are deployed successfully
✅ Razorpay payment modal opens
✅ Test payment succeeds
✅ Subscription is activated in your app
✅ You see success message and features unlock

---

## 🆘 Need Help?

If you encounter any issues:

1. **Check logs:** `firebase functions:log`
2. **Verify config:** `firebase functions:config:get`
3. **Refer to:** [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md)

---

**Total Time:** ~12 minutes
**Current Status:** Ready for Firebase login
**Next Command:** `firebase login`

Good luck! 🚀
