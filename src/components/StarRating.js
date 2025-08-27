import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

const StarRating = ({ rating = 0, onRatingChange, readonly = false, size = 'medium' }) => {
  const handleStarClick = (newRating) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <IconButton
          key={star}
          onClick={() => handleStarClick(star)}
          disabled={readonly}
          size="small"
          sx={{
            padding: 0.5,
            color: star <= rating ? '#ffd700' : '#e0e0e0',
            '&:hover': {
              color: readonly ? undefined : '#ffd700',
            },
          }}
        >
          {star <= rating ? (
            <Star sx={{ fontSize: iconSize }} />
          ) : (
            <StarBorder sx={{ fontSize: iconSize }} />
          )}
        </IconButton>
      ))}
    </Box>
  );
};

export default StarRating;