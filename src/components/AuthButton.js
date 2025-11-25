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
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

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
    try {
      await signInWithPopup(auth, googleProvider);
      handleClose();
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('Failed to sign in: ' + error.message);
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
            src={user.photoURL} 
            alt={user.displayName}
            sx={{ width: 32, height: 32 }}
          />
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

