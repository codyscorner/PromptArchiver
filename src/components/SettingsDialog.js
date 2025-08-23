import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import { FolderOpen as FolderOpenIcon } from '@mui/icons-material';

const SettingsDialog = ({ open, onClose, archivePath, onArchivePathChange }) => {
  const [tempPath, setTempPath] = useState(archivePath || '');

  useEffect(() => {
    setTempPath(archivePath || '');
  }, [archivePath]);

  const handleSelectPath = async () => {
    try {
      const newPath = await window.electronAPI.setArchivePath();
      if (newPath) {
        setTempPath(newPath);
      }
    } catch (error) {
      console.error('Error selecting archive path:', error);
    }
  };

  const handleSave = () => {
    if (tempPath !== archivePath) {
      onArchivePathChange(tempPath);
    }
    onClose();
  };

  const handleClose = () => {
    setTempPath(archivePath || '');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Archive Location
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose where your prompts and outputs will be stored. The app will create
              a "Prompt_Archive" folder at this location with subfolders for each content type.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Archive Path"
                value={tempPath}
                onChange={(e) => setTempPath(e.target.value)}
                helperText={tempPath ? `Current: ${tempPath}` : "No archive folder selected - choose a location to get started"}
                placeholder="Select a folder for your archive..."
              />
              <IconButton 
                onClick={handleSelectPath}
                sx={{ mt: 1 }}
                title="Browse for folder"
              >
                <FolderOpenIcon />
              </IconButton>
            </Box>
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Note:</strong> Changing the archive path will not move existing prompts. 
              You'll need to manually copy them to the new location if desired.
            </Typography>
          </Alert>

          <Box>
            <Typography variant="h6" gutterBottom>
              Folder Structure
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The app automatically organizes your prompts in the following structure:
            </Typography>
            <Box component="pre" sx={{ 
              mt: 1, 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1,
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}>
{`Prompt_Archive/
├── text/
│   ├── prompt_2024-01-01T10-00-00/
│   │   ├── prompt.txt
│   │   ├── metadata.json
│   │   └── output.txt
├── image/
│   ├── prompt_2024-01-01T11-00-00/
│   │   ├── prompt.txt
│   │   ├── metadata.json
│   │   └── generated_image.png
└── video/
    ├── prompt_2024-01-01T12-00-00/
    │   ├── prompt.txt
    │   ├── metadata.json
    │   └── generated_video.mp4`}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;