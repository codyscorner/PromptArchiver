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
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { FolderOpen as FolderOpenIcon, Settings as SettingsIcon, Help as HelpIcon } from '@mui/icons-material';

const SettingsDialog = ({ open, onClose, archivePath, onArchivePathChange }) => {
  const [tempPath, setTempPath] = useState(archivePath || '');
  const [tabValue, setTabValue] = useState(0);

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
    setTabValue(0);
    onClose();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && children}
    </div>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab icon={<SettingsIcon />} label="Settings" />
          <Tab icon={<HelpIcon />} label="Help" />
        </Tabs>
      </DialogTitle>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Typography variant="h4" gutterBottom>
                Prompt Archiver Help
              </Typography>
              
              <Typography variant="body1" paragraph>
                A desktop application for storing, organizing, and viewing AI prompts alongside their generated outputs (text, images, or videos).
              </Typography>

              <Typography variant="h5" gutterBottom>
                Adding Prompts
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                1. Click the "+" button to open the Add Prompt dialog<br/>
                2. Enter your prompt text<br/>
                3. Select the content type (text, image, or video)<br/>
                4. Add tags for organization (optional)<br/>
                5. Attach output files (optional)<br/>
                6. Click "Save Prompt"
              </Typography>

              <Typography variant="h5" gutterBottom>
                Browsing Prompts
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                • Use the sidebar to browse all saved prompts<br/>
                • Filter by type using the dropdown<br/>
                • Search by prompt content or tags<br/>
                • Click on any prompt to view its details
              </Typography>

              <Typography variant="h5" gutterBottom>
                Viewing Content
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                • Text outputs are displayed in a formatted text viewer<br/>
                • Images are shown with zoom and fit capabilities<br/>
                • Videos can be played directly in the application
              </Typography>

              <Typography variant="h5" gutterBottom>
                Exporting
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                1. Select prompts using the checkboxes in the sidebar<br/>
                2. Click "Export Selected" to create a ZIP backup<br/>
                3. Choose the export location
              </Typography>

              <Typography variant="h5" gutterBottom>
                Settings
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                • Click the settings icon to configure the archive location<br/>
                • The default location is ~/Prompt_Archive
              </Typography>
            </Box>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {tabValue === 0 ? 'Cancel' : 'Close'}
        </Button>
        {tabValue === 0 && (
          <Button onClick={handleSave} variant="contained">
            Save Settings
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;