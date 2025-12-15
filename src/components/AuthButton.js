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
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, googleProvider);

      // v7.1.2: Extract and store Google OAuth credential for Drive API
      // Must use GoogleAuthProvider.credentialFromResult() to get the OAuth token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
        console.log('✅ Google OAuth access token stored for Drive API');
        console.log('🔑 Token preview:', credential.accessToken.substring(0, 20) + '...');
      } else {
        console.warn('⚠️ OAuth credential not found in sign-in result. Drive features may not work.');
        console.log('📋 Result structure:', {
          hasCredential: !!result.credential,
          hasUser: !!result.user,
          providerData: result.user?.providerData
        });
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
      await signOut(auth);
      handleClose();
    } catch (error) {
      console.error('Sign-out error:', error);
      alert('Failed to sign out: ' + error.message);
    }
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

