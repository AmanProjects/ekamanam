# OAuth Redirect URI Mismatch Error - Fix Guide

## Error Message
```
Error 400: redirect_uri_mismatch
Request details: origin=https://www.ekamanam.com
```

## Root Cause

The OAuth Web Client ID `662515641730-ke7iqkpepqlpehgvt8k4nv5qhv573c56.apps.googleusercontent.com` does not have `https://www.ekamanam.com` registered as an authorized JavaScript origin.

## Fix Steps

### 1. Go to Google Cloud Console Credentials

Navigate to: https://console.cloud.google.com/apis/credentials?project=ekamanam

### 2. Find Your Web OAuth Client

Look for the OAuth 2.0 Client ID with ID: `662515641730-ke7iqkpepqlpehgvt8k4nv5qhv573c56`

Click on it to edit.

### 3. Add Authorized JavaScript Origins

In the "Authorized JavaScript origins" section, add these URIs:

```
https://www.ekamanam.com
https://ekamanam.com
https://ekamanam.firebaseapp.com
http://localhost:3000
```

**IMPORTANT**: Make sure there are NO trailing slashes!

✅ Correct: `https://www.ekamanam.com`
❌ Wrong: `https://www.ekamanam.com/`

### 4. Add Authorized Redirect URIs

In the "Authorized redirect URIs" section, add these URIs:

```
https://www.ekamanam.com
https://ekamanam.com
https://ekamanam.firebaseapp.com
http://localhost:3000
```

### 5. Save Changes

Click **"SAVE"** at the bottom of the page.

### 6. Wait for Propagation

Google's changes can take **5-10 minutes** to propagate. Wait before testing.

## Verification Steps

After waiting 5-10 minutes:

1. Open a new incognito/private browser window
2. Go to: https://www.ekamanam.com
3. Clear localStorage: `localStorage.clear()`
4. Try signing in again

## Expected Behavior

After the fix:
1. Click "Sign In"
2. Firebase sign-in popup appears ✅
3. Grant permissions
4. Drive OAuth consent appears ✅
5. Grant Drive permissions
6. Signed in successfully ✅

## Alternative: Check Existing Origins

If the OAuth client already exists, verify current settings:

1. Go to: https://console.cloud.google.com/apis/credentials?project=ekamanam
2. Click on the OAuth client ID
3. Check "Authorized JavaScript origins" section
4. Verify `https://www.ekamanam.com` is listed

## Screenshot for Reference

The "Authorized JavaScript origins" section should look like:

```
Authorized JavaScript origins
URIs must not contain a path, query parameters, fragments, or wildcards

1  https://www.ekamanam.com
2  https://ekamanam.com
3  https://ekamanam.firebaseapp.com
4  http://localhost:3000
```

## Troubleshooting

### Issue: "Save" button is grayed out
- Make sure URIs don't have trailing slashes
- Ensure URIs use correct protocol (https://)
- Check for duplicate entries

### Issue: Still getting error after 10 minutes
1. Check OAuth consent screen is published
2. Verify correct client ID is in the code
3. Try using a different browser
4. Clear all browser cache and cookies

### Issue: Different error appears
If you see a different error like:
- `access_denied` - User declined permissions
- `popup_closed_by_user` - User closed popup
- `org_internal` - OAuth consent screen restricted to organization

Refer to the main troubleshooting guide in GOOGLE_DRIVE_SETUP.md

## Important Notes

### Firebase vs OAuth Client

You have TWO different clients:
1. **Firebase OAuth Client** (for authentication)
2. **Google Identity Services Client** (for Drive API)

Make sure you're editing the CORRECT client ID:
`662515641730-ke7iqkpepqlpehgvt8k4nv5qhv573c56.apps.googleusercontent.com`

### Domain Authorization

The domain must also be authorized in:
1. Firebase Authentication → Settings → Authorized domains
2. OAuth Consent Screen → Authorized domains

Check both locations.

## Quick Fix Command

If you have `gcloud` CLI installed:

```bash
# List all OAuth clients
gcloud alpha iap oauth-clients list --project=ekamanam

# Unfortunately, you need to use the Console UI to add origins
# gcloud doesn't support updating OAuth client origins
```

You MUST use the Google Cloud Console web interface to add authorized origins.

---

**Next Steps After Fix**:
1. Add authorized origins in Google Cloud Console
2. Wait 5-10 minutes
3. Test sign-in flow in incognito mode
4. Report back if successful!

**Current Status**: Waiting for you to add authorized origins
**Deployment**: v7.2.1 is ready, just needs OAuth client configuration
