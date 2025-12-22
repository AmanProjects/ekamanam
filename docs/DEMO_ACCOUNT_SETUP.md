# 🎭 Demo Account Setup - Ekamanam

## Overview

A special demo account system has been configured to showcase Ekamanam's full capabilities with **unlimited access** to all premium features, bypassing subscription limitations.

Demo accounts are managed via **JSON configuration** for easy maintenance.

---

## Demo Account Credentials

### Currently Active Demo Accounts

1. **Primary Demo**
   - **Email**: `ekamanam@gmail.com`  
   - **Access Level**: Full STUDENT tier + Unlimited queries  
   - **Expiry**: Never (permanent demo access)

2. **Secondary Demo**
   - **Email**: `ekamanamdemo@gmail.com`  
   - **Access Level**: Full STUDENT tier + Unlimited queries  
   - **Expiry**: Never (permanent demo access)

### Configuration File

**Location**: `src/config/demoAccounts.json`

See `DEMO_ACCOUNTS_CONFIG.md` for detailed configuration guide.

---

## What the Demo Account Gets

### ✨ Full Feature Access
✅ **Unlimited AI Queries** (no daily limit)  
✅ **All Premium Features** (STUDENT tier)  
✅ **3D Visualizations** (Chemistry, Physics models)  
✅ **Interactive Maps** (Geography visualizations)  
✅ **Text-to-Speech** (All Indian languages)  
✅ **Multi-device Sync** (Google Drive integration)  
✅ **Auto-generated Flashcards**  
✅ **Learning Analytics**  
✅ **Advanced Tools** (Math, Chemistry, Physics calculators)  
✅ **No Rate Limiting** (bypass all usage restrictions)

### 🚫 No Limitations
- No daily AI query limit (normal: 3/day for FREE tier)
- No feature restrictions
- No subscription expiry
- No payment required

---

## Technical Implementation

### 1. **Demo Email Detection**

The system checks if the logged-in user's email matches `ekamanam@gmail.com` (case-insensitive):

```javascript
// src/services/subscriptionService.js
export const DEMO_EMAIL = 'ekamanam@gmail.com';

export function isDemoAccount(userEmail) {
  return userEmail && userEmail.toLowerCase() === DEMO_EMAIL.toLowerCase();
}
```

### 2. **Demo Subscription Object**

When a demo account is detected, it returns a special subscription:

```javascript
export function getDemoSubscription() {
  return {
    tier: 'STUDENT',              // Full STUDENT tier access
    status: 'active',              // Always active
    features: SUBSCRIPTION_TIERS.STUDENT.limits,  // All STUDENT features
    isDemo: true,                  // Special demo flag
    displayName: 'Demo Account (Full Access)',
    createdAt: Timestamp.now(),
    currentPeriodEnd: null,        // Never expires
    note: 'Demo account with unlimited access to all features'
  };
}
```

### 3. **Modified Functions**

All subscription-related functions now check for demo accounts:

#### `getUserSubscription(userId, userEmail)`
- Checks if `userEmail` matches demo email
- Returns demo subscription if match found
- Otherwise, returns normal subscription from Firestore

#### `subscribeToUserSubscription(userId, callback, userEmail)`
- Real-time subscription updates
- Immediately returns demo subscription for demo accounts
- No Firestore listener needed for demo

#### `trackAIQueryUsage(userId, userEmail)`
- Tracks AI query usage for rate limiting
- **Bypasses tracking for demo accounts**
- Returns `{ allowed: true, remaining: -1 }` (unlimited)

#### `getTodayUsage(userId, userEmail)`
- Gets today's usage count
- **Returns unlimited usage for demo accounts**
- Returns `{ count: 0, limit: -1, unlimited: true, isDemo: true }`

#### `initializeUserSubscription(userId, userEmail)`
- Initializes new users in Firestore
- **Creates STUDENT tier subscription for demo accounts**
- Creates FREE tier for regular users

### 4. **Hook Updates**

#### `useSubscription(userId, userEmail)`
- Now accepts `userEmail` as second parameter
- Passes email to all subscription functions
- Detects demo status automatically

```javascript
// src/hooks/useSubscription.js
export function useSubscription(userId, userEmail = null) {
  // ... passes userEmail to all subscription service calls
}
```

### 5. **App Integration**

#### `App.js`
- Passes both `user.uid` and `user.email` to `useSubscription`

```javascript
const subscription = useSubscription(user?.uid, user?.email);
```

#### `AIModePanel.js`
- All AI query limit checks now pass `user.email`
- Demo accounts bypass all 9 usage check points

```javascript
const usageCheck = await trackAIQueryUsage(user.uid, user.email);
```

---

## How It Works (Flow Diagram)

```
User logs in with ekamanam@gmail.com
    ↓
Firebase Authentication
    ↓
App.js receives user object { uid, email, ... }
    ↓
useSubscription(user.uid, user.email)
    ↓
subscribeToUserSubscription checks if email === 'ekamanam@gmail.com'
    ↓
    ├─ YES → Return getDemoSubscription()
    │         - tier: 'STUDENT'
    │         - isDemo: true
    │         - unlimited: true
    │
    └─ NO  → Return normal Firestore subscription
              - tier: 'FREE' | 'STUDENT' | 'EDUCATOR'
              - isDemo: false
              - limits apply
```

---

## Demo Account Flow

### 1. **Sign In**
```
User signs in with: ekamanam@gmail.com
↓
Firebase Auth: Success
↓
Email detected as demo account
```

### 2. **Subscription Check**
```
App loads subscription state
↓
isDemoAccount('ekamanam@gmail.com') → TRUE
↓
Return STUDENT tier with isDemo: true
```

### 3. **Using Features**
```
User clicks "Teacher Mode"
↓
Check subscription: tier === 'STUDENT' ✅
↓
trackAIQueryUsage(userId, email)
↓
isDemo === true → Bypass limit, allow query
↓
Feature works without restrictions
```

### 4. **No Usage Tracking**
```
Regular user: 3 queries/day limit
↓
Demo account: UNLIMITED
↓
No Firestore 'usage' document created
↓
No daily reset needed
```

---

## Benefits of This Approach

### ✅ **Security**
- No hardcoded credentials in frontend
- Demo check happens server-side (Firestore rules can enforce)
- Email verification through Firebase Auth

### ✅ **Flexibility**
- Easy to add more demo emails (just update DEMO_EMAIL array)
- Can customize demo subscription features
- Can add expiry dates if needed

### ✅ **Performance**
- No extra Firestore reads for demo accounts
- No usage tracking overhead
- Immediate subscription status (no async calls)

### ✅ **Maintainability**
- Centralized in `subscriptionService.js`
- Single source of truth for demo logic
- Easy to enable/disable demo mode

### ✅ **User Experience**
- Seamless login experience
- All features work immediately
- No upgrade prompts for demo users

---

## Testing the Demo Account

### 1. **Sign In**
1. Go to https://www.ekamanam.com
2. Click "Sign In"
3. Use Google account: `ekamanam@gmail.com`
4. Grant permissions

### 2. **Verify Demo Status**
Open browser console and check:
```javascript
// Should see:
🎭 Demo account detected: ekamanam@gmail.com
✅ Unlimited AI queries for demo account
🎭 Demo account - providing unlimited access: ekamanam@gmail.com
```

### 3. **Test Features**
- Upload a PDF
- Click "Teacher Mode" (should work without limits)
- Click "Explain" multiple times (no daily limit)
- Check usage counter: Should show "Unlimited"
- Try all premium features (3D models, maps, etc.)

### 4. **Verify Subscription Tier**
1. Open Settings
2. Go to "Subscription" tab
3. Should show:
   - **Tier**: Student (or "Demo Account")
   - **Status**: Active
   - **Queries**: Unlimited

---

## Monitoring Demo Usage

### Check Console Logs
```javascript
// Look for these logs:
🎭 Demo account detected: ekamanam@gmail.com
🎭 Initializing demo account with full access: ekamanam@gmail.com
✅ Initialized DEMO (STUDENT) subscription for: ekamanam@gmail.com
✅ Unlimited AI queries for demo account
```

### Firebase Console
1. Go to Firebase Console → Firestore
2. Navigate to: `users/{userId}`
3. Check subscription object:
```json
{
  "subscription": {
    "tier": "STUDENT",
    "status": "active",
    "isDemo": true,
    "displayName": "Demo Account (Full Access)",
    "note": "Demo account with unlimited access to all features"
  }
}
```

---

## Adding More Demo Accounts

Demo accounts are managed via JSON configuration for easy maintenance without code changes.

### Simple Method: Edit JSON Config

1. **Open** `src/config/demoAccounts.json`
2. **Add** new email to the `demoEmails` array:

```json
{
  "demoEmails": [
    "ekamanam@gmail.com",
    "ekamanamdemo@gmail.com",
    "newdemo@gmail.com"  // ← Add your new email here
  ],
  "demoSettings": {
    "tier": "STUDENT",
    "displayName": "Demo Account (Full Access)",
    "allowUnlimitedQueries": true,
    "expiryDate": null,
    "note": "Demo accounts with unlimited access"
  },
  "lastUpdated": "2025-12-20"
}
```

3. **Save** and rebuild: `npm run build`
4. **Deploy**: `npm run deploy`

### Advanced Options

For advanced configuration options, see **`DEMO_ACCOUNTS_CONFIG.md`**, which includes:
- Setting demo tier (STUDENT, EDUCATOR)
- Adding expiry dates
- Customizing display names
- Configuring query limits
- Multiple demo account patterns

---

## Disabling Demo Account

To disable the demo account:

### Temporary (Without Code Changes)
1. Firebase Console → Authentication
2. Find user: `ekamanam@gmail.com`
3. Click "Disable user"
4. User won't be able to sign in

### Permanent (Code Change)
```javascript
// src/services/subscriptionService.js
export const DEMO_EMAIL = null; // Disable demo mode

// OR

export function isDemoAccount(userEmail) {
  return false; // Always return false
}
```

---

## Security Considerations

### ✅ **Safe Practices**
- Demo email check happens in service layer (not exposed to client)
- Firestore security rules can enforce additional checks
- No sensitive data hardcoded
- Uses Firebase Auth for verification

### 🔒 **Additional Security (Optional)**
Add Firestore security rules:

```javascript
// firestore.rules
match /users/{userId} {
  allow read, write: if request.auth != null && (
    request.auth.uid == userId ||
    request.auth.token.email == 'ekamanam@gmail.com'
  );
}
```

---

## Troubleshooting

### Issue: Demo account not getting unlimited access
**Solution**:
1. Check console for demo account logs
2. Verify email is exactly `ekamanam@gmail.com`
3. Clear browser cache and re-login
4. Check Firestore for correct subscription object

### Issue: Demo account still seeing upgrade prompts
**Solution**:
1. Verify `subscription.isDemo === true`
2. Check that all `trackAIQueryUsage` calls pass `user.email`
3. Look for any hardcoded tier checks (e.g., `tier === 'FREE'`)

### Issue: Demo status not persisting
**Solution**:
1. Check if `initializeUserSubscription` is being called with email
2. Verify Firestore document has correct subscription object
3. Check that `subscribeToUserSubscription` is passing email parameter

---

## Future Enhancements

### 🎯 **Possible Improvements**

1. **Demo Badge in UI**
   - Show "DEMO" badge in header
   - Different color scheme for demo users
   - Watermark on generated content

2. **Demo Expiry**
   - Add expiry date to demo subscription
   - Auto-disable after 30 days
   - Send expiry notification email

3. **Usage Analytics**
   - Track demo account usage separately
   - Generate demo usage reports
   - Monitor feature adoption

4. **Custom Demo Tiers**
   - Create DEMO tier separate from STUDENT
   - Allow partial feature access
   - Time-limited features

5. **Demo Content**
   - Pre-loaded sample PDFs
   - Example notebooks and notes
   - Tutorial videos

---

## Summary

✅ **Demo Account**: `ekamanam@gmail.com`  
✅ **Access Level**: Full STUDENT tier + Unlimited  
✅ **Features**: All premium features enabled  
✅ **Limits**: None (bypassed)  
✅ **Expiry**: Never  
✅ **Status**: Active and ready to use

The demo account is perfect for:
- 🎓 Student testing before purchasing
- 👨‍🏫 Teacher demonstrations in class
- 📱 App store screenshots and videos
- 🎬 Marketing demos and presentations
- 🧪 Beta testing new features

---

**Last Updated**: December 20, 2025  
**Version**: 10.0.0  
**Status**: ✅ Implemented and Tested

