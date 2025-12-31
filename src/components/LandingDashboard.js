import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Login as LoginIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
  Mic as MicIcon,
  Language as LanguageIcon,
  ThreeDRotation as ThreeDIcon,
  PhoneAndroid as PhoneIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Book as BookIcon,
  Science as ScienceIcon,
  Calculate as CalculateIcon,
  Code as CodeIcon,
  Public as PublicIcon,
  Extension as ExtensionIcon,
} from '@mui/icons-material';
import Dashboard from './Dashboard';

function LandingDashboard({ isLoggedIn, user, onSignIn, onOpenHubs, subscription, onUpgrade }) {
  const greeting = isLoggedIn && user
    ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user.displayName?.split(' ')[0] || 'there'}!`
    : 'Welcome to Ekamanam';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3.5rem' } }}>
            See. Hear. Speak. Learn.
          </Typography>
          <Typography variant="h4" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Your Voice-Powered AI Tutor
          </Typography>
          
          <Typography variant="h6" sx={{ mb: 4, mt: 2, opacity: 0.95, maxWidth: 800, mx: 'auto' }}>
            Your smart companion that sees, hears, and speaks with you - featuring voice input, 
            interactive visualizations, and multilingual AI that responds in your language.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
              href="#story"
            >
              Read Our Story
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
              href="#quick-start"
            >
              Get Started
            </Button>
          </Box>

          {/* Key Stats */}
          <Grid container spacing={2} sx={{ mt: 6, maxWidth: 900, mx: 'auto' }}>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">🎤</Typography>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Voice Input</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">10+</Typography>
                <Typography variant="body2" color="text.secondary">Languages</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main">50+</Typography>
                <Typography variant="body2" color="text.secondary">Interactive Tools</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">3D</Typography>
                <Typography variant="body2" color="text.secondary">Visualizations</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4">📱</Typography>
                <Typography variant="body2" fontWeight={600} color="text.secondary">Mobile Ready</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* The Learning Challenge Section */}
      <Box
        id="story"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'white',
        }}
      >
        <Container maxWidth="md">
          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 4 }, 
              mb: 4,
              borderLeft: '4px solid',
              borderColor: 'warning.main',
              bgcolor: 'transparent',
            }}
          >
            <Typography variant="h5" fontWeight={700} gutterBottom>
              The Learning Challenge
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.8 }}>
              "Papa, I can read the words, but I don't really <em>understand</em> it.
              Can you show me what a cube actually looks like? Where is Hyderabad on a map?
              Can I hear this in my language? I want to <em>see</em> it, not just read about it..."
            </Typography>
          </Paper>

          <Box sx={{ '& p': { mb: 2, lineHeight: 1.8 }, '& ul': { pl: 3, mb: 2 } }}>
            <Typography variant="body1" color="text.secondary">
              Students today face a unique challenge: textbooks are flat, static, and often in a language they're still mastering. 
              Reading about geometric shapes doesn't help them visualize. Reading about historical locations doesn't show them where they are. 
              Reading scientific formulas doesn't make concepts come alive.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The struggle isn't ability; it's <strong>engagement</strong>. Learning needs to:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary={<Typography variant="body1" color="text.secondary"><strong>Speak their language</strong> — Not just English, but Telugu, Hindi, Tamil, and more</Typography>} />
              </ListItem>
              <ListItem>
                <ListItemText primary={<Typography variant="body1" color="text.secondary"><strong>Show, not just tell</strong> — 3D models you can rotate, molecules you can explore, maps you can interact with</Typography>} />
              </ListItem>
              <ListItem>
                <ListItemText primary={<Typography variant="body1" color="text.secondary"><strong>Sound natural</strong> — Voice explanations that help auditory learners and those practicing pronunciation</Typography>} />
              </ListItem>
              <ListItem>
                <ListItemText primary={<Typography variant="body1" color="text.secondary"><strong>Respond instantly</strong> — An AI that's always ready to explain one more time, never judges, always patient</Typography>} />
              </ListItem>
              <ListItem>
                <ListItemText primary={<Typography variant="body1" color="text.secondary"><strong>Make connections</strong> — From textbook concepts to real-world understanding</Typography>} />
              </ListItem>
            </List>
            <Typography variant="body1" color="text.secondary">
              That's why we created <strong>Ekamanam</strong> (ఏకమనం - "One Mind"). We asked: 
              <em> Could we build an AI learning platform that engages all the senses - visual, audio, and interactive?</em>
            </Typography>
            <Typography variant="h6" fontWeight={600} color="primary" sx={{ mt: 2 }}>
              The answer was yes. And here's what we built.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Why Ekamanam Section */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'grey.50',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Why Ekamanam?
          </Typography>

          <Paper elevation={1} sx={{ p: { xs: 3, md: 5 }, mt: 4 }}>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              We all have that stack of textbooks, PDFs, and study materials we swear we're going to master.
              But let's be honest—<strong>staring at static pages doesn't equal learning</strong>.
              It's overwhelming, and retention is a struggle.
            </Typography>

            <Typography variant="h6" fontWeight={600} color="primary" sx={{ my: 2 }}>
              That's where Ekamanam comes in.
            </Typography>

            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              Ekamanam isn't just a document reader; it's a <strong>complete learning workspace</strong>.
              Upload any PDF, and Ekamanam transforms it.
            </Typography>

            <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.50', borderRadius: 2, mb: 2 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                <strong>Don't just read—apply.</strong> Jump into our <strong>Labs</strong> (Math, Chemistry, Physics, Code, Globe) 
                to practice concepts hands-on. Use our suite of smart <strong>Tools</strong> to break down complex topics instantly. 
                With <strong>voice input</strong>, <strong>multilingual AI</strong>, and <strong>interactive visualizations</strong>, 
                you go from <em>passive reading to active mastering</em> in one seamless flow.
              </Typography>
            </Paper>

            <Box sx={{ textAlign: 'center', my: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" fontWeight={600}>
                Stop just consuming information.
              </Typography>
              <Typography variant="h6" fontWeight={600} color="primary">
                Start building skills.
              </Typography>
            </Box>

            <Typography variant="body1" textAlign="center" color="text.secondary">
              Whether you're a student tackling tough subjects or preparing for exams, 
              <strong> find your focus with Ekamanam's Labs and Tools</strong>.
            </Typography>
          </Paper>
        </Container>
      </Box>

      {/* Quick Start Guide */}
      <Box
        id="quick-start"
        sx={{
          py: { xs: 6, md: 10 },
          bgcolor: 'primary.50',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom sx={{ mb: 6 }}>
            Quick Start Guide
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    1
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Setup (2 minutes)
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>NEW: Getting Started Tour!</strong> Click the button for guided setup</Typography>} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>Add API Keys:</strong> Settings → AI Providers (Gemini required)</Typography>} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>Profile:</strong> Add your name and parent email for Admin access</Typography>} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    2
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Load PDFs
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>Try Samples:</strong> My Library → Samples tab</Typography>} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>Upload:</strong> Add your textbooks, notes, PDFs</Typography>} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>Open:</strong> PDF left, AI features right</Typography>} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  >
                    3
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Start Learning
                  </Typography>
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>AI Tabs:</strong> Learn, Explain, Activities, Exam, Tools, Vyonn</Typography>} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>Ask Vyonn:</strong> Click Vyonn tab for AI chat</Typography>} />
                    </ListItem>
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2"><strong>That's it!</strong> AI does the rest</Typography>} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Dashboard Section - Interactive Tools */}
      {isLoggedIn && (
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
          <Container maxWidth="lg">
            <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom sx={{ mb: 1 }}>
              {greeting}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              Your learning workspace
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={onOpenHubs}
                endIcon={<ArrowIcon />}
                sx={{
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  boxShadow: 3,
                }}
              >
                Open Learning Hub
              </Button>
            </Box>

            <Dashboard
              onOpenHubs={onOpenHubs}
              user={user}
              subscription={subscription}
              onUpgrade={onUpgrade}
            />
          </Container>
        </Box>
      )}

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
              : 'Experience learning that engages all your senses. Start free today!'}
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

      {/* Professional Footer */}
      <Box
        component="footer"
        sx={{
          py: 6,
          bgcolor: 'grey.900',
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Ekamanam Info */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Ekamanam
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8, lineHeight: 1.7 }}>
                AI-Powered Multilingual Learning Platform. Transform your learning with voice input, 
                interactive visualizations, and smart AI that speaks your language.
              </Typography>
            </Grid>

            {/* AI Features */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                AI Features
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Learn & Explain Tabs</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Activities & Exam Tabs</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Vyonn AI (Integrated Tab)</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Interactive Tools Tab</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Notes & Flashcards</Typography></li>
              </Box>
            </Grid>

            {/* Resources */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Resources
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Quick Start Guide</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Educational Tools</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Vyonn AI</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Math Lab</Typography></li>
                <li><Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>• Chemistry & Physics Labs</Typography></li>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', mt: 4, pt: 4 }}>
            <Typography variant="body2" textAlign="center" sx={{ opacity: 0.7, mb: 1 }}>
              © 2025{' '}
              <a 
                href="https://www.linkedin.com/in/amantalwar/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                Amandeep Singh Talwar
              </a>
              . All rights reserved.
            </Typography>
            <Typography variant="caption" textAlign="center" display="block" sx={{ opacity: 0.6 }}>
              Disclaimer: This application provides AI-powered learning assistance. All PDF copyrights belong to their respective owners. For personal educational use only.
            </Typography>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}

export default LandingDashboard;
