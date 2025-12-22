# 🛡️ Admin Panel User Guide

**URL**: https://www.ekamanam.com/configureadmin.html  
**Access**: OTP-protected (amandeep.talwar@gmail.com only)  
**Purpose**: Manage demo accounts in real-time

---

## 🎯 Overview

The Admin Panel is a **standalone web page** that allows authorized administrators to manage demo accounts without code changes or redeployment.

### Key Features
✅ **OTP Authentication** - Secure access via 6-digit code  
✅ **Real-time Management** - Add/remove demos instantly  
✅ **No Deployment Needed** - Changes take effect immediately  
✅ **Firestore-powered** - Cloud-synced across all users  
✅ **Hybrid System** - Combines Firestore + JSON fallback  

---

## 🚀 Quick Start

### 1. Access the Admin Panel

**URL**: `https://www.ekamanam.com/configureadmin.html`

⚠️ **Note**: This URL is not advertised or linked anywhere in the main app for security.

### 2. Request OTP

1. The page will show: `amandeep.talwar@gmail.com` (read-only)
2. Click **"Send OTP Code"**
3. A 6-digit code will be generated
4. **Development Mode**: Check browser console for the code
5. **Production Mode**: Code will be emailed (requires email service setup)

### 3. Enter OTP

1. Enter the 6-digit code
2. Click **"Verify & Access"**
3. OTP expires in **10 minutes**
4. If expired, click **"Resend Code"**

### 4. Manage Demo Accounts

Once authenticated, you'll see:
- **Current demo count** and last updated time
- **List of active demo accounts**
- **Add new demo** form
- **Remove buttons** for each demo

---

## 📋 Managing Demo Accounts

### Add a New Demo Account

1. Scroll to **"Add New Demo Account"** section
2. Enter email address (e.g., `newdemo@gmail.com`)
3. Click **"Add Demo Account"**
4. ✅ Confirmation message appears
5. Demo is **live immediately** - no deployment needed!

**Requirements**:
- Valid email format
- Not already in the list
- Must be a real Gmail/Google account for login

### Remove a Demo Account

1. Find the demo account in the list
2. Click the **"Remove"** button
3. Confirm the removal
4. ✅ Demo account removed immediately

**Effect**:
- User loses demo access instantly
- Next login will show regular FREE tier
- No grace period - immediate revocation

---

## 🔄 How It Works

### Hybrid System Architecture

```
User Login
    ↓
Check Firestore (admin/demoAccounts)
    ├─ Found? → Grant STUDENT tier ✅
    └─ Not Found? ↓
       Check JSON config (fallback)
           ├─ Found? → Grant STUDENT tier ✅
           └─ Not Found? → Regular user (FREE tier)
```

### Data Sources

| Source | Purpose | Priority | Editable |
|--------|---------|----------|----------|
| **Firestore** | Admin-managed demos | 1 (Primary) | ✅ Yes (via admin panel) |
| **JSON Config** | Default/fallback demos | 2 (Fallback) | ⚠️ Code change required |

### Real-time Updates

- **Add demo**: Available in ~1-2 seconds
- **Remove demo**: Revoked in ~1-2 seconds
- **No cache issues**: Direct Firestore queries
- **No deployment**: Changes are live immediately

---

## 🎓 Common Use Cases

### 1. **Conference Demo**

**Scenario**: You're presenting at a conference and need a demo account.

**Steps**:
1. Before the event, log into admin panel
2. Add: `conference2025@gmail.com`
3. Use this account for live demonstrations
4. After event, remove the account

**Time**: 30 seconds to add, 10 seconds to remove

---

### 2. **School Trial**

**Scenario**: A school wants to test Ekamanam for 30 days.

**Steps**:
1. Add: `school-demo@ekamanam.com`
2. Share credentials with school
3. After 30 days, remove the account
4. School must subscribe to continue

**Benefit**: No commitment, instant access, easy revocation

---

### 3. **Sales Prospect**

**Scenario**: Sales team needs demo accounts for prospects.

**Steps**:
1. Add: `prospect1@ekamanam.com`, `prospect2@ekamanam.com`, etc.
2. Share with sales team
3. Remove after deal closes or prospect declines
4. Reuse email addresses for new prospects

---

### 4. **Emergency Revocation**

**Scenario**: Demo account is being abused or shared publicly.

**Steps**:
1. Log into admin panel immediately
2. Find the abused account
3. Click "Remove"
4. Access revoked in seconds

**No waiting for deployment!**

---

### 5. **Beta Testing**

**Scenario**: You want specific users to test new features.

**Steps**:
1. Add their email addresses as demo accounts
2. They get full STUDENT tier access
3. Collect feedback
4. Remove when testing complete

---

## 🔒 Security Features

### OTP Authentication
- **6-digit code** sent to authorized email only
- **10-minute expiry** - must be used quickly
- **One-time use** - deleted after verification
- **Session-based** - stays logged in until browser close

### Firestore Security Rules
```javascript
match /admin/demoAccounts {
  // Only amandeep.talwar@gmail.com can access
  allow read, write: if request.auth != null && 
    request.auth.token.email == 'amandeep.talwar@gmail.com';
}
```

### No Public Access
- **URL not advertised** - not linked in main app
- **No search indexing** - robots.txt excludes admin pages
- **Session-only auth** - logout on browser close
- **Single authorized email** - hardcoded admin

---

## 📊 Admin Panel Features

### Statistics Dashboard
- **Active Demos**: Total count of demo accounts
- **Last Updated**: Time since last modification
- Real-time updates as you make changes

### Demo Account List
- **Email addresses**: Full list of active demos
- **Remove buttons**: One-click revocation
- **Alphabetical sorting**: Easy to find accounts
- **Empty state**: Shows message when no demos configured

### Add New Form
- **Email validation**: Prevents invalid entries
- **Duplicate check**: Can't add same email twice
- **Instant feedback**: Success/error messages
- **Auto-clear**: Input clears after successful add

---

## 🔧 Troubleshooting

### Issue: OTP not received

**Solutions**:
1. Check browser console - OTP displayed in dev mode
2. Wait 30 seconds and try resending
3. Check spam folder (if email service configured)
4. Verify internet connection
5. Try different browser

---

### Issue: "Unauthorized email address"

**Cause**: Email doesn't match `amandeep.talwar@gmail.com`

**Solution**: Only the authorized email can access admin panel

---

### Issue: Demo account not working

**Steps to debug**:
1. Check if email appears in admin panel list
2. Have user logout and login again
3. Check browser console for demo detection logs
4. Verify email spelling matches exactly
5. Try removing and re-adding the account

---

### Issue: Changes not taking effect

**Solutions**:
1. Wait 5-10 seconds for Firestore sync
2. User should logout and login again
3. Clear browser cache (Ctrl+Shift+R)
4. Check Firestore console for data
5. Verify Firestore security rules are deployed

---

### Issue: Can't access admin panel

**Solutions**:
1. Check URL: `https://www.ekamanam.com/configureadmin.html`
2. Wait 5-15 minutes after deployment for CDN
3. Try incognito/private browsing
4. Clear browser cache
5. Check if page exists in build folder

---

## 💡 Best Practices

### 1. **Document Demo Accounts**

Keep a spreadsheet with:
- Email address
- Purpose/reason
- Date added
- Date removed (when applicable)
- Contact person/organization

### 2. **Regular Cleanup**

- Review demo accounts monthly
- Remove inactive or expired demos
- Consolidate similar demos
- Keep list under 20 accounts for performance

### 3. **Secure Email Addresses**

Use format: `purpose-identifier@ekamanam.com`

Examples:
- `conference-edutech2025@ekamanam.com`
- `school-trial-mvhs@ekamanam.com`
- `sales-prospect-acme@ekamanam.com`

### 4. **Emergency Contact**

Save admin panel URL in secure location:
- Password manager
- Encrypted notes
- Team wiki (restricted access)

### 5. **Monitor Usage**

Check Firebase Analytics for demo account activity:
- Login frequency
- Feature usage
- Session duration
- Conversion to paid

---

## 🔄 Backup & Recovery

### Export Demo Accounts

**Manual Method**:
1. Log into admin panel
2. Screenshot or copy the list
3. Save to secure location

**Firestore Console**:
1. Go to Firebase Console
2. Firestore Database → `admin/demoAccounts`
3. View document data
4. Copy `emails` array

### Import Demo Accounts

If Firestore data is lost:

**Option 1: Re-add via Admin Panel**
- Manually re-add each email address

**Option 2: Restore from JSON**
- Default demos in `src/config/demoAccounts.json`
- These are always available as fallback

**Option 3: Firestore Restore**
- Use Firebase backup/restore feature
- Contact Firebase support if needed

---

## 📱 Mobile Access

The admin panel is **fully responsive** and works on mobile devices:

### Features on Mobile
✅ Touch-friendly buttons (large tap targets)  
✅ Responsive layout (single column)  
✅ Easy scrolling  
✅ Mobile keyboard support  
✅ Session persistence  

### Recommended for Mobile
- Use for emergency revocations
- Quick demo additions
- Checking current demo list
- Mobile-friendly OTP entry

---

## 🎯 Quick Reference

### URLs
- **Admin Panel**: `https://www.ekamanam.com/configureadmin.html`
- **Main App**: `https://www.ekamanam.com`

### Authorized Email
- **Admin**: `amandeep.talwar@gmail.com`

### Key Actions
- **Add Demo**: 30 seconds
- **Remove Demo**: 10 seconds
- **OTP Request**: Instant
- **OTP Expiry**: 10 minutes
- **Effect Time**: 1-2 seconds

### Data Storage
- **Primary**: Firestore (`admin/demoAccounts`)
- **Fallback**: JSON (`src/config/demoAccounts.json`)

---

## 🆘 Emergency Procedures

### Lost Access to Admin Panel

**Steps**:
1. Access via URL: `/configureadmin.html`
2. Request new OTP
3. Check email/console for code
4. If still locked, contact Firebase admin

### Demo Account Abuse

**Immediate Action**:
1. Log into admin panel
2. Remove abused account
3. Document incident
4. Consider adding to blocklist

### Firestore Down

**Fallback**:
- JSON config still active
- Default demos still work
- Manual code update if needed
- Firestore usually recovers quickly

---

## 📞 Support & Contact

### Technical Issues
- Check Firebase Console for Firestore status
- Review browser console for errors
- Test in incognito mode
- Clear cache and retry

### Access Issues
- Verify authorized email
- Check OTP expiry time
- Ensure internet connection
- Try different browser/device

### Data Issues
- Check Firestore console directly
- Verify security rules are deployed
- Test with known-working email
- Review Firebase logs

---

## 📚 Related Documentation

- **`DEMO_ACCOUNTS_CONFIG.md`** - JSON configuration guide
- **`DEMO_ACCOUNT_SETUP.md`** - Technical implementation
- **`firestore.rules.admin.txt`** - Security rules

---

## ✅ Admin Panel Checklist

### First Time Setup
- [ ] Deploy admin panel (included in build)
- [ ] Add Firestore security rules
- [ ] Test OTP authentication
- [ ] Add first demo account
- [ ] Verify demo account works
- [ ] Bookmark admin URL

### Regular Usage
- [ ] Log into admin panel
- [ ] Review current demo accounts
- [ ] Add new demos as needed
- [ ] Remove expired/inactive demos
- [ ] Update documentation
- [ ] Logout when done

### Monthly Maintenance
- [ ] Review all demo accounts
- [ ] Remove unused demos
- [ ] Check for duplicates
- [ ] Verify all demos still active
- [ ] Update backup spreadsheet

---

**Admin Panel**: Secure, Fast, Real-time Demo Management 🛡️

**Questions?** Check related documentation or Firebase Console logs.

---

**Last Updated**: December 20, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready to use  
**Access**: https://www.ekamanam.com/configureadmin.html

