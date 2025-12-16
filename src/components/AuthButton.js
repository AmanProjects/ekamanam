import React, { useState } from 'react';
import { 
  Button, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Divider,
  Typography 
} from '@mui/material';
import { 
  Login, 
  Logout, 
  Person 
} from '@mui/icons-material';
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/config';

function AuthButton({ user }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignIn = async () => {
    if (!isFirebaseConfigured) {
      window.confirm(
        "🔧 Firebase Not Configured\n\n" +
        "Google Sign-In requires Firebase setup. You have two options:\n\n" +
        "1. Continue WITHOUT Sign-In (Recommended for quick start)\n" +
        "   - App works fully\n" +
        "   - Store API key locally\n" +
        "   - Notes saved in browser\n\n" +
        "2. Set up Firebase (For cloud sync)\n" +
        "   - Enable Google Sign-In\n" +
        "   - Sync across devices\n\n" +
        "Click OK to continue without sign-in."
      );
      return;
    }

    if (!auth || !googleProvider) {
      alert("Firebase initialization failed. Please check your Firebase configuration.");
      return;
    }

    try {
      // v7.2.2: Streamlined OAuth - Single popup for both auth + Drive scopes
      // Firebase Auth with Google provider already requests Drive scopes (set in config.js)
      // We extract the access token from the credential result

      // Sign in with Firebase - includes Drive scopes from config.js
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Firebase authentication successful');

      // Extract OAuth access token from credential
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
        console.log('✅ OAuth access token stored from Firebase credential');
        console.log('🔑 Token preview:', credential.accessToken.substring(0, 20) + '...');
        console.log('✅ Drive permissions included via Firebase scopes');
      } else {
        console.warn('⚠️ No access token in Firebase credential, requesting via GIS...');
        // Fallback: Request token via Google Identity Services
        await requestDriveTokenViaGIS();
      }

      handleClose();
    } catch (error) {
      console.error('Sign-in error:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the sign-in popup");
      } else if (error.code === 'auth/popup-blocked') {
        alert("🚫 Popup Blocked\n\nYour browser blocked the sign-in popup.\n\nTo fix:\n1. Allow popups for this site\n2. Try again");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("⚠️ Domain Not Authorized\n\nYour current domain needs to be authorized in Firebase Console.");
      } else {
        alert('Failed to sign in: ' + error.message);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear stored tokens
      localStorage.removeItem('google_access_token');
      await signOut(auth);
      handleClose();
    } catch (error) {
      console.error('Sign-out error:', error);
      alert('Failed to sign out: ' + error.message);
    }
  };

  // Fallback: Request Drive token via Google Identity Services
  // Only used if Firebase credential doesn't include access token
  const requestDriveTokenViaGIS = async () => {
    // Load Google Identity Services library if not already loaded
    if (!window.google?.accounts?.oauth2) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      console.log('✅ Google Identity Services loaded');
    }

    // v7.2.14: Use environment variable for OAuth Client ID
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '662515641730-ke7iqkpepqlpehgvt8k4nv5qhv573c56.apps.googleusercontent.com';

    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
        hint: auth.currentUser?.email, // Pre-select the signed-in account
        callback: (tokenResponse) => {
          if (tokenResponse.access_token) {
            localStorage.setItem('google_access_token', tokenResponse.access_token);
            console.log('✅ OAuth access token stored via GIS fallback');
            resolve(tokenResponse);
          } else {
            reject(new Error(tokenResponse.error || 'No access token received'));
          }
        },
        error_callback: reject
      });
      
      // Use 'none' prompt to avoid showing account picker again
      // User already selected account in Firebase popup
      client.requestAccessToken({ prompt: '' });
    });
  };

  if (!user) {
    return (
      <Button
        variant="outlined"
        startIcon={<Login />}
        onClick={handleSignIn}
      >
        Sign In
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={
          <Avatar 
            src={user.photoURL || undefined} 
            alt={user.displayName}
            sx={{ width: 32, height: 32 }}
            imgProps={{
              referrerPolicy: 'no-referrer',
              onError: (e) => {
                console.warn('Avatar image failed to load');
              }
            }}
          >
            {!user.photoURL && (user.displayName?.charAt(0) || user.email?.charAt(0) || 'U')}
          </Avatar>
        }
      >
        {user.displayName?.split(' ')[0] || 'User'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">{user.email}</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
}

export default AuthButton;

