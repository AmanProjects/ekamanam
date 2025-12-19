import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Place as PlaceIcon,
  Search as SearchIcon,
  Public as GlobeIcon
} from '@mui/icons-material';

/**
 * GlobeViewer - Interactive world map for geography learning
 * Features: World map, location markers, country info
 * Uses embedded OpenStreetMap for simplicity
 */
function GlobeViewer({ open, onClose }) {
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
        bgcolor: '#0984e3',
        color: 'white',
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GlobeIcon />
          <Typography variant="h6">🌍 World Explorer</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex' }}>
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
      </DialogContent>
    </Dialog>
  );
}

export default GlobeViewer;
