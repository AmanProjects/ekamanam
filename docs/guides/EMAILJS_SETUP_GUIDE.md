# 📧 EmailJS Setup Guide for Ekamanam Admin OTP

Complete step-by-step guide to set up email delivery for Admin Dashboard OTP authentication.

---

## 🎯 What You'll Get

- OTP emails sent to **amantalwar04@gmail.com**
- Professional email templates
- 200 free emails/month (enough for admin use)
- Secure authentication
- No backend server needed!

---

## 📝 Step-by-Step Setup

### **Step 1: Create EmailJS Account**

1. Go to: **https://www.emailjs.com/**
2. Click **"Sign Up Free"**
3. Choose **"Sign up with Google"** (recommended) or use email
4. Verify your email if needed
5. You'll be redirected to the dashboard

**✅ You now have an EmailJS account!**

---

### **Step 2: Add Email Service**

1. In the EmailJS dashboard, click **"Email Services"** in the left menu
2. Click **"Add New Service"**
3. Choose your email provider:
   - **Gmail** (recommended if you use Gmail)
   - **Outlook** (if you use Outlook/Hotmail)
   - **Yahoo**
   - Or any other SMTP service

#### **For Gmail Users (Recommended):**

4. Click **"Gmail"**
5. Click **"Connect Account"**
6. **Sign in with your Google account** (amantalwar04@gmail.com)
7. **Grant permissions** to EmailJS
8. Give it a **Service Name**: `Ekamanam_Admin`
9. Click **"Create Service"**

10. **Copy the Service ID** (looks like: `service_xyz1234`)
    - Save this! You'll need it later
    - Example: `service_ekamanam_otp`

**✅ Your email service is connected!**

---

### **Step 3: Create Email Template**

1. Click **"Email Templates"** in the left menu
2. Click **"Create New Template"**
3. You'll see a template editor

#### **Configure the Template:**

**Template Name:** `Admin OTP Verification`

**Subject Line:**
```
Ekamanam Admin OTP - {{otp_code}}
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #1976d2; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .otp-box { background-color: #e3f2fd; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #1976d2; letter-spacing: 8px; }
        .info { color: #666; font-size: 14px; line-height: 1.6; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            🛠️ Ekamanam Admin Dashboard
        </div>
        
        <p class="info">Hello Admin,</p>
        
        <p class="info">You requested access to the Ekamanam Admin Dashboard. Please use the OTP below to authenticate:</p>
        
        <div class="otp-box">
            <div class="otp-code">{{otp_code}}</div>
        </div>
        
        <p class="info">
            <strong>⏱️ This OTP is valid for {{expiry_minutes}} minutes.</strong><br>
            Requested at: {{timestamp}}
        </p>
        
        <p class="info">
            If you didn't request this OTP, please ignore this email. Your account security is important to us.
        </p>
        
        <div class="footer">
            <p>
                <strong>Ekamanam - The Art of Focused Learning</strong><br>
                Powered by AI • Built with ❤️
            </p>
        </div>
    </div>
</body>
</html>
```

**To Email (Important!):**
```
{{to_email}}
```

4. Click **"Save"**
5. **Copy the Template ID** (looks like: `template_xyz5678`)
   - Save this! You'll need it later
   - Example: `template_admin_otp`

**✅ Your email template is ready!**

---

### **Step 4: Get Your Public Key**

1. Click on your **Account** icon (top-right)
2. Click **"Account"** in the dropdown
3. Go to the **"General"** tab
4. Find **"Public Key"** section
5. **Copy your Public Key** (looks like: `AbC123XyZ_1234567890`)
   - Save this! You'll need it later

**✅ You have all three keys!**

---

### **Step 5: Configure Ekamanam**

Now update your code with the keys you collected:

1. Open: `src/services/otpService.js`

2. Find these lines (around line 10-12):
```javascript
const EMAILJS_SERVICE_ID = 'service_ekamanam'; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = 'template_admin_otp'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your public key
```

3. **Replace with your actual values:**
```javascript
const EMAILJS_SERVICE_ID = 'service_xyz1234'; // Your Service ID from Step 2
const EMAILJS_TEMPLATE_ID = 'template_xyz5678'; // Your Template ID from Step 3
const EMAILJS_PUBLIC_KEY = 'AbC123XyZ_1234567890'; // Your Public Key from Step 4
```

4. **Remove DEV MODE** (around line 33-39):
   
   **Find this block:**
   ```javascript
   // For development/testing: Show OTP in console
   // In production, this should only send via email
   if (process.env.NODE_ENV === 'development') {
     console.log('🔢 DEV MODE: OTP is', currentOTP);
     alert(`DEV MODE: Your OTP is ${currentOTP}\n\nIn production, this will be sent to ${ADMIN_EMAIL}`);
     return { success: true, message: 'OTP sent successfully (DEV MODE)' };
   }
   ```
   
   **Comment it out or delete it:**
   ```javascript
   // DEV MODE REMOVED - Now sending real emails!
   
   // if (process.env.NODE_ENV === 'development') {
   //   console.log('🔢 DEV MODE: OTP is', currentOTP);
   //   alert(`DEV MODE: Your OTP is ${currentOTP}\n\nIn production, this will be sent to ${ADMIN_EMAIL}`);
   //   return { success: true, message: 'OTP sent successfully (DEV MODE)' };
   // }
   ```

5. **Save the file**

**✅ Ekamanam is now configured!**

---

### **Step 6: Test the Integration**

1. **Commit and deploy:**
   ```bash
   cd /Users/amantalwar/Documents/GitHub/ekamanam
   git add -A
   git commit -m "🔧 CONFIG: Add EmailJS production keys"
   git push origin v2
   npm run deploy
   ```

2. **Wait 1-2 minutes** for deployment

3. **Test it:**
   - Open your deployed app
   - Click **Admin** button
   - Click **"Send OTP to My Email"**
   - **Check your email** (amantalwar04@gmail.com)
   - You should receive a beautiful OTP email!
   - Enter the 6-digit code
   - Access granted! 🎉

**✅ It works!**

---

## 🎨 What the Email Looks Like

Your users will receive:

```
┌──────────────────────────────────┐
│  🛠️ Ekamanam Admin Dashboard     │
├──────────────────────────────────┤
│                                  │
│  Hello Admin,                    │
│                                  │
│  You requested access to the     │
│  Ekamanam Admin Dashboard.       │
│                                  │
│  ┌────────────────────────────┐ │
│  │      1 2 3 4 5 6           │ │
│  └────────────────────────────┘ │
│                                  │
│  ⏱️ Valid for 5 minutes          │
│  Requested at: Nov 27, 2025...  │
│                                  │
│  If you didn't request this,    │
│  please ignore.                  │
│                                  │
├──────────────────────────────────┤
│  Ekamanam - Built with ❤️        │
└──────────────────────────────────┘
```

---

## 🔒 Security Best Practices

### **1. Protect Your Keys**

**✅ DO:**
- Keep keys in `otpService.js` (not tracked in git)
- Use environment variables for production
- Never commit keys to public repos

**❌ DON'T:**
- Share keys publicly
- Commit keys to GitHub
- Use keys in client-side code (wait, EmailJS public key is OK!)

### **2. Environment Variables (Optional Advanced)**

For better security, use `.env`:

1. Create `.env.local`:
```env
REACT_APP_EMAILJS_SERVICE_ID=service_xyz1234
REACT_APP_EMAILJS_TEMPLATE_ID=template_xyz5678
REACT_APP_EMAILJS_PUBLIC_KEY=AbC123XyZ_1234567890
```

2. Update `otpService.js`:
```javascript
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
```

3. Add to `.gitignore`:
```
.env.local
```

---

## 📊 Usage Limits

**Free Tier:**
- 200 emails/month
- Perfect for admin OTP (even with daily use)
- If you use OTP 5 times/day = 150/month ✅

**If You Need More:**
- Personal: $7/month → 1,000 emails
- Professional: $15/month → 3,000 emails

---

## 🐛 Troubleshooting

### **"Failed to send OTP"**

**Check:**
1. ✅ Are your keys correct in `otpService.js`?
2. ✅ Is your Gmail connected in EmailJS dashboard?
3. ✅ Did you grant permissions to EmailJS?
4. ✅ Check browser console for errors (F12)

**Solution:**
- Go to EmailJS dashboard
- Test the template directly (use "Test" button)
- Check if emails arrive
- If not, reconnect your Gmail

---

### **"Email not received"**

**Check:**
1. ✅ Spam/Junk folder
2. ✅ Email address is correct (amantalwar04@gmail.com)
3. ✅ Template has `{{to_email}}` in "To Email" field
4. ✅ Wait 1-2 minutes (sometimes delayed)

---

### **"Invalid Template Variables"**

**Make sure your template uses these exact variables:**
- `{{to_email}}` - In "To Email" field
- `{{otp_code}}` - The 6-digit OTP
- `{{expiry_minutes}}` - How long it's valid (5)
- `{{timestamp}}` - When it was requested

---

## 🎓 Video Tutorial (Optional)

EmailJS has great video tutorials:
- **YouTube:** Search "EmailJS tutorial"
- **Official Docs:** https://www.emailjs.com/docs/

---

## ✅ Checklist

Before going live, ensure:

- [ ] EmailJS account created
- [ ] Gmail connected as service
- [ ] Email template created
- [ ] All 3 keys copied (Service ID, Template ID, Public Key)
- [ ] Keys added to `otpService.js`
- [ ] DEV MODE removed/commented
- [ ] Code committed and pushed
- [ ] App deployed
- [ ] Test OTP sent successfully
- [ ] Test OTP received in email
- [ ] Test OTP verification works

---

## 🎉 You're Done!

Your admin dashboard is now **fully secured** with professional OTP authentication!

**Questions?**
- EmailJS Support: support@emailjs.com
- EmailJS Docs: https://www.emailjs.com/docs/

---

**Last Updated:** Nov 27, 2025  
**Version:** 2.9.0  
**Author:** Ekamanam Team

