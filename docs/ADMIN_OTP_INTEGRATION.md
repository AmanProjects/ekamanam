# Admin Panel OTP Integration

## Overview
The `configureadmin.html` admin panel now uses the **same EmailJS-based OTP system** as the main Ekamanam admin dashboard, ensuring consistency and reliability.

## What Changed

### ✅ Previous Implementation
- Used Firestore to store and verify OTPs
- Required separate Firestore security rules
- OTPs stored in `/otp/{email}` collection

### ✅ New Implementation (Current)
- Uses **EmailJS** to send OTPs (same service as main dashboard)
- OTPs sent to `amandeep.talwar@gmail.com`
- In-memory OTP storage (no database needed)
- Session-based authentication (1-hour validity)

## EmailJS Configuration

The admin panel uses the exact same EmailJS configuration as `src/services/otpService.js`:

```javascript
const EMAILJS_SERVICE_ID = 'service_2n09tlh';
const EMAILJS_TEMPLATE_ID = 'template_qqj7276';
const EMAILJS_PUBLIC_KEY = 'EhyhDIZQ3Hvf6I71C';
```

## How It Works

### 1. Request OTP
- User clicks "Generate OTP Code"
- System generates 6-digit OTP
- **OTP sent via EmailJS** to admin email
- OTP displayed in browser console (development fallback)
- Valid for **5 minutes** (same as main dashboard)

### 2. Verify OTP
- User enters 6-digit code from email
- System validates:
  - OTP exists
  - OTP not expired (5 minutes)
  - Code matches
- On success: Creates 1-hour admin session

### 3. Session Management
- Session stored in `sessionStorage`
- Valid for 1 hour
- Automatically expires
- Same format as main dashboard:
  ```javascript
  {
    authorized: true,
    expiry: timestamp + 1 hour,
    timestamp: ISO string
  }
  ```

## Benefits

### 🔒 Security
- No OTPs stored in database
- Automatic expiry (5 minutes)
- Session timeout (1 hour)
- Email-based verification

### 🔄 Consistency
- Same OTP service as main dashboard
- Same session management logic
- Same user experience
- Centralized email configuration

### 🚀 Reliability
- No dependency on Firestore for OTP
- Email delivery via EmailJS
- Console fallback for development
- Error handling with graceful degradation

## Testing

### Test OTP Flow
1. Navigate to `https://ekamanam.com/configureadmin.html`
2. Click "Generate OTP Code"
3. Check email: `amandeep.talwar@gmail.com`
4. Check console for OTP (development backup)
5. Enter 6-digit code
6. Access demo account management

### Session Persistence
- After successful OTP verification, refresh the page
- Should remain authenticated (session valid)
- After 1 hour, should require new OTP

## Development Notes

### Console OTP Display
For development convenience, OTP is logged to console:
```
═══════════════════════════════════
🔐 OTP CODE: 123456
📧 Sent to: amandeep.talwar@gmail.com
⏰ Expires in: 5 minutes
═══════════════════════════════════
```

### Email Fallback
If EmailJS fails (network issues, rate limits), the OTP is still:
- Logged to console
- Verification form still shown
- Admin can use console OTP

## Deployment Checklist

- [x] EmailJS library included in HTML
- [x] Same EmailJS configuration as main dashboard
- [x] OTP request uses EmailJS.send()
- [x] OTP verification matches main dashboard logic
- [x] Session management consistent
- [x] Error handling in place
- [x] Console logging for debugging
- [x] Build script copies file to build directory

## Future Enhancements

### Potential Improvements
1. **Two-Factor Authentication**: Add SMS backup
2. **Rate Limiting**: Limit OTP requests per hour
3. **IP Whitelisting**: Restrict access by IP
4. **Audit Log**: Track all OTP requests and demo changes
5. **Multi-Admin Support**: Allow multiple admin emails

### EmailJS Template
Ensure the EmailJS template (`template_qqj7276`) includes:
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name
- `{{otp_code}}` - 6-digit OTP
- `{{expiry_minutes}}` - Validity period
- `{{timestamp}}` - When OTP was generated
- `{{from_name}}` - Sender name (Ekamanam)

## Support

### Troubleshooting

**OTP Email Not Received**
- Check spam folder
- Verify EmailJS service is active
- Check EmailJS usage limits
- Look for OTP in browser console

**Session Expired Too Soon**
- Check system clock
- Clear sessionStorage
- Request new OTP

**Verification Failed**
- Ensure OTP not expired (5 min)
- Check for typos in code
- Request new OTP if needed

### Contact
For issues with the admin panel or OTP system:
- Check browser console for detailed errors
- Verify EmailJS dashboard for delivery status
- Review main dashboard `otpService.js` for reference

---

**Last Updated**: December 21, 2025  
**Version**: 2.0 (EmailJS Integration)  
**Status**: ✅ Deployed and Active

