import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  Card,
  CardContent,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  LocalLibrary as LibraryIcon,
  Style as FlashcardIcon,
  Timeline as TimelineIcon,
  Calculate as MathIcon,
  Science as ChemistryIcon,
  Bolt as PhysicsIcon,
  Code as CodeIcon,
  Public as GlobeIcon,
  Psychology as VyonnIconMui,
  Login as LoginIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  Mic as MicIcon,
  Language as LanguageIcon,
  ThreeDRotation as ThreeDIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import Dashboard from './Dashboard';
import SubscriptionBanner from './SubscriptionBanner';

/**
 * LandingDashboard Component - v10.7.38
 * 
 * Merged landing page + dashboard that adapts based on authentication:
 * 
 * EVERYONE SEES:
 * - Hero section with tagline
 * - Story section
 * - Feature highlights
 * - Tool showcase
 * 
 * NOT LOGGED IN:
 * - "Sign in to access" prompts
 * - Feature previews (non-interactive)
 * - Sign-in CTAs
 * 
 * LOGGED IN:
 * - Full interactive Dashboard
 * - Learning Hubs access
 * - All educational tools
 */
function LandingDashboard({
  user,
  onOpenHubs,
  subscription,
  onUpgrade,
  onOpenFlashcards,
  onOpenTimeline,
  onOpenDoubtLibrary,
  dueCardCount,
  pdfCount,
  currentStreak,
  onOpenSettings,
  onSignIn, // Callback to trigger sign-in dialog
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isLoggedIn = !!user;

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user's first name
  const getUserFirstName = () => {
    if (!user) return '';
    if (user.displayName) {
      return user.displayName.split(' ')[0].toLowerCase();
    }
    if (user.email) {
      return user.email.split('@')[0].toLowerCase();
    }
    return '';
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      {/* Subscription Banner - Mobile */}
      {isMobile && (
        <SubscriptionBanner 
          subscription={subscription} 
          onUpgrade={onUpgrade}
          isMobile={true}
          isLoggedIn={isLoggedIn}
          user={user}
        />
      )}
      
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Blobs */}
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(102, 126, 234, 0.2)',
            filter: 'blur(60px)',
            top: -100,
            left: -100,
            animation: 'float 15s infinite alternate',
            '@keyframes float': {
              '0%': { transform: 'translate(0, 0) scale(1)' },
              '100%': { transform: 'translate(30px, -30px) scale(1.1)' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(118, 75, 162, 0.2)',
            filter: 'blur(60px)',
            bottom: -100,
            right: -100,
            animation: 'float 15s infinite alternate-reverse',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box textAlign="center">
            {/* Personalized Greeting */}
            {isLoggedIn && (
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                {getGreeting()}, {getUserFirstName()}!
              </Typography>
            )}

            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.75rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              See. Hear. Speak. Learn.
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2rem', md: '3rem' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your Voice-Powered AI Tutor
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 800, mx: 'auto', lineHeight: 1.6 }}
            >
              Your smart companion that sees, hears, and speaks with you - featuring voice input,
              interactive visualizations, and multilingual AI that responds in your language.
            </Typography>

            {/* CTA Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {isLoggedIn ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={onOpenHubs}
                  endIcon={<ArrowIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: 3,
                  }}
                >
                  Open Learning Hub
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={onSignIn}
                  startIcon={<LoginIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: 3,
                  }}
                >
                  Sign In to Get Started
                </Button>
              )}
              <Button
                variant="outlined"
                size="large"
                href="#story"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                Read Our Story
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Powerful Features Section - Professional EdTech Design */}
      <Box id="features" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Powerful Features
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
          >
            Everything you need for an immersive, effective learning experience
          </Typography>

          {/* Clean Professional Feature Cards */}
          <Grid container spacing={3}>
            {[
              {
                icon: <MicIcon sx={{ fontSize: 48 }} />,
                title: 'Voice-Powered Learning',
                stat: 'Voice Input',
                description:
                  'Speak your questions naturally. Ekamanam listens, understands, and responds in your language.',
              },
              {
                icon: <LanguageIcon sx={{ fontSize: 48 }} />,
                title: 'Multilingual Support',
                stat: '10+ Languages',
                description:
                  'Learn in Telugu, Hindi, Tamil, or any language you prefer. AI explanations adapt to your chosen language.',
              },
              {
                icon: <ThreeDIcon sx={{ fontSize: 48 }} />,
                title: '3D Visualizations',
                stat: '3D Interactive',
                description:
                  'Explore molecules, geometric shapes, and concepts in interactive 3D. Rotate, zoom, and understand.',
              },
              {
                icon: <VyonnIconMui sx={{ fontSize: 48 }} />,
                title: 'AI Tutor',
                stat: 'Smart Assistant',
                description:
                  'Your personal AI tutor that understands context, suggests the right tools, and guides your learning journey.',
              },
              {
                icon: <FlashcardIcon sx={{ fontSize: 48 }} />,
                title: 'Spaced Repetition',
                stat: '50+ Tools',
                description:
                  'Smart flashcards and interactive tools that adapt to your learning pace for maximum retention.',
              },
              {
                icon: <CheckIcon sx={{ fontSize: 48 }} />,
                title: 'Progress Tracking',
                stat: 'Mobile Ready',
                description:
                  'Monitor your learning journey with detailed analytics, streaks, and personalized insights on any device.',
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    height: '100%',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {feature.title}
                    </Typography>
                    <Chip
                      label={feature.stat}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Why Ekamanam Section - Personal Story with Professional Design */}
      <Box
        id="story"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Why Ekamanam?
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary" 
            textAlign="center" 
            sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
          >
            Born from a father's quest to help his child truly understand, not just read
          </Typography>

          {/* Personal Story - The Moment */}
          <Paper 
            elevation={1}
            sx={{ 
              p: { xs: 3, md: 4 }, 
              mb: 4,
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.8 }}>
              "Papa, I can read the words, but I don't really <em>understand</em> it.
              Can you show me what a cube actually looks like? Where is Hyderabad on a map?
              Can I hear this in my language? I want to <em>see</em> it, not just read about it..."
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', textAlign: 'right' }}>
              — My child, struggling with static textbooks
            </Typography>
          </Paper>

          {/* The Challenge */}
          <Paper elevation={1} sx={{ p: { xs: 3, md: 4 }, mb: 4, bgcolor: 'background.paper' }}>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              We all have that stack of textbooks, PDFs, and study materials we swear we're going to master.
              But let's be honest—<strong>staring at static pages doesn't equal learning</strong>.
              It's overwhelming, and retention is a struggle.
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
              Students today face a unique challenge: textbooks are flat, static, and often in a language
              they're still mastering. The struggle isn't ability; it's <strong>engagement</strong>.
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
              Modern learning needs to:
            </Typography>

            <Box component="ul" sx={{ pl: 3, mb: 0, '& li': { mb: 1.5 } }}>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Speak their language</strong> — Not just English, but Telugu, Hindi, Tamil, and more
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Show, not just tell</strong> — 3D models you can rotate, molecules you can explore
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Sound natural</strong> — Voice explanations that help auditory learners
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Respond instantly</strong> — An AI that's always ready to explain, never judges
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Make connections</strong> — From textbook concepts to real-world understanding
                </Typography>
              </li>
            </Box>
          </Paper>

          {/* The Solution */}
          <Paper 
            elevation={1}
            sx={{ 
              p: { xs: 3, md: 4 }, 
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.100',
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              That's where Ekamanam comes in
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
              Ekamanam (ఏకమనం - "One Mind") isn't just a document reader; it's a <strong>complete learning workspace</strong> 
              built for students who need more than words on a page.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              Upload any PDF, and Ekamanam transforms it. Don't just read—<strong>apply</strong>.
              Jump into our Labs to practice concepts hands-on, and use our suite of smart Tools
              to break down complex data instantly. With our AI Tutor and Spaced Repetition,
              you go from passive reading to active mastering in one seamless flow.
            </Typography>
            
            <Typography 
              variant="h6" 
              fontWeight={600} 
              color="primary" 
              textAlign="center" 
              sx={{ mt: 3, mb: 0 }}
            >
              Stop just consuming information. Start building skills.
            </Typography>
          </Paper>
        </Container>
      </Box>

      {/* Final CTA Section */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {isLoggedIn ? 'Ready to Continue Learning?' : 'Ready to Transform Your Learning?'}
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            {isLoggedIn
              ? 'Access your Learning Hub and start your focused learning session today.'
              : 'Join thousands of students who are learning smarter, not harder.'}
          </Typography>
          {isLoggedIn ? (
            <Button
              variant="contained"
              size="large"
              onClick={onOpenHubs}
              endIcon={<ArrowIcon />}
              sx={{
                bgcolor: 'background.paper',
                color: 'primary.main',
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Open Learning Hub
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={onSignIn}
              startIcon={<LoginIcon />}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Sign In with Google
            </Button>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          bgcolor: 'grey.900',
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
              © {new Date().getFullYear()} Ekamanam. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>
              Disclaimer: AI-generated content is for educational purposes only and may contain errors. 
              Users should verify all information independently. Ekamanam is not liable for any inaccuracies.
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}

export default LandingDashboard;

