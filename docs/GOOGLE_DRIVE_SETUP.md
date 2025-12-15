# Google Drive Integration Setup Guide

This guide explains how to configure Google Drive API for Ekamanam to enable cloud storage and sync.

## Overview

Ekamanam uses Google Drive API to:
- Store user PDFs in their Google Drive
- Cache AI responses to save API costs
- Enable cross-device learning
- Provide automatic backup

## Benefits

✅ **For Users:**
- Own their data (stored in their Drive)
- Access from any device
- Never lose PDFs or progress
- Smart AI caching (faster responses)

✅ **For Developers:**
- Zero storage costs (users bring their own storage)
- Scalable architecture
- GDPR compliant (user owns data)
- No Firebase Storage fees

---

## Setup Steps

### Step 1: Enable Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project or create a new one
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Drive API"
5. Click **Enable**

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public app) or **Internal** (for workspace)
3. Fill in required information:
   - **App name**: Ekamanam
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **App logo**: (Optional) Upload Ekamanam logo
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.appdata`
5. Add test users (for development):
   - Add your Gmail address and test users' emails
6. Save and continue

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Ekamanam Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://www.ekamanam.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `https://www.ekamanam.com`
5. Click **Create**
6. Copy the **Client ID** (you'll need this)

### Step 4: Create API Key (Optional but Recommended)

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API key**
3. Copy the API key
4. Click **Restrict Key**:
   - **Application restrictions**: HTTP referrers
   - Add: `localhost:3000/*` and `www.ekamanam.com/*`
   - **API restrictions**: Restrict key → Select "Google Drive API"
5. Save

### Step 5: Configure Environment Variables

Create `.env.local` file in project root:

```bash
# Google Drive API Credentials
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=YOUR_API_KEY_HERE
```

**Important:** Never commit `.env.local` to Git! It's already in `.gitignore`.

### Step 6: Publish OAuth Consent Screen (Production)

For production use:

1. Go back to **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (required if you have >100 users)
4. Google will review your app (usually takes 1-2 weeks)

Until verified, users will see "This app isn't verified" warning (they can still proceed with "Advanced" → "Go to Ekamanam").

---

## Folder Structure Created in User's Drive

When a user grants Drive permissions, Ekamanam creates:

```
📁 Ekamanam/
├── 📁 PDFs/                    # User's uploaded PDFs
├── 📁 Cache/
│   ├── 📁 AI_Responses/        # Cached AI queries/responses
│   ├── 📁 Page_Index/          # Page-level topic indexes
│   └── 📁 Embeddings/          # Vector embeddings (future)
├── 📁 Notes/                   # User's notes
├── 📁 Progress/                # Reading progress tracking
└── 📄 ekamanam_library.json   # Main library index
```

---

## Testing

### Local Testing

1. Start development server:
   ```bash
   npm start
   ```

2. Login with test user (added in OAuth consent screen)

3. Click "Connect Google Drive" when prompted

4. Grant permissions (you'll see the consent screen)

5. Verify folder creation in Google Drive

### Production Testing

1. Deploy to production
2. Test with real users
3. Monitor Google Cloud Console for API usage
4. Check quotas and limits

---

## API Quotas

Google Drive API has generous free quotas:

- **Queries per day**: 1,000,000,000 (1 billion)
- **Queries per 100 seconds per user**: 1,000
- **Storage**: Uses user's Drive quota (15 GB free)

For most educational apps, these limits are more than sufficient.

---

## Security Best Practices

✅ **Do:**
- Only request minimum required scopes
- Store credentials in environment variables
- Use HTTPS in production
- Regularly rotate API keys
- Monitor API usage in Cloud Console

❌ **Don't:**
- Commit credentials to Git
- Request more permissions than needed
- Store user data on your servers
- Share API keys publicly
- Bypass OAuth consent screen

---

## Troubleshooting

### "Access blocked: This app's request is invalid"

**Solution:** Add your email as a test user in OAuth consent screen.

### "The redirect URI in the request does not match"

**Solution:** Add the exact URL (including protocol and port) to authorized redirect URIs.

### "API key not valid"

**Solution:** Check that:
1. API key is correctly set in `.env.local`
2. Google Drive API is enabled
3. API key restrictions allow your domain

### "Origin http://localhost:3000 is not allowed"

**Solution:** Add `http://localhost:3000` to authorized JavaScript origins.

### Users see "This app isn't verified"

**Solution:** This is normal before verification. Users can proceed with "Advanced" → "Go to Ekamanam". Submit app for verification in OAuth consent screen for production.

---

## Support

For issues:
1. Check Google Cloud Console logs
2. Review API quotas and billing
3. Test with different Google accounts
4. Create GitHub issue with error logs

---

## Cost Analysis

### Firebase Storage (without Google Drive):
- **Free tier**: 5 GB storage
- **Paid**: $0.026/GB/month
- **For 1000 users with 50 MB PDFs each**: $1,300/month 💸

### Google Drive Integration:
- **API calls**: Free (within quota)
- **Storage**: User's Drive quota
- **Cost to you**: $0/month ✅

**Savings**: 100% of storage costs!

---

## Migration Path

If you later want to move away from Google Drive:

1. Users can export their "Ekamanam" folder anytime
2. Add Firebase Storage as backup option
3. Implement hybrid: Drive for primary, Firebase for fallback
4. Gradual migration with user consent

---

## References

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [API Quotas](https://developers.google.com/drive/api/v3/limits)
- [gapi-script Documentation](https://github.com/google/google-api-javascript-client)

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
