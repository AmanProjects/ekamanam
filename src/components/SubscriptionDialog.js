import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import PricingPlans from './PricingPlans';

const SubscriptionDialog = ({ open, onClose, user, currentTier }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          maxHeight: '95vh',
          bgcolor: 'background.default'
        }
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: { xs: 8, sm: 16 },
          top: { xs: 8, sm: 16 },
          zIndex: 1300,
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': {
            bgcolor: 'action.hover',
            transform: 'scale(1.1)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 }, overflow: 'auto' }}>
        <PricingPlans
          user={user}
          currentTier={currentTier}
          onClose={onClose}
          showCloseButton={false}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;

