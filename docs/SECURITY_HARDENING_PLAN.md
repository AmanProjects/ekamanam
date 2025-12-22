# 🔒 Security Hardening Plan for Ekamanam Admin Panel

## Current Security Status

### ✅ Secure Elements
- **Firebase API Key**: Safe to be public (access controlled by Firestore rules)
- **Firestore Rules**: Correctly configured - only `amandeep.talwar@gmail.com` has access
- **Firebase Authentication**: Required for all admin operations
- **GitHub Pages Hosting**: Appropriate for static client-side apps

### ⚠️ Security Concerns
- **EmailJS Credentials**: Public in GitHub repo - potential for abuse
- **Admin Email**: Visible in source code (minor concern)
- **Client-Side OTP Logic**: OTP generation happens in browser (can be monitored)

---

## 🛡️ Recommended Security Hardening

### Priority 1: CRITICAL (Do Immediately)

#### 1. **Secure EmailJS with Domain Restrictions**

**Steps:**
1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/admin)
2. Navigate to **Account** → **Security**
3. Enable "Restrict access to specific domains"
4. Add allowed domains:
   - `https://ekamanam.com`
   - `http://localhost:3000` (for development)
5. Save changes

**Effect:** EmailJS keys will only work from your domain, preventing abuse.

**Time:** 5 minutes  
**Difficulty:** Easy  
**Impact:** HIGH - Prevents EmailJS abuse

---

### Priority 2: HIGH (Recommended)

#### 2. **Move OTP Generation to Firebase Cloud Functions**

**Why:** Remove EmailJS credentials from client-side code entirely.

**Architecture:**
```
Client (configureadmin.html)
    ↓ (calls)
Firebase Cloud Function (generateOTP)
    ↓ (sends email via)
Nodemailer / SendGrid / EmailJS (server-side)
    ↓
Admin Email
```

**Implementation:**

**functions/index.js:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email transporter (using Gmail with app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password // App password, not real password
  }
});

exports.generateOTP = functions.https.onCall(async (data, context) => {
  // Verify request is from authorized user
  if (!context.auth || context.auth.token.email !== 'amandeep.talwar@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store in Firestore
  await admin.firestore().collection('otp').doc(context.auth.token.email).set({
    code: otp,
    expiry: expiry,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Send email
  await transporter.sendMail({
    from: '"Ekamanam Admin" <noreply@ekamanam.com>',
    to: context.auth.token.email,
    subject: '🔐 Admin Panel OTP Code',
    html: `
      <h2>Your Admin Panel Access Code</h2>
      <p>Your one-time password is:</p>
      <h1 style="font-size: 36px; letter-spacing: 4px;">${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
    `
  });

  return { success: true };
});

exports.verifyOTP = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.email !== 'amandeep.talwar@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { code } = data;
  const otpDoc = await admin.firestore()
    .collection('otp')
    .doc(context.auth.token.email)
    .get();

  if (!otpDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'No OTP found');
  }

  const otpData = otpDoc.data();
  
  if (Date.now() > otpData.expiry) {
    throw new functions.https.HttpsError('deadline-exceeded', 'OTP expired');
  }

  if (code !== otpData.code) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP');
  }

  // OTP is valid, delete it
  await otpDoc.ref.delete();

  return { success: true };
});
```

**Client-side update (configureadmin.html):**
```javascript
// Replace requestOTP() function
async function requestOTP() {
  console.log('🚀 requestOTP function called');
  showAlert('⏳ Generating OTP code...', 'info');

  try {
    // Call Cloud Function
    const generateOTP = firebase.functions().httpsCallable('generateOTP');
    const result = await generateOTP();

    if (result.data.success) {
      showAlert('✅ OTP sent to your email', 'success');
      document.getElementById('request-otp-form').classList.add('hidden');
      document.getElementById('verify-otp-form').classList.remove('hidden');
      document.getElementById('otp-code').focus();
    }
  } catch (error) {
    console.error('❌ OTP generation error:', error);
    showAlert('❌ Failed to generate OTP: ' + error.message, 'error');
  }
}

// Replace verifyOTP() function
async function verifyOTP() {
  const code = document.getElementById('otp-code').value.trim();
  
  if (code.length !== 6) {
    showAlert('⚠️ Please enter a 6-digit code', 'warning');
    return;
  }

  try {
    showAlert('⏳ Verifying code...', 'info');
    
    // Call Cloud Function
    const verifyOTPFunc = firebase.functions().httpsCallable('verifyOTP');
    const result = await verifyOTPFunc({ code });

    if (result.data.success) {
      console.log('✅ OTP verified successfully');
      isAuthenticated = true;
      
      // Create session
      const sessionData = {
        authorized: true,
        expiry: Date.now() + 60 * 60 * 1000, // 1 hour
        email: ADMIN_EMAIL
      };
      sessionStorage.setItem('admin_authenticated', JSON.stringify(sessionData));
      
      showAdminPanel();
      loadDemoAccounts();
    }
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    showAlert('❌ Invalid or expired code', 'error');
    document.getElementById('otp-code').value = '';
    document.getElementById('otp-code').focus();
  }
}
```

**Deployment:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize functions
firebase init functions

# Deploy
firebase deploy --only functions
```

**Benefits:**
- ✅ No EmailJS credentials in client code
- ✅ OTP generation happens server-side
- ✅ More control over email content and rate limiting
- ✅ Can use your own domain email

**Time:** 1-2 hours  
**Difficulty:** Moderate  
**Impact:** HIGH - Complete security

---

### Priority 3: MEDIUM (Optional Enhancements)

#### 3. **Enable Firebase App Check**

Verify requests come from your legitimate app.

```javascript
// Add to configureadmin.html
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

**Time:** 30 minutes  
**Difficulty:** Easy  
**Impact:** MEDIUM - Prevents bot abuse

---

#### 4. **Add Audit Logging**

Track all admin actions in Firestore.

```javascript
async function logAdminAction(action, details) {
  await db.collection('adminAuditLog').add({
    action: action,
    details: details,
    email: ADMIN_EMAIL,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    ip: 'client-side' // Or use a geolocation API
  });
}

// Usage
await logAdminAction('ADD_DEMO', { email: 'newdemo@example.com' });
await logAdminAction('REMOVE_DEMO', { email: 'old@example.com' });
```

**Time:** 15 minutes  
**Difficulty:** Easy  
**Impact:** MEDIUM - Forensics and compliance

---

#### 5. **Add Rate Limiting**

Prevent brute-force OTP attacks.

```javascript
// In Cloud Function
const MAX_OTP_REQUESTS = 3;
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes

exports.generateOTP = functions.https.onCall(async (data, context) => {
  // Check rate limit
  const rateLimitDoc = await admin.firestore()
    .collection('rateLimits')
    .doc(context.auth.uid)
    .get();

  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data();
    if (data.count >= MAX_OTP_REQUESTS && Date.now() - data.firstRequest < TIME_WINDOW) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many OTP requests. Please try again later.'
      );
    }
  }

  // ... generate OTP ...

  // Update rate limit
  await admin.firestore().collection('rateLimits').doc(context.auth.uid).set({
    count: admin.firestore.FieldValue.increment(1),
    firstRequest: rateLimitDoc.exists ? rateLimitDoc.data().firstRequest : Date.now(),
    lastRequest: Date.now()
  }, { merge: true });

  return { success: true };
});
```

**Time:** 30 minutes  
**Difficulty:** Moderate  
**Impact:** MEDIUM - Prevents abuse

---

## 📊 Security Comparison

| Aspect | Current | After Priority 1 | After Priority 2 |
|--------|---------|-----------------|------------------|
| EmailJS Abuse | ⚠️ Possible | ✅ Prevented | ✅ Not applicable |
| OTP Interception | ⚠️ Visible in dev tools | ⚠️ Still visible | ✅ Server-side only |
| Firestore Access | ✅ Secure | ✅ Secure | ✅ Secure |
| Client Credentials | ❌ Exposed | ✅ Domain-locked | ✅ None exposed |
| Rate Limiting | ❌ None | ❌ None | ✅ Implemented |
| Audit Trail | ❌ None | ❌ None | ✅ Implemented |

---

## 🎯 Recommended Action Plan

### Immediate (Today)
1. ✅ Enable EmailJS domain restrictions

### This Week
2. ✅ Implement Firebase Cloud Functions for OTP
3. ✅ Remove EmailJS credentials from client code
4. ✅ Deploy and test

### This Month
5. ✅ Add Firebase App Check
6. ✅ Implement audit logging
7. ✅ Add rate limiting

---

## 💡 Additional Security Best Practices

### 1. **Environment-Specific Configs**
Even though client-side code is public, use different Firebase projects for:
- Development
- Staging  
- Production

### 2. **Regular Security Audits**
- Review Firestore rules monthly
- Check Firebase Usage dashboard for anomalies
- Monitor EmailJS quota usage

### 3. **Rotate Credentials**
- Regenerate EmailJS keys every 6 months
- Review and update Firestore rules quarterly

### 4. **Backup and Recovery**
- Enable Firestore backups
- Document recovery procedures
- Test restore process

---

## 🔗 Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [EmailJS Security](https://www.emailjs.com/docs/user-guide/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** December 22, 2025  
**Author:** Ekamanam Security Team

