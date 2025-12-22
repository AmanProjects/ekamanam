import React, { useState } from 'react';
import VoiceInputButton from '../VoiceInputButton';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Badge,
  Tabs,
  Tab,
  InputAdornment,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Place as PlaceIcon,
  Search as SearchIcon,
  Public as GlobeIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { callLLM } from '../../services/llmService';

/**
 * GlobeViewer - Interactive world map for geography learning
 * Features: World map, location markers, country info
 * Uses embedded OpenStreetMap for simplicity
 */

// Vyonn Globe Icon component
function VyonnGlobeIcon({ size = 40 }) {
  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      badgeContent={
        <Box
          sx={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0984e3 0%, #0652dd 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(9,132,227,0.4)'
          }}
        >
          <GlobeIcon sx={{ fontSize: size * 0.3, color: 'white' }} />
        </Box>
      }
    >
      <Box
        sx={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src="/vyonn.png"
          alt="Vyonn"
          sx={{
            width: size * 0.85,
            height: size * 0.85,
            filter: 'brightness(0) invert(1) brightness(1.8)',
            objectFit: 'contain'
          }}
        />
      </Box>
    </Badge>
  );
}

// AI Chat Component for Geography
function GlobeAIChat({ user, onViewLocation }) {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const userName = user?.displayName?.split(' ')[0] || 'You';
  const userPhoto = user?.photoURL;

  const SUGGESTED_QUESTIONS = [
    "Tell me about the Amazon rainforest",
    "What causes earthquakes?",
    "Explain climate zones",
    "Where is Mount Everest?"
  ];

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    const userQuestion = question;
    setQuestion('');
    setChatHistory(prev => [{ role: 'user', content: userQuestion }, ...prev]);
    
    try {
      // v10.3: Detect language and respond in same language
      const hasDevanagari = /[\u0900-\u097F]/.test(userQuestion);
      const hasTelugu = /[\u0C00-\u0C7F]/.test(userQuestion);
      const hasTamil = /[\u0B80-\u0BFF]/.test(userQuestion);
      const hasKannada = /[\u0C80-\u0CFF]/.test(userQuestion);
      const hasMalayalam = /[\u0D00-\u0D7F]/.test(userQuestion);
      
      const isRegional = hasDevanagari || hasTelugu || hasTamil || hasKannada || hasMalayalam;
      const lang = hasTelugu ? 'Telugu (తెలుగు)' : 
                   hasDevanagari ? 'Hindi (हिंदी)' :
                   hasTamil ? 'Tamil (தமிழ்)' :
                   hasKannada ? 'Kannada (ಕನ್ನಡ)' :
                   hasMalayalam ? 'Malayalam (മലയാളം)' : 'English';
      
      const prompt = `You are Vyonn Globe, a brilliant and friendly geography tutor.

${isRegional ? `🚨 IMPORTANT: Student asked in ${lang}. You MUST respond in ${lang}!` : ''}

Student asked: "${userQuestion}"

Provide a clear, educational response that:
1. Explains the geography concept clearly ${isRegional ? `(in ${lang})` : ''}
2. Includes interesting facts and context ${isRegional ? `(in ${lang})` : ''}
3. Relates to real-world locations when relevant
4. Is encouraging and supportive ${isRegional ? `(in ${lang})` : ''}
5. Suggests related topics to explore ${isRegional ? `(in ${lang})` : ''}

When mentioning specific geographic locations (cities, landmarks, countries, natural features), format them as:
[[LocationName|latitude|longitude]]

For example:
- "[[Mount Everest|27.9881|86.9250]] is the highest peak..."
- "Visit [[Paris|48.8566|2.3522]] to see the Eiffel Tower"
- "The [[Amazon Rainforest|-3.4653|-62.2159]] spans multiple countries"

${isRegional ? `Write your ENTIRE response in ${lang} using proper Unicode! Location names can be in original language.` : 'You can include multiple locations in your response. Be warm and engaging!'}`;

      const response = await callLLM(prompt, { feature: 'general', temperature: 0.7, maxTokens: 2048 });  // V3.2: Doubled for detailed geography explanations
      
      // Parse all location links
      const locations = [];
      const locationRegex = /\[\[([^\|]+)\|([-\d.]+)\|([-\d.]+)\]\]/g;
      let match;
      
      while ((match = locationRegex.exec(response)) !== null) {
        locations.push({
          name: match[1].trim(),
          lat: parseFloat(match[2]),
          lng: parseFloat(match[3]),
          placeholder: match[0]
        });
      }
      
      setChatHistory(prev => [{ role: 'assistant', content: response, locations }, ...prev]);
    } catch (error) {
      console.error('AI error:', error);
      setChatHistory(prev => [{ role: 'assistant', content: 'Sorry, I encountered an error. Please try again!' }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Input Section - At Top */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Ask me anything about geography..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAsk())}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <VoiceInputButton
                  onTranscript={setQuestion}
                  existingText={question}
                  disabled={loading}
                  size="small"
                />
                <IconButton onClick={handleAsk} disabled={loading || !question.trim()} color="primary">
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <Chip key={i} label={q} size="small" onClick={() => setQuestion(q)} sx={{ cursor: 'pointer', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' }, fontSize: '0.75rem' }} />
          ))}
        </Box>
      </Paper>

      {/* Chat History */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
        {chatHistory.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
            <VyonnGlobeIcon size={64} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>Hi! I'm Vyonn Globe</Typography>
            <Typography variant="body2" color="text.secondary">Ask me about countries, cities, climate, landmarks, and more!</Typography>
          </Box>
        ) : (
          chatHistory.map((msg, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {msg.role === 'user' ? (
                  <>
                    <Avatar src={userPhoto} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{userName[0]}</Avatar>
                    <Typography variant="caption" fontWeight={700} color="primary.main">{userName}</Typography>
                  </>
                ) : (
                  <>
                    <VyonnGlobeIcon size={24} />
                    <Typography variant="caption" fontWeight={700} color="text.secondary">Vyonn Globe</Typography>
                  </>
                )}
              </Box>
              <Paper elevation={0} sx={{ p: 1.5, ml: 4, bgcolor: msg.role === 'user' ? '#e3f2fd' : 'white', border: '1px solid', borderColor: msg.role === 'user' ? 'primary.light' : 'divider', borderRadius: 2 }}>
                {msg.role === 'assistant' && msg.locations && msg.locations.length > 0 ? (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content.split(/(\[\[[^\]]+\]\])/).map((part, idx) => {
                      // Check if this part is a location placeholder
                      const location = msg.locations.find(loc => loc.placeholder === part);
                      if (location) {
                        return (
                          <Typography
                            key={idx}
                            component="span"
                            onClick={() => onViewLocation({ name: location.name, lat: location.lat, lng: location.lng })}
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontWeight: 600,
                              '&:hover': {
                                color: 'primary.dark',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {location.name}
                          </Typography>
                        );
                      }
                      return part;
                    })}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                )}
              </Paper>
            </Box>
          ))
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VyonnGlobeIcon size={24} />
            <Paper elevation={0} sx={{ p: 1.5, ml: 4, bgcolor: 'white', border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" component="span" sx={{ ml: 1 }}>Thinking...</Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function GlobeViewer({ open, onClose, user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20, lng: 0 });
  const [zoom, setZoom] = useState(2);

  // Important locations for education
  const educationalLocations = [
    { name: 'Great Wall of China', lat: 40.4319, lng: 116.5704, info: 'Ancient fortification, 13,171 miles long' },
    { name: 'Pyramids of Giza', lat: 29.9792, lng: 31.1342, info: 'Ancient Egyptian monuments, built ~2560 BCE' },
    { name: 'Machu Picchu', lat: -13.1631, lng: -72.5450, info: '15th-century Incan citadel in Peru' },
    { name: 'Taj Mahal', lat: 27.1751, lng: 78.0421, info: 'Mughal mausoleum, built 1632-1653' },
    { name: 'Colosseum', lat: 41.8902, lng: 12.4922, info: 'Ancient Roman amphitheater, built 70-80 CE' },
  ];

  // Indian cities for local context
  const indianCities = [
    { name: 'New Delhi', lat: 28.6139, lng: 77.2090, info: 'Capital of India' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, info: 'Financial capital of India' },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639, info: 'Cultural capital of India' },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, info: 'Gateway to South India' },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, info: 'Silicon Valley of India' },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, info: 'City of Pearls' },
  ];

  // Focus on location
  const focusLocation = (location) => {
    setSelectedLocation(location);
    setMapCenter({ lat: location.lat, lng: location.lng });
    setZoom(10);
  };

  // Search location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const newLocation = {
          name: result.display_name.split(',')[0],
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          info: result.display_name
        };
        focusLocation(newLocation);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Generate OpenStreetMap embed URL
  const getMapUrl = () => {
    const bbox = `${mapCenter.lng - 180/zoom},${mapCenter.lat - 90/zoom},${mapCenter.lng + 180/zoom},${mapCenter.lat + 90/zoom}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0984e3 0%, #0652dd 100%)',
        color: 'white',
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VyonnGlobeIcon size={36} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Vyonn Globe Explorer</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>Explore World Geography · Landmarks · Cities</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 600, minWidth: 'auto', px: 2 } }}>
          <Tab icon={<Box sx={{ display: 'flex', alignItems: 'center' }}><VyonnGlobeIcon size={18} /></Box>} label="Ask Vyonn AI" iconPosition="start" />
          <Tab icon={<GlobeIcon sx={{ fontSize: 18 }} />} label="Globe Explorer" iconPosition="start" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 0 && <GlobeAIChat user={user} onViewLocation={(location) => {
          setSelectedLocation(location);
          setMapCenter({ lat: location.lat, lng: location.lng });
          setZoom(10);
          setActiveTab(1);
        }} />}
        {activeTab === 1 && (
        <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Sidebar */}
        <Box sx={{ 
          width: 280, 
          borderRight: '1px solid #ddd', 
          p: 2,
          overflow: 'auto',
          bgcolor: '#f8f9fa'
        }}>
          {/* Search */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <IconButton onClick={handleSearch} color="primary">
              <SearchIcon />
            </IconButton>
          </Box>

          {/* Quick locations */}
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            🏛️ World Wonders
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {educationalLocations.map((loc) => (
              <Chip
                key={loc.name}
                label={loc.name}
                size="small"
                onClick={() => focusLocation(loc)}
                sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
              />
            ))}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            🇮🇳 Indian Cities
          </Typography>
          <List dense sx={{ bgcolor: 'white', borderRadius: 1 }}>
            {indianCities.map((city) => (
              <ListItem 
                button 
                key={city.name}
                onClick={() => focusLocation(city)}
                selected={selectedLocation?.name === city.name}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PlaceIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary={city.name}
                  secondary={city.info}
                  primaryTypographyProps={{ fontSize: '0.85rem' }}
                  secondaryTypographyProps={{ fontSize: '0.7rem' }}
                />
              </ListItem>
            ))}
          </List>

          {/* Selected location info */}
          {selectedLocation && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: '#e3f2fd' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                📍 {selectedLocation.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedLocation.info}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Lat: {selectedLocation.lat.toFixed(4)}°, Lng: {selectedLocation.lng.toFixed(4)}°
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Map */}
        <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
          <iframe
            title="World Map"
            src={getMapUrl()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
          <Alert 
            severity="info" 
            sx={{ 
              position: 'absolute', 
              bottom: 10, 
              left: 10, 
              right: 10,
              opacity: 0.9
            }}
          >
            💡 Click locations on the sidebar to explore • Use search for any place worldwide
          </Alert>
        </Box>
        </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default GlobeViewer;
