# 🔧 Fix: "The recipients address is empty" Error

## ❌ The Problem

**Error:** `Failed to send OTP. The recipients address is empty`

This means your EmailJS template's **"To Email"** field is not configured correctly.

---

## ✅ The Fix (Choose One Method)

### **Method 1: Update Template "To Email" Field** (Recommended)

1. Go to: **https://www.emailjs.com/**
2. Login → **Email Templates**
3. Open your template: `template_qqj7276`
4. **CRITICAL:** Find the **"To Email"** field (at the top of the template editor)
5. Make sure it contains **EXACTLY**:
   ```
   {{to_email}}
   ```
   
   **NOT:**
   - ❌ `to_email` (missing brackets)
   - ❌ `{to_email}` (single brackets)
   - ❌ Empty field
   - ❌ Your actual email address

6. Click **"Save Changes"**
7. **Test it:** Click "Test" button
   - Fill in `to_email`: amantalwar04@gmail.com
   - Fill in other fields
   - Click "Send Test"
   - Check your email!

---

### **Method 2: Use EmailJS Auto-Reply Template** (Easiest)

Instead of creating a custom template, use EmailJS's built-in template:

1. EmailJS Dashboard → **Email Templates**
2. Click **"Create New Template"**
3. Choose **"Auto-Reply"** template (it's pre-configured!)
4. The "To Email" field will **automatically** be set to `{{to_email}}`
5. Edit the **Subject** and **Body**:

**Subject:**
```
Ekamanam Admin OTP - {{otp_code}}
```

**Body:**
```html
Hello {{to_name}},

Your Ekamanam Admin OTP is:

{{otp_code}}

This OTP is valid for {{expiry_minutes}} minutes.

Requested at: {{timestamp}}

If you didn't request this, please ignore this email.

Best regards,
{{from_name}}
```

6. **Save** and copy the new **Template ID**
7. Update `otpService.js` line 11 with the new Template ID

---

### **Method 3: Use Direct Email (Hardcode)**

If you only send OTPs to yourself, hardcode the email:

1. EmailJS Dashboard → Open your template
2. In **"To Email"** field, type **directly**:
   ```
   amantalwar04@gmail.com
   ```
   (No brackets, just the plain email)

3. Save
4. This will **always** send to this email, regardless of parameters

**⚠️ Warning:** This method means ALL OTPs go to this one email only!

---

## 🔍 How to Verify "To Email" Field

### Before Saving:
```
✅ CORRECT: {{to_email}}
❌ WRONG: to_email
❌ WRONG: {to_email}
❌ WRONG: ${to_email}
❌ WRONG: [to_email]
```

### After Saving:
1. Click **"Test"** button in template
2. You should see a field labeled **"to_email"** in the test form
3. If you DON'T see it, the variable isn't recognized
4. If you DO see it, fill it with your email and test

---

## 📧 Complete Template Configuration

Here's what your template should look like:

### **Template Settings:**

**Template Name:** `Admin OTP Verification`

**To Email:** (Most Important!)
```
{{to_email}}
```

**Subject:**
```
Ekamanam Admin OTP - {{otp_code}}
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
    
    <h2 style="color: #1976d2; text-align: center;">
      🛠️ Ekamanam Admin Dashboard
    </h2>
    
    <p>Hello {{to_name}},</p>
    
    <p>You requested access to the Ekamanam Admin Dashboard. Please use the OTP below:</p>
    
    <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <div style="font-size: 36px; font-weight: bold; color: #1976d2; letter-spacing: 8px;">
        {{otp_code}}
      </div>
    </div>
    
    <p><strong>⏱️ Valid for {{expiry_minutes}} minutes</strong></p>
    <p>Requested at: {{timestamp}}</p>
    
    <p style="color: #666; font-size: 14px;">
      If you didn't request this, please ignore this email.
    </p>
    
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
    
    <p style="text-align: center; color: #999; font-size: 12px;">
      <strong>Ekamanam - The Art of Focused Learning</strong><br>
      Powered by AI • Built with ❤️
    </p>
    
  </div>
</body>
</html>
```

**Reply-To:** (Optional)
```
{{reply_to}}
```

---

## 🧪 Test Your Template

### In EmailJS Dashboard:

1. Open template
2. Click **"Test"**
3. Fill in test values:
   - `to_email`: **amantalwar04@gmail.com** ← YOUR EMAIL
   - `to_name`: **Admin**
   - `from_name`: **Ekamanam**
   - `reply_to`: **noreply@ekamanam.com**
   - `otp_code`: **123456**
   - `expiry_minutes`: **5**
   - `timestamp`: **2025-11-27 10:30:00**

4. Click **"Send Test"**
5. **Check your email inbox!**

**If you receive the email** → Template is configured correctly! ✅  
**If you don't receive it** → Check spam, or template settings ❌

---

## 🔄 Alternative: Use Default EmailJS Format

EmailJS also accepts a simpler format. Update your template to use:

**To Email:**
```
{{to_email}}
```

**From Name:**
```
{{from_name}}
```

**Subject:**
```
{{subject}}
```

Then in `otpService.js`, send:
```javascript
const templateParams = {
  to_email: 'amantalwar04@gmail.com',
  from_name: 'Ekamanam Team',
  subject: `Your OTP: ${currentOTP}`,
  message: `Your OTP is ${currentOTP}. Valid for 5 minutes.`
};
```

---

## 📸 Screenshot Guide

**What you should see in EmailJS:**

```
┌─────────────────────────────────────┐
│ Template Settings                   │
├─────────────────────────────────────┤
│ Template Name: [Admin OTP]         │
│ To Email: {{to_email}}    ← CHECK! │
│ Subject: [...{{otp_code}}]         │
│                                     │
│ Body:                               │
│ [HTML editor with {{variables}}]   │
│                                     │
│ [Save Changes]  [Test]             │
└─────────────────────────────────────┘
```

---

## ⚡ Quick Fix Command

If you're comfortable with code, you can temporarily hardcode it:

Edit `otpService.js` around line 52:
```javascript
// TEMPORARY: Hardcode email for testing
const response = await emailjs.send(
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  {
    to_email: 'amantalwar04@gmail.com',  // Hardcoded
    to_name: 'Admin',
    from_name: 'Ekamanam',
    otp_code: currentOTP,
    expiry_minutes: 5,
    timestamp: new Date().toLocaleString()
  }
);
```

---

## ✅ Checklist

Before testing again:

- [ ] Template "To Email" field contains `{{to_email}}`
- [ ] Template saved successfully
- [ ] Template test sends email to your inbox
- [ ] Code has correct Service ID, Template ID, Public Key
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Console shows full template parameters

---

## 🆘 Still Not Working?

**Send me a screenshot of:**
1. Your EmailJS template's "To Email" field
2. The template test form
3. The browser console error (full error object)

Or try the **Auto-Reply template method** - it's pre-configured and works immediately!

---

**Most Common Fix:** Just make sure the "To Email" field in your EmailJS template contains `{{to_email}}` with double curly brackets!

