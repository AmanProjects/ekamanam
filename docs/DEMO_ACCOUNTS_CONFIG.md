# 🎭 Demo Accounts Configuration Guide

## Overview

Ekamanam uses a **JSON-based configuration system** for managing demo accounts. This makes it easy to add, remove, or modify demo accounts without touching the code.

---

## 📁 Configuration File

**Location**: `src/config/demoAccounts.json`

```json
{
  "demoEmails": [
    "ekamanam@gmail.com",
    "ekamanamdemo@gmail.com"
  ],
  "demoSettings": {
    "tier": "STUDENT",
    "displayName": "Demo Account (Full Access)",
    "allowUnlimitedQueries": true,
    "expiryDate": null,
    "note": "Demo accounts with unlimited access to all premium features"
  },
  "lastUpdated": "2025-12-20",
  "version": "1.0.0"
}
```

---

## 🔧 Configuration Options

### `demoEmails` (Array)
**Required**: Yes  
**Type**: Array of strings  
**Description**: List of email addresses that should be treated as demo accounts

**Example**:
```json
"demoEmails": [
  "ekamanam@gmail.com",
  "ekamanamdemo@gmail.com",
  "demo@ekamanam.com",
  "test@ekamanam.com"
]
```

**Notes**:
- Emails are case-insensitive
- Leading/trailing spaces are automatically trimmed
- Can add unlimited demo emails
- Each email must be a valid Gmail/Google account

---

### `demoSettings` (Object)

Configuration for demo account features and behavior.

#### `tier` (String)
**Default**: `"STUDENT"`  
**Options**: `"FREE"`, `"STUDENT"`, `"EDUCATOR"`  
**Description**: Subscription tier to grant demo accounts

```json
"tier": "STUDENT"
```

#### `displayName` (String)
**Default**: `"Demo Account (Full Access)"`  
**Description**: Display name shown in UI for demo accounts

```json
"displayName": "Demo Account (Full Access)"
```

#### `allowUnlimitedQueries` (Boolean)
**Default**: `true`  
**Description**: Whether demo accounts bypass AI query limits

```json
"allowUnlimitedQueries": true
```

#### `expiryDate` (String | null)
**Default**: `null`  
**Format**: `"YYYY-MM-DD"` or `null`  
**Description**: When demo accounts should expire (null = never)

```json
"expiryDate": null          // Never expires
"expiryDate": "2025-12-31"  // Expires on Dec 31, 2025
```

#### `note` (String)
**Default**: `"Demo accounts with unlimited access"`  
**Description**: Internal note about demo account purpose

```json
"note": "Demo accounts for student testing and demonstrations"
```

---

### `lastUpdated` (String)
**Format**: `"YYYY-MM-DD"`  
**Description**: Date when config was last modified (for tracking)

```json
"lastUpdated": "2025-12-20"
```

---

### `version` (String)
**Format**: `"X.Y.Z"`  
**Description**: Config file version (for compatibility tracking)

```json
"version": "1.0.0"
```

---

## ➕ Adding New Demo Accounts

### Method 1: Direct JSON Edit (Recommended)

1. **Open** `src/config/demoAccounts.json`
2. **Add** new email to `demoEmails` array:

```json
{
  "demoEmails": [
    "ekamanam@gmail.com",
    "ekamanamdemo@gmail.com",
    "newdemo@gmail.com"  // ← Add here
  ],
  "demoSettings": { ... },
  "lastUpdated": "2025-12-20"  // ← Update date
}
```

3. **Save** and rebuild: `npm run build`
4. **Deploy**: `npm run deploy`

### Method 2: Using Code (If Needed)

```javascript
// src/services/subscriptionService.js
import demoAccountsConfig from '../config/demoAccounts.json';

// Access demo emails
const emails = demoAccountsConfig.demoEmails;
console.log('Demo emails:', emails);
```

---

## 🗑️ Removing Demo Accounts

### Option 1: Remove Specific Email

Edit `src/config/demoAccounts.json`:

```json
{
  "demoEmails": [
    "ekamanam@gmail.com",
    // "ekamanamdemo@gmail.com"  ← Comment out or delete
  ]
}
```

### Option 2: Disable All Demo Accounts

Set `demoEmails` to empty array:

```json
{
  "demoEmails": [],  // All demo accounts disabled
  "demoSettings": { ... }
}
```

### Option 3: Expire Demo Accounts

Add expiry date:

```json
{
  "demoSettings": {
    "expiryDate": "2025-01-01"  // Demos expire Jan 1, 2025
  }
}
```

---

## ⚙️ Modifying Demo Features

### Change Subscription Tier

Grant EDUCATOR tier instead of STUDENT:

```json
{
  "demoSettings": {
    "tier": "EDUCATOR",  // Changed from STUDENT
    "displayName": "Demo Account (Educator Access)"
  }
}
```

### Add Query Limits

Limit demo accounts to 10 queries per day:

```json
{
  "demoSettings": {
    "allowUnlimitedQueries": false,  // Changed from true
    "queryLimit": 10  // Add custom limit
  }
}
```

**Note**: Requires code modification in `trackAIQueryUsage()` to implement custom limit.

### Set Expiry Date

Demo accounts expire after 30 days:

```json
{
  "demoSettings": {
    "expiryDate": "2025-01-20"  // 30 days from now
  }
}
```

---

## 🔍 How It Works

### 1. Config Loading

```javascript
// src/services/subscriptionService.js
import demoAccountsConfig from '../config/demoAccounts.json';

const DEMO_EMAILS = demoAccountsConfig.demoEmails || [];
const DEMO_SETTINGS = demoAccountsConfig.demoSettings || {};
```

### 2. Email Checking

```javascript
export function isDemoAccount(userEmail) {
  if (!userEmail) return false;
  
  const normalizedEmail = userEmail.toLowerCase().trim();
  
  // Check against all emails in config
  return DEMO_EMAILS.some(demoEmail => 
    normalizedEmail === demoEmail.toLowerCase().trim()
  );
}
```

### 3. Subscription Generation

```javascript
export function getDemoSubscription() {
  const tier = DEMO_SETTINGS.tier || 'STUDENT';
  const displayName = DEMO_SETTINGS.displayName || 'Demo Account';
  
  return {
    tier: tier,
    status: 'active',
    features: SUBSCRIPTION_TIERS[tier].limits,
    isDemo: true,
    displayName: displayName,
    // ... more fields from config
  };
}
```

---

## 🧪 Testing Demo Accounts

### Test New Demo Email

1. **Add email** to config:
```json
"demoEmails": ["test@gmail.com"]
```

2. **Rebuild**:
```bash
npm run build
```

3. **Test locally**:
```bash
npm start
# Login with test@gmail.com
```

4. **Check console** for logs:
```javascript
🎭 Demo account detected: test@gmail.com - Granting full access
✅ Demo account initialized successfully: test@gmail.com
```

5. **Verify features**:
- Dashboard shows "DEMO" badge
- AI queries unlimited
- All premium features enabled

---

## 📊 Current Demo Accounts

| Email | Status | Added | Purpose |
|-------|--------|-------|---------|
| `ekamanam@gmail.com` | ✅ Active | Dec 2025 | Primary demo account |
| `ekamanamdemo@gmail.com` | ✅ Active | Dec 2025 | Secondary demo account |

---

## 🔒 Security Considerations

### ✅ Safe Practices

1. **Firebase Authentication Required**
   - Demo emails must be real Google accounts
   - Can't fake demo access without actual Gmail login

2. **Config in Codebase**
   - JSON file compiled into app bundle
   - Not exposed as API endpoint
   - Only works with valid Firebase Auth

3. **Case-Insensitive Matching**
   - Prevents bypass via case changes
   - Trims whitespace automatically

4. **Revocable Access**
   - Can remove email from config anytime
   - Redeploy to revoke access immediately

### 🔐 Best Practices

1. **Use Dedicated Accounts**
   ```json
   "demoEmails": [
     "demo@ekamanam.com",      // Good: Dedicated
     "your-personal@gmail.com"  // Bad: Personal account
   ]
   ```

2. **Document Changes**
   ```json
   "lastUpdated": "2025-12-20",  // Always update date
   "version": "1.1.0"             // Increment version
   ```

3. **Limit Demo Accounts**
   - Don't add too many (< 10 recommended)
   - Monitor usage via Firebase Analytics
   - Rotate demo accounts periodically

4. **Set Expiry for Temporary Demos**
   ```json
   "expiryDate": "2025-12-31"  // End of year
   ```

---

## 🚨 Troubleshooting

### Demo account not working

**Issue**: User logs in but doesn't get demo access

**Solutions**:
1. Check email is in `demoEmails` array
2. Verify JSON syntax is valid
3. Rebuild app: `npm run build`
4. Clear browser cache
5. Check console for demo detection logs

### JSON syntax error

**Issue**: Build fails with JSON parsing error

**Solution**:
```bash
# Validate JSON syntax
node -e "console.log(require('./src/config/demoAccounts.json'))"

# Or use online validator: jsonlint.com
```

### Demo features not working

**Issue**: Demo account recognized but features limited

**Solutions**:
1. Check `allowUnlimitedQueries: true` in config
2. Verify `tier: "STUDENT"` is set correctly
3. Check `expiryDate` hasn't passed
4. Look for errors in browser console

---

## 📈 Analytics & Monitoring

### Track Demo Usage

**Firebase Console** → **Analytics** → Filter by user:

```javascript
// Check demo account activity
SELECT user_id, event_name, COUNT(*) as count
FROM analytics
WHERE user_email IN ('ekamanam@gmail.com', 'ekamanamdemo@gmail.com')
GROUP BY event_name
```

### Monitor Demo Accounts

```javascript
// Add to App.js or Dashboard
useEffect(() => {
  if (subscription?.isDemo) {
    console.log('📊 Demo account active:', user?.email);
    // Optional: Track to analytics
    logEvent(analytics, 'demo_account_session', {
      email: user?.email
    });
  }
}, [subscription, user]);
```

---

## 🎯 Use Cases & Examples

### Example 1: Educational Institution Demo

```json
{
  "demoEmails": [
    "schooldemo@ekamanam.com",
    "teacherdemo@ekamanam.com"
  ],
  "demoSettings": {
    "tier": "EDUCATOR",
    "displayName": "School Demo (Full Access)",
    "expiryDate": "2025-06-30",
    "note": "Demo for schools, expires end of school year"
  }
}
```

### Example 2: Conference Demo

```json
{
  "demoEmails": [
    "conference2025@ekamanam.com"
  ],
  "demoSettings": {
    "tier": "STUDENT",
    "displayName": "Conference Demo",
    "expiryDate": "2025-03-15",
    "note": "EdTech Conference 2025 - expires after event"
  }
}
```

### Example 3: Testing Accounts

```json
{
  "demoEmails": [
    "qa1@ekamanam.com",
    "qa2@ekamanam.com",
    "beta@ekamanam.com"
  ],
  "demoSettings": {
    "tier": "STUDENT",
    "displayName": "QA Testing Account",
    "expiryDate": null,
    "note": "Internal testing - never expires"
  }
}
```

---

## 🔄 Migration Guide

### From Hardcoded Email to JSON Config

**Before** (Old code):
```javascript
const DEMO_EMAIL = 'ekamanam@gmail.com';

function isDemoAccount(email) {
  return email === DEMO_EMAIL;
}
```

**After** (New code):
```javascript
import demoAccountsConfig from '../config/demoAccounts.json';
const DEMO_EMAILS = demoAccountsConfig.demoEmails;

function isDemoAccount(email) {
  return DEMO_EMAILS.some(demoEmail => 
    email.toLowerCase() === demoEmail.toLowerCase()
  );
}
```

**Benefits**:
✅ Multiple demo accounts  
✅ No code changes needed  
✅ Centralized configuration  
✅ Version control friendly  
✅ Easy to audit  

---

## 📝 Change Log

### v1.0.0 (2025-12-20)
- ✅ Initial JSON config system
- ✅ Support for multiple demo emails
- ✅ Configurable demo settings
- ✅ Added `ekamanam@gmail.com`
- ✅ Added `ekamanamdemo@gmail.com`

---

## 🚀 Quick Reference

### Add Demo Email
```json
"demoEmails": ["new@gmail.com"]
```

### Remove Demo Email
```json
// Delete or comment out email from array
```

### Change Demo Tier
```json
"demoSettings": { "tier": "EDUCATOR" }
```

### Set Expiry
```json
"demoSettings": { "expiryDate": "2025-12-31" }
```

### Disable All Demos
```json
"demoEmails": []
```

---

## 📞 Support

**Questions?** Check the main demo documentation:
- `DEMO_ACCOUNT_SETUP.md` - Technical implementation
- `DEMO_ACCOUNT_SUMMARY.md` - Overview and testing

**Need help?** Contact the development team or open an issue.

---

**Last Updated**: December 20, 2025  
**Config Version**: 1.0.0  
**Status**: ✅ Active  
**Demo Accounts**: 2 active

