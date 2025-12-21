import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Demo Accounts Admin Component
 * Manages demo accounts in real-time via Firestore
 * Accessible only after OTP verification
 */
function DemoAccountsAdmin({ onClose }) {
  const [demoEmails, setDemoEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  const ADMIN_EMAIL = 'amandeep.talwar@gmail.com';

  // Load demo accounts from Firestore
  const loadDemoAccounts = async () => {
    setLoading(true);
    try {
      const demoDoc = await getDoc(doc(db, 'admin', 'demoAccounts'));
      
      if (demoDoc.exists()) {
        const data = demoDoc.data();
        setDemoEmails(data.emails || []);
        setLastUpdated(data.updatedAt?.toDate());
        console.log('✅ Loaded demo accounts:', data.emails?.length || 0);
      } else {
        console.log('📋 No demo accounts found, initializing...');
        setDemoEmails([]);
      }
    } catch (error) {
      console.error('❌ Error loading demo accounts:', error);
      showAlert('Failed to load demo accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadDemoAccounts();
  }, []);

  // Show alert
  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  // Close alert
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Validate email
  const isValidEmail = (email) => {
    return email && email.includes('@') && email.includes('.');
  };

  // Add demo account
  const handleAddDemo = async () => {
    const email = newEmail.trim().toLowerCase();

    // Validation
    if (!email) {
      showAlert('Please enter an email address', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    if (demoEmails.includes(email)) {
      showAlert('This email is already a demo account', 'warning');
      return;
    }

    setSaving(true);
    try {
      const updatedEmails = [...demoEmails, email];

      // Save to Firestore
      await setDoc(doc(db, 'admin', 'demoAccounts'), {
        emails: updatedEmails,
        updatedAt: new Date(),
        updatedBy: ADMIN_EMAIL
      });

      setDemoEmails(updatedEmails);
      setNewEmail('');
      showAlert(`✅ Added demo account: ${email}`, 'success');
      console.log('✅ Demo account added:', email);
    } catch (error) {
      console.error('❌ Error adding demo account:', error);
      showAlert('Failed to add demo account', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Remove demo account
  const handleRemoveDemo = async (emailToRemove) => {
    if (!window.confirm(`Remove demo account:\n${emailToRemove}\n\nAre you sure?`)) {
      return;
    }

    setSaving(true);
    try {
      const updatedEmails = demoEmails.filter(email => email !== emailToRemove);

      // Save to Firestore
      await setDoc(doc(db, 'admin', 'demoAccounts'), {
        emails: updatedEmails,
        updatedAt: new Date(),
        updatedBy: ADMIN_EMAIL
      });

      setDemoEmails(updatedEmails);
      showAlert(`✅ Removed demo account: ${emailToRemove}`, 'success');
      console.log('✅ Demo account removed:', emailToRemove);
    } catch (error) {
      console.error('❌ Error removing demo account:', error);
      showAlert('Failed to remove demo account', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Format time ago
  const getTimeAgo = (date) => {
    if (!date) return 'Never';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Demo Account Management
          </Typography>
          <IconButton onClick={loadDemoAccounts} size="small" disabled={saving}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Add or remove demo accounts with instant STUDENT tier access
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" fontWeight={700}>
            {demoEmails.length}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Active Demos
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
          <Typography variant="body1" fontWeight={600}>
            {getTimeAgo(lastUpdated)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Last Updated
          </Typography>
        </Paper>
      </Box>

      {/* Add New Demo Form */}
      <Paper sx={{ p: 2, mb: 3, border: '2px dashed', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          ➕ Add New Demo Account
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="Email Address"
            placeholder="demo@gmail.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddDemo();
              }
            }}
            disabled={saving}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddDemo}
            disabled={saving || !newEmail}
            startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ minWidth: 120 }}
          >
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </Box>
      </Paper>

      {/* Current Demo Accounts List */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
          Current Demo Accounts ({demoEmails.length})
        </Typography>
        
        {demoEmails.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary">
              No demo accounts configured yet.
              <br />
              Add your first demo account above to get started.
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined">
            <List disablePadding>
              {demoEmails.map((email, index) => (
                <React.Fragment key={email}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="body1" fontWeight={500}>
                            {email}
                          </Typography>
                          <Chip 
                            label="STUDENT" 
                            size="small" 
                            color="success" 
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary="Unlimited AI queries • Full premium features"
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveDemo(email)}
                        disabled={saving}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < demoEmails.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Real-time Updates:</strong> Changes take effect in 1-2 seconds. 
          Users will gain or lose demo access immediately upon next login.
        </Typography>
      </Alert>

      {/* Snackbar for alerts */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DemoAccountsAdmin;

