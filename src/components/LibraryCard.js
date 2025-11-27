import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Box,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Info as InfoIcon,
  MenuBook as BookIcon
} from '@mui/icons-material';

/**
 * LibraryCard - Display a single PDF in the library
 * 
 * Props:
 * - item: Library item object
 * - onOpen: Function to open the PDF
 * - onRemove: Function to remove the PDF
 * - onInfo: Function to show PDF info (optional)
 */
const LibraryCard = ({ item, onOpen, onRemove, onInfo }) => {
  const {
    name,
    thumbnailUrl,
    totalPages,
    lastPage,
    progress,
    subject,
    workspace,
    size,
    lastOpened,
    notes
  } = item;

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format relative time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Progress color
  const getProgressColor = () => {
    if (progress >= 100) return 'success';
    if (progress >= 50) return 'primary';
    if (progress > 0) return 'warning';
    return 'inherit';
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      {/* Thumbnail */}
      <CardMedia
        sx={{
          height: 200,
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <BookIcon sx={{ fontSize: 80, color: 'grey.400' }} />
        )}
        
        {/* Progress badge */}
        {progress > 0 && (
          <Chip
            label={`${progress}%`}
            size="small"
            color={getProgressColor()}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 600
            }}
          />
        )}
      </CardMedia>

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Title */}
        <Tooltip title={name} arrow>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '48px'
            }}
          >
            {name}
          </Typography>
        </Tooltip>

        {/* Metadata chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          <Chip 
            label={subject} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          {workspace && workspace !== 'My Files' && (
            <Chip 
              label={workspace} 
              size="small" 
              variant="outlined"
            />
          )}
        </Box>

        {/* Stats */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          📄 {totalPages > 0 ? `${totalPages} pages` : 'Processing...'}
        </Typography>
        
        {totalPages > 0 && lastPage > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            📍 Page {lastPage} of {totalPages}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          💾 {formatSize(size)}
        </Typography>

        {notes > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            📝 {notes} note{notes > 1 ? 's' : ''}
          </Typography>
        )}

        {/* Progress bar */}
        {progress > 0 && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              color={getProgressColor()}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        )}

        {/* Last opened */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}
        >
          ⏱️ {formatTime(lastOpened)}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="small"
          onClick={() => onOpen(item)}
          fullWidth
          sx={{ mr: 1 }}
        >
          Open
        </Button>
        
        <Box>
          {onInfo && (
            <Tooltip title="Info">
              <IconButton 
                size="small" 
                onClick={() => onInfo(item)}
                sx={{ mr: 0.5 }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Remove">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => onRemove(item)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

export default LibraryCard;

