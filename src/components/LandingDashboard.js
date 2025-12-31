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
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
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

            {/* Key Stats */}
            <Grid container spacing={2} sx={{ mt: 8, maxWidth: 1000, mx: 'auto' }}>
              {[
                { icon: <MicIcon />, text: '🎤', label: 'Voice Input', color: 'primary' },
                { icon: <LanguageIcon />, text: '10+', label: 'Languages', color: 'success' },
                { icon: <ThreeDIcon />, text: '50+', label: 'Interactive Tools', color: 'secondary' },
                { icon: <ThreeDIcon />, text: '3D', label: 'Visualizations', color: 'info' },
                { icon: <PhoneIcon />, text: '📱', label: 'Mobile Ready', color: 'warning' },
              ].map((stat, index) => (
                <Grid item xs={6} md={2.4} key={index}>
                  <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} sx={{ color: `${stat.color}.main`, mb: 0.5 }}>
                      {stat.text}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Subtle Subscription Status - Bottom of Hero */}
            {isLoggedIn && subscription?.daysRemaining && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Chip
                  icon={<CheckIcon />}
                  label={`Premium: ${subscription.daysRemaining} ${subscription.daysRemaining === 1 ? 'day' : 'days'} remaining`}
                  color={subscription.daysRemaining <= 7 ? 'warning' : 'primary'}
                  variant="outlined"
                  sx={{
                    fontSize: '0.875rem',
                    py: 2,
                    px: 1,
                    opacity: 0.8,
                    '&:hover': {
                      opacity: 1,
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* Story Section */}
      <Box id="story" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderLeft: '4px solid',
              borderColor: 'warning.main',
              bgcolor: 'warning.50',
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom>
              The Learning Challenge
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              "Papa, I can read the words, but I don't really <em>understand</em> it.
              Can you show me what a cube actually looks like? Where is Hyderabad on a map?
              Can I hear this in my language? I want to <em>see</em> it, not just read about it..."
            </Typography>
          </Paper>

          <Box sx={{ '& > p': { mb: 2, lineHeight: 1.8 } }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              Students today face a unique challenge: textbooks are flat, static, and often in a language
              they're still mastering. Reading about geometric shapes doesn't help them visualize.
              Reading about historical locations doesn't show them where they are.
              Reading scientific formulas doesn't make concepts come alive.
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              The struggle isn't ability; it's <strong>engagement</strong>. Learning needs to:
            </Typography>

            <Box component="ul" sx={{ pl: 4, mb: 3, '& li': { mb: 1 } }}>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Speak their language</strong> - Not just English, but Telugu, Hindi, Tamil, and more
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Show, not just tell</strong> - 3D models you can rotate, molecules you can explore
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Sound natural</strong> - Voice explanations that help auditory learners
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Respond instantly</strong> - An AI that's always ready to explain, never judges
                </Typography>
              </li>
              <li>
                <Typography variant="body1" color="text.secondary">
                  <strong>Make connections</strong> - From textbook concepts to real-world understanding
                </Typography>
              </li>
            </Box>

            <Typography variant="body1" color="text.secondary" paragraph>
              That's why we created <strong>Ekamanam</strong> (ఏకమనం - "One Mind"). We asked:
              <em> Could we build an AI learning platform that engages all the senses - visual, audio, and interactive?</em>
            </Typography>

            <Typography variant="h6" color="primary" fontWeight={600} sx={{ mt: 3 }}>
              The answer was yes. And here's what we built.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Why Ekamanam Section */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.3) 0%, rgba(255, 224, 178, 0.3) 100%)',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Why Ekamanam?
          </Typography>

          <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, mt: 4, borderRadius: 3 }}>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, fontSize: '1.1rem' }}>
              We all have that stack of textbooks, PDFs, and study materials we swear we're going to master.
              But let's be honest—<strong>staring at static pages doesn't equal learning</strong>.
              It's overwhelming, and retention is a struggle.
            </Typography>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              That's where Ekamanam comes in.
            </Typography>

            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              Ekamanam isn't just a document reader; it's a <strong>complete learning workspace</strong>.
            </Typography>

            <Box sx={{ my: 3, p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                Upload any PDF, and Ekamanam transforms it. Don't just read—<strong>apply</strong>.
                Jump into our Labs to practice concepts hands-on, and use our suite of smart Tools
                to break down complex data instantly. With our AI Tutor and Spaced Repetition,
                you go from passive reading to active mastering in one seamless flow.
              </Typography>
            </Box>

            <Typography variant="h6" fontWeight={600} color="primary" textAlign="center" sx={{ mt: 4 }}>
              Stop just consuming information. Start building skills.
            </Typography>
          </Paper>
        </Container>
      </Box>

      {/* Interactive Dashboard Section */}
      <Box id="dashboard" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          {isLoggedIn ? (
            // LOGGED IN: Show full interactive dashboard
            <Box>
              <Dashboard
                user={user}
                onOpenHubs={onOpenHubs}
                subscription={subscription}
                onUpgrade={onUpgrade}
                onOpenFlashcards={onOpenFlashcards}
                onOpenTimeline={onOpenTimeline}
                onOpenDoubtLibrary={onOpenDoubtLibrary}
                dueCardCount={dueCardCount}
                pdfCount={pdfCount}
                currentStreak={currentStreak}
                onOpenSettings={onOpenSettings}
              />
            </Box>
          ) : (
            // NOT LOGGED IN: Show preview with sign-in prompts
            <Box>
              <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
                Your Learning Workspace Awaits
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
                sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
              >
                Sign in to access your personalized dashboard with Learning Hubs and interactive tools.
              </Typography>

              {/* Preview: Learning Hubs */}
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  mb: 4,
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 3,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <LoginIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Sign In to Access Learning Hubs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                    Organize your PDFs into Learning Hubs - like NotebookLM, but with AI-powered study tools,
                    voice support, and multilingual capabilities.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={onSignIn}
                    startIcon={<LoginIcon />}
                    sx={{ mt: 2 }}
                  >
                    Sign In with Google
                  </Button>
                </Box>

                <Box sx={{ opacity: 0.3, pointerEvents: 'none' }}>
                  <LibraryIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    My Learning Hubs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Organize your PDFs and study materials
                  </Typography>
                  <Grid container spacing={2}>
                    {['Mathematics', 'Physics', 'Chemistry'].map((subject) => (
                      <Grid item xs={12} sm={4} key={subject}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">{subject}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              3 PDFs • 12 notes
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Paper>

              {/* Preview: Educational Tools */}
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 3,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <ThreeDIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Sign In to Use Interactive Tools
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                    Access Math Lab, Chemistry visualizations, Physics simulations, Code Editor,
                    Globe Viewer, and more - all powered by AI.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={onSignIn}
                    startIcon={<LoginIcon />}
                    sx={{ mt: 2 }}
                  >
                    Sign In to Explore
                  </Button>
                </Box>

                <Box sx={{ opacity: 0.3, pointerEvents: 'none' }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Educational Tools
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Interactive labs and AI-powered learning tools
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { icon: <VyonnIconMui />, label: 'Vyonn AI', color: '#555' },
                      { icon: <MathIcon />, label: 'Math Lab', color: '#1976d2' },
                      { icon: <ChemistryIcon />, label: 'Chemistry', color: '#4caf50' },
                      { icon: <PhysicsIcon />, label: 'Physics', color: '#6c5ce7' },
                      { icon: <CodeIcon />, label: 'Code', color: '#2d3436' },
                      { icon: <GlobeIcon />, label: 'Globe', color: '#0984e3' },
                      { icon: <FlashcardIcon />, label: 'Flashcards', color: '#e91e63' },
                      { icon: <TimelineIcon />, label: 'Journey', color: '#ff9800' },
                    ].map((tool) => (
                      <Grid item xs={6} sm={3} key={tool.label}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Box sx={{ color: tool.color, mb: 1 }}>
                            {React.cloneElement(tool.icon, { fontSize: 'large' })}
                          </Box>
                          <Typography variant="body2" fontWeight={600}>
                            {tool.label}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Paper>
            </Box>
          )}
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
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

          <Grid container spacing={4}>
            {[
              {
                icon: <MicIcon sx={{ fontSize: 50 }} />,
                title: 'Voice-Powered Learning',
                description:
                  'Speak your questions naturally. Ekamanam listens, understands, and responds in your language.',
                color: 'primary',
              },
              {
                icon: <LanguageIcon sx={{ fontSize: 50 }} />,
                title: 'Multilingual Support',
                description:
                  'Learn in Telugu, Hindi, Tamil, or any language you prefer. AI explanations adapt to your chosen language.',
                color: 'success',
              },
              {
                icon: <ThreeDIcon sx={{ fontSize: 50 }} />,
                title: '3D Visualizations',
                description:
                  'Explore molecules, geometric shapes, and concepts in interactive 3D. Rotate, zoom, and understand.',
                color: 'secondary',
              },
              {
                icon: <VyonnIconMui sx={{ fontSize: 50 }} />,
                title: 'Vyonn AI Assistant',
                description:
                  'Your personal AI tutor that understands context, suggests the right tools, and guides your learning journey.',
                color: 'info',
              },
              {
                icon: <FlashcardIcon sx={{ fontSize: 50 }} />,
                title: 'Spaced Repetition',
                description:
                  'Smart flashcards that adapt to your learning pace. Review at optimal intervals for maximum retention.',
                color: 'error',
              },
              {
                icon: <CheckIcon sx={{ fontSize: 50 }} />,
                title: 'Progress Tracking',
                description:
                  'Monitor your learning journey with detailed analytics, streaks, and personalized insights.',
                color: 'warning',
              },
            ].map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <Box sx={{ color: `${feature.color}.main`, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
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
      <Box sx={{ py: 6, bgcolor: 'grey.900', color: 'grey.400' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* Column 1: About */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                Ekamanam
              </Typography>
              <Typography variant="body2">
                AI-Powered Multilingual Learning Platform
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'grey.500' }}>
                ఏకమనం - One Focus, Limitless Learning
              </Typography>
            </Grid>

            {/* Column 2: AI Features */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                AI Features
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, '& li': { mb: 1 } }}>
                <li><Typography variant="body2">Learn & Explain Tabs</Typography></li>
                <li><Typography variant="body2">Activities & Exam Tabs</Typography></li>
                <li><Typography variant="body2">Vyonn AI (Integrated)</Typography></li>
                <li><Typography variant="body2">Interactive Tools</Typography></li>
                <li><Typography variant="body2">Notes & Flashcards</Typography></li>
              </Box>
            </Grid>

            {/* Column 3: Resources */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                Resources
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, '& li': { mb: 1 } }}>
                <li>
                  <Typography
                    variant="body2"
                    component="a"
                    href="#story"
                    sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
                  >
                    Our Story
                  </Typography>
                </li>
                <li>
                  <Typography
                    variant="body2"
                    component="a"
                    href="#features"
                    sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
                  >
                    Features
                  </Typography>
                </li>
                <li>
                  <Typography
                    variant="body2"
                    component="a"
                    href="#dashboard"
                    sx={{ color: 'grey.400', textDecoration: 'none', '&:hover': { color: 'white' } }}
                  >
                    Learning Hub
                  </Typography>
                </li>
                {isLoggedIn && (
                  <li>
                    <Typography
                      variant="body2"
                      component="button"
                      onClick={onOpenHubs}
                      sx={{
                        color: 'grey.400',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        p: 0,
                        textAlign: 'left',
                        '&:hover': { color: 'white' },
                      }}
                    >
                      Launch App
                    </Typography>
                  </li>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Bottom Section */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'grey.800', pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              © 2025{' '}
              <Typography
                component="a"
                href="https://www.linkedin.com/in/amantalwar/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: 'grey.400',
                  textDecoration: 'underline',
                  '&:hover': { color: 'white' },
                }}
              >
                Amandeep Singh Talwar
              </Typography>
              . All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.500' }}>
              Disclaimer: This application provides AI-powered learning assistance. All PDF copyrights belong to
              their respective owners. For personal educational use only.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingDashboard;

