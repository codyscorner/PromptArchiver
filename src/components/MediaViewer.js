import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';

const MediaViewer = ({ fileName, filePath, type }) => {
  const [content, setContent] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFile();
  }, [filePath]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await window.electronAPI.readFile(filePath);
      
      if (result.success) {
        console.log('File loaded:', fileName, 'Data type:', typeof result.data, 'Length:', result.data.length);
        setContent(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExtensions.includes(getFileExtension(filename));
  };

  const getMimeType = (filename) => {
    const extension = getFileExtension(filename);
    const mimeTypes = {
      'jpg': 'jpeg',
      'jpeg': 'jpeg',
      'png': 'png',
      'gif': 'gif',
      'bmp': 'bmp',
      'webp': 'webp',
      'svg': 'svg+xml'
    };
    return mimeTypes[extension] || extension;
  };

  const isVideoFile = (filename) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    return videoExtensions.includes(getFileExtension(filename));
  };

  const isTextFile = (filename) => {
    const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
    return textExtensions.includes(getFileExtension(filename));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading file: {error}
      </Alert>
    );
  }

  if (!content) {
    return (
      <Alert severity="info">
        No content available
      </Alert>
    );
  }

  // Handle different file types
  if (isImageFile(fileName)) {
    if (!content) {
      return (
        <Alert severity="info">
          No image content available
        </Alert>
      );
    }
    
    // Content is now a base64 string from backend
    const mimeType = getMimeType(fileName);
    const imageUrl = `data:image/${mimeType};base64,${content}`;
    
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {fileName}
        </Typography>
        <img
          src={imageUrl}
          alt={fileName}
          style={{
            maxWidth: '100%',
            height: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            display: 'block',
            margin: '0 auto'
          }}
          onError={(e) => {
            console.error('Image failed to load:', fileName, e);
            console.log('Base64 length:', content.length);
          }}
        />
      </Box>
    );
  }

  if (isVideoFile(fileName)) {
    // Content is now a base64 string from backend
    const videoUrl = `data:video/${getFileExtension(fileName)};base64,${content}`;
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {fileName}
        </Typography>
        <video
          controls
          style={{
            maxWidth: '100%',
            height: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            display: 'block',
            margin: '0 auto'
          }}
        >
          <source src={videoUrl} type={`video/${getFileExtension(fileName)}`} />
          Your browser does not support the video tag.
        </video>
      </Box>
    );
  }

  if (isTextFile(fileName) || type === 'text') {
    // Content is already a UTF-8 string from backend for text files
    const textContent = content;
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {fileName}
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: '#f8f9fa'
          }}
        >
          <Typography
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0
            }}
          >
            {textContent}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Fallback for unknown file types
  return (
    <Box sx={{ textAlign: 'center', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {fileName}
      </Typography>
      <Alert severity="warning">
        File type not supported for preview. File size: {content.length} bytes
      </Alert>
    </Box>
  );
};

export default MediaViewer;