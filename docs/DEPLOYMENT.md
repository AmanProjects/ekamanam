# 🚀 Ekamanam - Deployment Guide

Complete guide for deploying Ekamanam to production.

---

## 📋 Pre-Deployment Checklist

- [ ] Firebase project created
- [ ] Stripe account set up with test/production keys
- [ ] Domain configured (optional)
- [ ] Environment variables prepared
- [ ] LLM API keys obtained (Gemini, Groq, etc.)

---

## 🔧 Step 1: Environment Setup

### 1.1 Create Environment File

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

### 1.2 Required Environment Variables

Edit `.env` with your actual credentials:

```env
# Stripe Keys (from https://dashboard.stripe.com/apikeys)
REACT_APP_STRIPE_PRICE_ID_STUDENT_MONTHLY=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_STUDENT_YEARLY=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_EDUCATOR_MONTHLY=price_xxxxx
REACT_APP_STRIPE_PRICE_ID_EDUCATOR_YEARLY=price_xxxxx

# Cloud Functions URLs (update after deploying functions)
REACT_APP_CLOUD_FUNCTION_URL=https://us-central1-YOUR-PROJECT.cloudfunctions.net/createCheckoutSession
REACT_APP_CLOUD_FUNCTION_URL_PORTAL=https://us-central1-YOUR-PROJECT.cloudfunctions.net/createPortalSession

# App URL (your production domain)
APP_URL=https://www.ekamanam.com
```

---

## 🔥 Step 2: Firebase Setup

### 2.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2.2 Login to Firebase

```bash
firebase login
```

### 2.3 Initialize Firebase (if not done)

```bash
firebase init
```

Select:
- ✅ Firestore (database rules & indexes)
- ✅ Functions (serverless backend)
- ✅ Hosting (web hosting)

### 2.4 Update Firebase Configuration

Edit `src/firebase/config.js` with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};
```

Get these from: Firebase Console → Project Settings → General → Your apps

---

## 💳 Step 3: Stripe Configuration

### 3.1 Create Stripe Products & Prices

1. Go to https://dashboard.stripe.com/products
2. Create two products:
   - **Student Plan** (₹299/month, ₹2,999/year)
   - **Educator Plan** (₹1,299/month, ₹12,999/year)

3. Copy the Price IDs to your `.env` file

### 3.2 Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set URL: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/stripeWebhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the Webhook Secret to Firebase Functions config (see Step 4.2)

---

## ☁️ Step 4: Deploy Cloud Functions

### 4.1 Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### 4.2 Set Function Environment Variables

```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_STRIPE_SECRET_KEY" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET" \
  app.url="https://www.ekamanam.com"
```

**For testing (use test keys):**
```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_YOUR_TEST_KEY" \
  stripe.webhook_secret="whsec_YOUR_TEST_WEBHOOK" \
  app.url="http://localhost:3000"
```

### 4.3 Deploy Functions

```bash
firebase deploy --only functions
```

Expected output:
```
✔ functions[createCheckoutSession]: Successful create operation
✔ functions[stripeWebhook]: Successful create operation
✔ functions[createPortalSession]: Successful create operation
✔ functions[getSubscriptionStatus]: Successful create operation
```

Copy the function URLs and update your `.env` file.

---

## 🗄️ Step 5: Deploy Firestore Rules & Indexes

### 5.1 Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

This deploys the rules from `firestore.rules` which ensure:
- Users can only access their own data
- Subscriptions can only be modified by Cloud Functions
- Proper authentication checks

### 5.2 Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

This creates composite indexes for efficient queries on libraries and notes collections.

---

## 🌐 Step 6: Build & Deploy Frontend

### 6.1 Install Dependencies

```bash
npm install
```

### 6.2 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

**Build includes:**
- Minified React app
- Documentation (`docs/`)
- Landing page
- Logo assets
- `.nojekyll` file for GitHub Pages

### 6.3 Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be deployed to: `https://YOUR-PROJECT.firebaseapp.com`

### 6.4 (Optional) Deploy to GitHub Pages

```bash
npm run deploy
```

This deploys to GitHub Pages at: `https://YOUR-USERNAME.github.io/ekamanam/`

---

## 🔗 Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain in Firebase

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `www.ekamanam.com`)
4. Follow DNS setup instructions

### 7.2 Update DNS Records

Add the provided A/AAAA records to your domain registrar:

```
A     @    151.101.1.195
A     @    151.101.65.195
AAAA  @    2a04:4e42::223
AAAA  @    2a04:4e42:200::223
```

Wait 24-48 hours for DNS propagation.

### 7.3 Update Environment Variables

Update `APP_URL` in Firebase Functions config:

```bash
firebase functions:config:set app.url="https://www.ekamanam.com"
firebase deploy --only functions
```

---

## 🧪 Step 8: Testing & Verification

### 8.1 Test Authentication

- [ ] Google Sign-In works
- [ ] User profile saved to Firestore
- [ ] API keys sync across devices

### 8.2 Test Subscription Flow

1. Click "Upgrade" button
2. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
3. Verify subscription status updates in Firestore
4. Test feature access (unlimited AI queries)

### 8.3 Test AI Features

- [ ] Upload PDF successfully
- [ ] Teacher Mode generates response
- [ ] Smart Explain works with text selection
- [ ] Visualizations render (3D, maps, charts)
- [ ] Multi-language support works

### 8.4 Test Stripe Webhook

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to localhost:5001/YOUR-PROJECT/us-central1/stripeWebhook
stripe trigger checkout.session.completed
```

---

## 🔍 Step 9: Monitoring & Analytics

### 9.1 Enable Firebase Analytics (Optional)

In `src/index.js`:

```javascript
import { getAnalytics } from 'firebase/analytics';
const analytics = getAnalytics(app);
```

### 9.2 Set Up Error Tracking (Recommended)

**Option 1: Sentry**

```bash
npm install @sentry/react
```

In `src/index.js`:

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});
```

**Option 2: LogRocket**

```bash
npm install logrocket
```

### 9.3 Monitor Cloud Functions

View logs:

```bash
firebase functions:log
```

Or use Firebase Console → Functions → Logs

---

## 🔐 Step 10: Security Hardening

### 10.1 Enable App Check (Recommended)

Protects your Firebase resources from abuse:

```bash
firebase init appcheck
```

### 10.2 Review Firestore Rules

Ensure rules are not overly permissive:

```bash
firebase deploy --only firestore:rules
```

### 10.3 Enable CORS for Cloud Functions

Already configured in `functions/index.js`:

```javascript
const cors = require('cors')({ origin: true });
```

For production, restrict to your domain:

```javascript
const cors = require('cors')({ origin: 'https://www.ekamanam.com' });
```

---

## 🚨 Troubleshooting

### Issue: Build Fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Functions Not Deploying

**Solution:**
```bash
cd functions
npm install
cd ..
firebase deploy --only functions --debug
```

### Issue: Stripe Webhook Not Working

**Verify:**
1. Webhook endpoint URL is correct
2. Webhook secret matches Firebase config
3. Events are selected in Stripe Dashboard
4. Check Cloud Functions logs for errors

### Issue: Firestore Permission Denied

**Solution:**
- Check `firestore.rules` are deployed
- Verify user is authenticated
- Check browser console for auth errors

### Issue: API Keys Not Syncing

**Solution:**
- Ensure user is signed in with Google
- Check Firestore permissions for `/users/{userId}`
- Clear localStorage and re-add API key

---

## 📊 Performance Optimization

### 1. Enable Caching

Already implemented in `cacheService.js` - no action needed.

### 2. Optimize Images

Use WebP format for images:

```bash
npm install imagemin imagemin-webp-webpack-plugin
```

### 3. Code Splitting (Future Enhancement)

Lazy load heavy components:

```javascript
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
```

### 4. PWA Service Worker (Future Enhancement)

Enable offline support:

```javascript
// In src/index.js
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
serviceWorkerRegistration.register();
```

---

## 🔄 Continuous Deployment

### Using GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Install Dependencies
      run: npm install

    - name: Build
      run: npm run build

    - name: Deploy to Firebase
      uses: w9jds/firebase-action@master
      with:
        args: deploy --only hosting
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Get Firebase token:

```bash
firebase login:ci
```

Add token to GitHub Secrets: Settings → Secrets → New repository secret

---

## 📞 Support & Maintenance

### Regular Tasks

- **Weekly:** Check Firebase quota usage
- **Monthly:** Review Stripe transactions
- **Quarterly:** Update dependencies (`npm audit fix`)

### Backup Strategy

Firebase automatically backs up Firestore data. For manual backups:

```bash
gcloud firestore export gs://YOUR-BUCKET/backups/$(date +%Y%m%d)
```

### Monitoring Dashboard

- **Firebase Console:** https://console.firebase.google.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Google Cloud Console:** https://console.cloud.google.com

---

## 🎉 Deployment Complete!

Your Ekamanam app is now live! 🚀

**Next Steps:**
1. Share with beta testers
2. Monitor error logs
3. Gather user feedback
4. Iterate and improve

**Need Help?**
- Firebase Docs: https://firebase.google.com/docs
- Stripe Docs: https://stripe.com/docs
- React Docs: https://react.dev

---

**Version:** 5.1.0
**Last Updated:** 2025-12-15
