import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Link,
  Divider
} from '@mui/material';
import { Save, Key } from '@mui/icons-material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

function SettingsDialog({ open, onClose, user }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      const storedKey = localStorage.getItem('gemini_pat');
      if (storedKey) {
        setApiKey(storedKey);
      }
      setSaved(false);
    }
  }, [open]);

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) return;
    
    setSaved(true);
    
    // Always save to localStorage as backup
    localStorage.setItem('gemini_pat', trimmedKey);
    localStorage.setItem('setup_complete', 'true');
    
    // If user is signed in with Google, save to Firebase too
    if (user && db) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          { 
            apiKey: trimmedKey,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastUpdated: new Date()
          },
          { merge: true }
        );
        alert("API Key Saved & Synced to your Google Account! 🎉");
      } catch (error) {
        console.error("Error saving to cloud:", error);
        alert("API Key Saved Locally! (Cloud sync unavailable)");
      }
    } else {
      alert("API Key Saved Locally! Sign in with Google to sync across devices.");
    }
    
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Key color="primary" />
          <Typography variant="h6" fontWeight={600}>Settings</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Gemini API Key
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Required for AI-powered features like explanations and teacher mode.
          </Typography>
          
          <TextField
            fullWidth
            type="password"
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>How to get your API key:</strong>
            </Typography>
            <Typography variant="body2" component="ol" sx={{ pl: 2, mt: 1 }}>
              <li>Visit <Link href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</Link></li>
              <li>Sign in with your Google account</li>
              <li>Click "Create API Key"</li>
              <li>Copy and paste the key here</li>
            </Typography>
          </Alert>

          {saved && (
            <Alert severity="success">
              API key saved successfully!
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Account
          </Typography>
          {user ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Signed in as: <strong>{user.email}</strong>
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not signed in. Sign in to sync your settings across devices.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          startIcon={<Save />}
          disabled={!apiKey.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsDialog;

