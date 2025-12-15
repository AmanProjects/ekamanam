import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  CloudDone as CloudIcon,
  Folder as FolderIcon,
  Security as SecurityIcon,
  Cached as SyncIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

import {
  requestDrivePermissions,
  initializeFolderStructure
} from '../services/googleDriveService';

/**
 * Drive Permission Dialog
 *
 * Explains benefits and requests Google Drive access
 */
export default function DrivePermissionDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Grant Permission', 'Create Folders', 'Ready to Sync'];

  const benefits = [
    {
      icon: <CloudIcon color="primary" />,
      title: 'Your Data, Your Drive',
      description: 'PDFs stored in your Google Drive - you own and control them'
    },
    {
      icon: <SyncIcon color="primary" />,
      title: 'Access from Anywhere',
      description: 'Login from any device and continue where you left off'
    },
    {
      icon: <SpeedIcon color="primary" />,
      title: 'Smart AI Caching',
      description: 'Save API costs - never re-index the same page twice'
    },
    {
      icon: <SecurityIcon color="primary" />,
      title: 'Privacy First',
      description: 'No data stored on our servers - everything stays in your Drive'
    },
    {
      icon: <FolderIcon color="primary" />,
      title: 'Organized Storage',
      description: 'Clean folder structure: PDFs, Cache, Notes, and Progress'
    }
  ];

  const handleGrantAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Request permissions
      setActiveStep(0);
      await requestDrivePermissions();

      // Step 2: Create folder structure
      setActiveStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause for UI
      await initializeFolderStructure();

      // Step 3: Success
      setActiveStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Drive setup complete');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('❌ Drive setup error:', err);
      setError(err.message || 'Failed to setup Google Drive. Please try again.');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <CloudIcon />
        <Typography variant="h6">Connect Google Drive</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                {activeStep === 0 && 'Requesting permissions...'}
                {activeStep === 1 && 'Creating Ekamanam folder in your Drive...'}
                {activeStep === 2 && 'Finalizing setup...'}
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              Ekamanam needs access to your Google Drive to provide a seamless learning experience across all your devices.
            </Typography>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
              Why Connect Google Drive?
            </Typography>

            <List dense>
              {benefits.map((benefit, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {benefit.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={benefit.title}
                    secondary={benefit.description}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.85rem' }}
                  />
                </ListItem>
              ))}
            </List>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>What we'll create:</strong> A folder named "Ekamanam" in your Drive with subfolders for PDFs, AI cache, notes, and progress tracking.
              </Typography>
            </Alert>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <CheckIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                <strong>Free storage:</strong> Uses your Google Drive quota (15 GB free)
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      {!loading && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Maybe Later
          </Button>
          <Button
            variant="contained"
            onClick={handleGrantAccess}
            disabled={loading}
            startIcon={<CloudIcon />}
          >
            Connect Google Drive
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
