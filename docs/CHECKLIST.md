# ✅ Firebase Functions Setup Checklist

## Progress Tracker

### Prerequisites ✅
- [x] Firebase CLI installed (v15.0.0)
- [x] Razorpay live key in `.env`
- [x] Functions code ready
- [x] Dependencies installed

---

### Setup Steps (12 minutes total)

#### 1. Login to Firebase (2 min) ⏳
```bash
firebase login
```
- [ ] Browser opened
- [ ] Logged in with Google account
- [ ] Permissions granted

#### 2. Verify Project (1 min) ⏳
```bash
firebase projects:list
firebase use YOUR_PROJECT_ID
```
- [ ] Project listed
- [ ] Project selected

#### 3. Get Razorpay Secret (2 min) ⏳
- [ ] Visited https://dashboard.razorpay.com
- [ ] Settings → API Keys
- [ ] Found key: `rzp_live_YOUR_KEY_ID`
- [ ] Copied Key Secret

#### 4. Configure Functions (3 min) ⏳
```bash
firebase functions:config:set razorpay.key_id="rzp_live_YOUR_KEY_ID"
firebase functions:config:set razorpay.key_secret="YOUR_SECRET"
firebase functions:config:set razorpay.webhook_secret="RANDOM_STRING"
firebase functions:config:get  # Verify
```
- [ ] Key ID set
- [ ] Key Secret set
- [ ] Webhook Secret set
- [ ] Configuration verified

#### 5. Deploy Functions (2 min) ⏳
```bash
firebase deploy --only functions
```
- [ ] createRazorpayOrder deployed
- [ ] verifyRazorpayPayment deployed
- [ ] razorpayWebhook deployed
- [ ] cancelRazorpaySubscription deployed

#### 6. Test Payment (2 min) ⏳
```bash
npm start
```
- [ ] App started
- [ ] Navigated to Pricing page
- [ ] Clicked "Upgrade Now"
- [ ] Razorpay modal opened
- [ ] Test payment completed
- [ ] Subscription activated

#### 7. Setup Webhooks (Optional) ⏳
- [ ] Razorpay Dashboard → Settings → Webhooks
- [ ] Added webhook URL
- [ ] Selected events
- [ ] Entered webhook secret
- [ ] Webhook created

---

## Current Status

**Step:** Login to Firebase
**Command:** `firebase login`
**File:** [NEXT_STEPS.md](NEXT_STEPS.md) has detailed instructions

---

## Quick Links

- 📖 [NEXT_STEPS.md](NEXT_STEPS.md) - Step-by-step guide
- 📚 [FIREBASE_FUNCTIONS_SETUP.md](FIREBASE_FUNCTIONS_SETUP.md) - Detailed manual
- 🎯 [docs/RAZORPAY_INTEGRATION_COMPLETE.md](docs/RAZORPAY_INTEGRATION_COMPLETE.md) - Technical docs

---

**Next Action:** Open terminal and run `firebase login`
