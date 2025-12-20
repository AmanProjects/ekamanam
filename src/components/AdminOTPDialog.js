import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Lock as LockIcon, Email as EmailIcon } from '@mui/icons-material';
import { sendOTPToAdmin, verifyOTP, createAdminSession } from '../services/otpService';
import { getParentEmail } from '../services/profileService';

function AdminOTPDialog({ open, onClose, onSuccess, onOpenSettings }) {
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  // Load parent email when dialog opens
  useEffect(() => {
    if (open) {
      const email = getParentEmail();
      setParentEmail(email || '');
    }
  }, [open]);

  // Mask email for privacy (e.g., "john.doe@gmail.com" → "jo****oe@gmail.com")
  const maskEmail = (email) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    if (localPart.length <= 4) {
      // Short email: show first char, mask rest
      return localPart[0] + '****@' + domain;
    }
    // Longer email: show first 2 and last 2 chars
    return localPart.slice(0, 2) + '****' + localPart.slice(-2) + '@' + domain;
  };

  const handleRequestOTP = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    const result = await sendOTPToAdmin();
    
    setLoading(false);
    
    if (result.success) {
      setStep('verify');
      setMessage(result.message);
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOTP = () => {
    setError('');
    
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    
    const isValid = verifyOTP(otp);
    
    if (isValid) {
      createAdminSession();
      setMessage('✅ Access granted!');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 500);
    } else {
      setError('Invalid or expired OTP. Please try again.');
      setOtp('');
    }
  };

  const handleClose = () => {
    setStep('request');
    setOtp('');
    setError('');
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            🔐 Admin Authentication
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {step === 'request' ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" paragraph>
              Admin dashboard access is restricted. An OTP will be sent to the registered parent email address.
            </Typography>
            
            {parentEmail ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                  <strong>Parent Email:</strong> {maskEmail(parentEmail)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  To change this email, go to{' '}
                  {onOpenSettings ? (
                    <Button 
                      size="small" 
                      onClick={() => { onClose(); onOpenSettings(); }}
                      sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontSize: 'inherit', verticalAlign: 'baseline' }}
                    >
                      Settings → General
                    </Button>
                  ) : (
                    <strong>Settings → General</strong>
                  )}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  No parent email configured.
                </Typography>
                <Typography variant="body2">
                  Please go to{' '}
                  {onOpenSettings ? (
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => { onClose(); onOpenSettings(); }}
                      sx={{ ml: 1 }}
                    >
                      Settings → General
                    </Button>
                  ) : (
                    <strong>Settings → General</strong>
                  )}
                  {' '}and add a parent email address.
              </Typography>
            </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
              onClick={handleRequestOTP}
              disabled={loading || !parentEmail}
              size="large"
            >
              {loading ? 'Sending OTP...' : 'Send OTP to Parent Email'}
            </Button>
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            {message && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}
            
            <Typography variant="body1" paragraph>
              Enter the 6-digit OTP sent to <strong>{maskEmail(parentEmail)}</strong>:
            </Typography>
            
            <TextField
              fullWidth
              label="Enter OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              placeholder="123456"
              inputProps={{ 
                maxLength: 6,
                style: { 
                  fontSize: '24px', 
                  letterSpacing: '8px', 
                  textAlign: 'center',
                  fontWeight: 600
                }
              }}
              sx={{ mb: 2 }}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && otp.length === 6) {
                  handleVerifyOTP();
                }
              }}
            />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              OTP expires in 5 minutes
            </Typography>
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6}
              size="large"
            >
              Verify & Access Dashboard
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setStep('request');
                setOtp('');
                setError('');
              }}
              sx={{ mt: 1 }}
            >
              Didn't receive OTP? Send again
            </Button>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AdminOTPDialog;

