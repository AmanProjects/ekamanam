import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Upgrade as UpgradeIcon,
  Star as StarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { PRICING_PLANS, createRazorpayCheckout, formatPrice, calculateSavings } from '../services/razorpayService';

const PricingPlans = ({ user, currentTier, onClose, showCloseButton = true }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [isYearly, setIsYearly] = useState(false);

  const handleUpgrade = async (tierKey) => {
    if (!user) {
      alert('Please sign in to upgrade your plan');
      return;
    }

    if (tierKey === 'FREE') {
      return; // Can't "upgrade" to free
    }

    setLoading(true);
    setError(null);
    setSelectedTier(tierKey);

    try {
      console.log('🔄 Creating Razorpay checkout for tier:', tierKey, 'Yearly:', isYearly);

      // Get user name from user object or prompt
      const userName = user.displayName || user.email?.split('@')[0] || 'User';

      await createRazorpayCheckout(tierKey, isYearly, user.uid, user.email, userName);

      // Razorpay opens modal, loading state will be cleared after payment completion or cancellation
      setLoading(false);
      setSelectedTier(null);

    } catch (err) {
      console.error('❌ Error creating Razorpay checkout:', err);

      // Show user-friendly error message
      let errorMessage = 'Failed to start checkout. Please try again.';

      if (err.message && err.message.includes('Razorpay is not configured')) {
        errorMessage = 'Payment system is not configured yet. Please contact support.';
      } else if (err.message && err.message.includes('Failed to load Razorpay SDK')) {
        errorMessage = 'Failed to load payment system. Please check your internet connection.';
      }

      setError(errorMessage);
      setLoading(false);
      setSelectedTier(null);
    }
  };

  // Define pricing tiers for display
  const tiers = [
    {
      key: 'FREE',
      name: 'Free',
      description: 'Perfect for trying out Ekamanam',
      price: 0,
      features: [
        '5 AI queries per day',
        '100 MB PDF storage',
        'Basic learning features',
        'Single device access'
      ],
      popular: false
    },
    {
      key: 'STUDENT',
      name: 'Student',
      description: 'Ideal for individual learners',
      monthlyPrice: PRICING_PLANS.STUDENT.monthly.price,
      yearlyPrice: PRICING_PLANS.STUDENT.yearly.price,
      features: PRICING_PLANS.STUDENT.features,
      popular: true
    },
    {
      key: 'EDUCATOR',
      name: 'Educator',
      description: 'Best for teachers and tutors',
      monthlyPrice: PRICING_PLANS.EDUCATOR.monthly.price,
      yearlyPrice: PRICING_PLANS.EDUCATOR.yearly.price,
      features: PRICING_PLANS.EDUCATOR.features,
      popular: false
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      py: { xs: 3, md: 4 },
      px: { xs: 2, sm: 3 }
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            fontSize: { xs: '1.75rem', md: '2.25rem' }
          }}
        >
          Choose Your Plan
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{
            fontWeight: 400,
            opacity: 0.7,
            fontSize: { xs: '0.95rem', md: '1.05rem' },
            mb: 3
          }}
        >
          Unlock the full power of AI-powered learning
        </Typography>

        {/* Monthly/Yearly Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isYearly ? 400 : 600,
              color: isYearly ? 'text.secondary' : 'text.primary'
            }}
          >
            Monthly
          </Typography>
          <ToggleButtonGroup
            value={isYearly ? 'yearly' : 'monthly'}
            exclusive
            onChange={(e, value) => {
              if (value !== null) {
                setIsYearly(value === 'yearly');
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6339a3 100%)'
                  }
                }
              }
            }}
          >
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">
              Yearly
              <Chip
                label="Save 17%"
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'success.main',
                  color: 'white'
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isYearly ? 600 : 400,
              color: isYearly ? 'text.primary' : 'text.secondary'
            }}
          >
            Yearly
          </Typography>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Pricing Cards */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center" alignItems="stretch" sx={{ maxWidth: 1200, mx: 'auto' }}>
        {tiers.map((tier) => {
          const isCurrentTier = tier.key === currentTier;
          const isPopular = tier.popular;
          const isFree = tier.price === 0;
          const displayPrice = isFree ? 0 : (isYearly ? tier.yearlyPrice : tier.monthlyPrice);
          const displayPeriod = isFree ? '' : (isYearly ? 'year' : 'month');
          const savings = !isFree && isYearly && tier.monthlyPrice && tier.yearlyPrice
            ? calculateSavings(tier.monthlyPrice, tier.yearlyPrice)
            : null;

          return (
            <Grid item xs={12} sm={6} md={4} key={tier.key} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: 1,
                  borderColor: isPopular ? 'transparent' : 'divider',
                  background: isPopular
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
                    : 'background.paper',
                  boxShadow: isPopular ? '0 8px 40px rgba(102, 126, 234, 0.15)' : 1,
                  borderRadius: 2,
                  transform: { xs: 'none', md: isPopular ? 'scale(1.04)' : 'none' },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'visible',
                  '&:hover': {
                    transform: { xs: 'none', md: isPopular ? 'scale(1.05)' : 'scale(1.01)' },
                    boxShadow: isPopular
                      ? '0 12px 48px rgba(102, 126, 234, 0.2)'
                      : '0 8px 24px rgba(0, 0, 0, 0.1)',
                    borderColor: isPopular ? 'transparent' : 'primary.light'
                  },
                  ...(isPopular && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 2,
                      padding: '2px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      pointerEvents: 'none',
                      zIndex: -1
                    }
                  })
                }}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <Chip
                    icon={<StarIcon sx={{ fontSize: '0.85rem' }} />}
                    label="MOST POPULAR"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      px: 2,
                      height: 28,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      zIndex: 10,
                      '& .MuiChip-icon': {
                        color: 'white',
                        marginLeft: '4px'
                      },
                      '& .MuiChip-label': {
                        paddingLeft: '8px',
                        paddingRight: '12px'
                      }
                    }}
                  />
                )}

                {/* Current Plan Badge */}
                {isCurrentTier && (
                  <Chip
                    icon={<CheckIcon sx={{ fontSize: '0.9rem' }} />}
                    label="CURRENT PLAN"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      fontWeight: 600,
                      bgcolor: 'success.main',
                      color: 'white',
                      '& .MuiChip-icon': {
                        color: 'white'
                      }
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1, pt: isPopular ? 4.5 : 3, px: 2.5, pb: 2.5 }}>
                  {/* Tier Name */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: isPopular ? 'primary.main' : 'text.primary',
                      mb: 0.75,
                      fontSize: '1.35rem'
                    }}
                  >
                    {tier.name}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      minHeight: { xs: 'auto', sm: 36 },
                      lineHeight: 1.5,
                      fontSize: '0.8rem'
                    }}
                  >
                    {tier.description}
                  </Typography>

                  {/* Price */}
                  <Box
                    sx={{
                      mb: 2.5,
                      pb: 2.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {isFree ? (
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          color: 'text.primary',
                          fontSize: '2.25rem'
                        }}
                      >
                        Free
                      </Typography>
                    ) : (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              fontSize: '2.25rem',
                              background: isPopular
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'text.primary',
                              backgroundClip: isPopular ? 'text' : 'unset',
                              WebkitBackgroundClip: isPopular ? 'text' : 'unset',
                              WebkitTextFillColor: isPopular ? 'transparent' : 'unset'
                            }}
                          >
                            {formatPrice(displayPrice)}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ fontWeight: 500, fontSize: '0.95rem' }}
                          >
                            /{displayPeriod}
                          </Typography>
                        </Box>
                        {savings && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: 'success.main',
                              fontWeight: 600,
                              mt: 0.5
                            }}
                          >
                            Save {formatPrice(savings.amount)} ({savings.percentage}% off)
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Features List */}
                  <List dense sx={{ mb: 0.5 }}>
                    {tier.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0, py: 0.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 28, mt: 0.15 }}>
                          <CheckIcon
                            sx={{
                              fontSize: '1.1rem',
                              color: isPopular ? 'primary.main' : 'success.main',
                              fontWeight: 'bold'
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            variant: 'body2',
                            sx: {
                              fontSize: '0.8rem',
                              lineHeight: 1.5,
                              color: 'text.primary',
                              fontWeight: 400
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                {/* Action Button */}
                <Box sx={{ p: 2.5, pt: 1.5 }}>
                  <Button
                    fullWidth
                    variant={isCurrentTier ? 'outlined' : (isPopular ? 'contained' : 'outlined')}
                    size="large"
                    disabled={isCurrentTier || loading || isFree}
                    startIcon={loading && selectedTier === tier.key ? <CircularProgress size={20} /> : (isCurrentTier ? <CheckIcon /> : <UpgradeIcon />)}
                    onClick={() => handleUpgrade(tier.key)}
                    sx={{
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: '1rem',
                      borderRadius: 1.5,
                      textTransform: 'none',
                      boxShadow: 'none',
                      ...(isCurrentTier && {
                        borderColor: 'success.main',
                        color: 'success.main',
                        bgcolor: 'success.lighter',
                        cursor: 'default',
                        '&.Mui-disabled': {
                          borderColor: 'success.main',
                          color: 'success.main',
                          bgcolor: 'success.lighter'
                        }
                      }),
                      ...(isPopular && !isCurrentTier && {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #6339a3 100%)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s ease'
                      }),
                      ...(!isPopular && !isCurrentTier && !isFree && {
                        borderColor: 'divider',
                        borderWidth: 2,
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s ease'
                      })
                    }}
                  >
                    {isCurrentTier
                      ? 'Current Plan'
                      : loading && selectedTier === tier.key
                      ? 'Processing...'
                      : isFree
                      ? 'Get Started'
                      : 'Upgrade Now'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      </Box>

      {/* Additional Info */}
      <Box sx={{ textAlign: 'center', mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
          All plans include access to core features • Cancel anytime
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
          🔒 Secure payment by Stripe • 💳 UPI & Cards supported • ⚡ Instant activation
        </Typography>
      </Box>

      {/* Close Button (if in dialog) */}
      {showCloseButton && onClose && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button onClick={onClose} startIcon={<CloseIcon />}>
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PricingPlans;
