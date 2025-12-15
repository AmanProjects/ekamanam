# Google Drive Integration Setup - v7.2.0

## Critical Issue Identified

The Google Drive 403 errors are occurring because **Firebase Authentication does NOT provide OAuth access tokens with custom scopes** (like Drive API scopes).

### The Problem

When you sign in with `signInWithPopup()` from Firebase Auth, Firebase only provides an ID token for authentication - NOT an OAuth access token with Drive permissions. This is why we're seeing 403 errors despite:
- ✅ Drive API being enabled
- ✅ OAuth consent screen configured
- ✅ Drive scopes added to consent screen

### The Solution

We need to use **Google Identity Services** (the new OAuth library) to request a separate OAuth token with Drive scopes AFTER Firebase authentication succeeds.

## Required Setup Steps

### Step 1: Get Your Web OAuth Client ID

1. Go to: https://console.cloud.google.com/apis/credentials?project=ekamanam
2. Look for the **OAuth 2.0 Client IDs** section
3. Find the client ID for **Web application** (it will look like: `662515641730-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`)
4. Copy this Client ID

### Step 2: Verify OAuth Consent Screen Configuration

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=ekamanam
2. Click "EDIT APP"
3. Navigate to "Scopes" (Step 2)
4. Verify these scopes are listed:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.appdata`
5. If not listed, add them:
   - Click "ADD OR REMOVE SCOPES"
   - Search for "Google Drive API"
   - Check both scopes above
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE" through remaining steps

### Step 3: Update the Code with Your Client ID

Open `src/components/AuthButton.js` and replace line 79:

```javascript
// REPLACE THIS LINE:
const clientId = '662515641730-8n6b0d0u3q7q0q0q0q0q0q0q0q0q0q0q.apps.googleusercontent.com';

// WITH YOUR ACTUAL WEB CLIENT ID:
const clientId = 'YOUR-ACTUAL-CLIENT-ID-HERE.apps.googleusercontent.com';
```

### Step 4: Verify Authorized Domains

1. In the OAuth consent screen, go to "Authorized domains"
2. Add these domains:
   - `ekamanam.com`
   - `ekamanam.firebaseapp.com`
   - `localhost` (for testing)

### Step 5: Test the Flow

1. Sign out completely
2. Clear browser localStorage: `localStorage.clear()`
3. Sign in again
4. You should see TWO consent prompts:
   - **First**: Firebase sign-in (email, profile)
   - **Second**: Drive permissions (Google Drive access)
5. Grant both permissions
6. Check console for: `✅ Google OAuth access token with Drive scopes stored`

## How It Works Now (v7.2.0)

### Two-Step OAuth Flow:

1. **Firebase Authentication** (`signInWithPopup`)
   - Gets user identity (email, name, photo)
   - Creates Firebase Auth session
   - Stores user in Firebase Auth

2. **Google Identity Services** (`initTokenClient`)
   - Requests Drive API permissions
   - Gets OAuth access token with Drive scopes
   - Stores token in localStorage
   - Used for all Drive API calls

### Why This Approach?

- Firebase Auth: Great for user authentication and identity
- Google Identity Services: Required for OAuth tokens with custom API scopes
- We need BOTH: Firebase for auth + OAuth token for Drive API

## Troubleshooting

### Error: "idpiframe_initialization_failed"
- **Cause**: OAuth client ID is incorrect or domain not authorized
- **Fix**: Verify client ID and add domain to OAuth consent screen

### Error: "popup_closed_by_user"
- **Cause**: User closed the Drive permission prompt
- **Fix**: Sign in again and grant permissions

### Error: "access_denied"
- **Cause**: User declined Drive permissions
- **Fix**: Sign in again and grant permissions

### Still Getting 403 Errors?
1. Verify the OAuth access token is being stored: Check DevTools → Application → Local Storage → `google_access_token`
2. Check the token scopes in console logs: Look for `📋 Token scopes:` - should include Drive API URLs
3. Verify Drive API is enabled: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=ekamanam
4. Wait 5-10 minutes for API changes to propagate

## Finding Your Web Client ID

If you can't find your Web OAuth Client ID:

1. Go to: https://console.cloud.google.com/apis/credentials?project=ekamanam
2. You should see a table with these columns: Name | Type | Created | Client ID
3. Look for a row where:
   - **Type** = "OAuth 2.0 Client ID"
   - **Name** = "Web client (auto created by Google Service)" or similar
4. The **Client ID** column shows the ID you need
5. It will be in format: `[PROJECT-NUMBER]-[RANDOM-STRING].apps.googleusercontent.com`

If no Web client exists:
1. Click "+ CREATE CREDENTIALS"
2. Select "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add Authorized JavaScript origins:
   - `https://ekamanam.com`
   - `https://ekamanam.firebaseapp.com`
   - `http://localhost:3000` (for development)
5. Add Authorized redirect URIs:
   - `https://ekamanam.com`
   - `https://ekamanam.firebaseapp.com`
6. Click "CREATE"
7. Copy the Client ID shown in the popup

## Next Steps After Setup

Once the correct Client ID is in place and Drive permissions are granted:

1. Deploy the app: `npm run build && npm run deploy`
2. Test sign-in flow completely
3. Verify Ekamanam folder appears in Google Drive
4. Test PDF upload to Drive
5. Test AI cache storage in Drive

---

**Version**: 7.2.0
**Date**: 2025-12-16
**Critical Fix**: Implemented proper OAuth flow for Drive API access
