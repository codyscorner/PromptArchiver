import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import { MoreVert as MoreVertIcon, Edit as EditIcon, EditNote as EditNoteIcon, Delete as DeleteIcon } from '@mui/icons-material';
import MediaViewer from './MediaViewer';
import EditPromptDialog from './EditPromptDialog';

const ContentArea = ({ selectedPrompt, archivePath, onPromptUpdated, showSnackbar }) => {
  const [tabValue, setTabValue] = useState(0);
  const [outputContent, setOutputContent] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [changeTypeOpen, setChangeTypeOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setTabValue(0);
    setOutputContent(null);
    setMenuAnchor(null);
    setChangeTypeOpen(false);
    setNewType('');
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
  }, [selectedPrompt]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleChangeTypeClick = () => {
    setNewType(selectedPrompt.type);
    setChangeTypeOpen(true);
    setMenuAnchor(null);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleEditSave = async (promptData) => {
    try {
      const result = await window.electronAPI.updatePrompt({
        promptPath: selectedPrompt.path,
        promptData
      });

      if (result.success) {
        showSnackbar(result.message, 'success');
        onPromptUpdated(); // Refresh the prompt list
        setEditDialogOpen(false);
      } else {
        showSnackbar('Error updating prompt: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Error updating prompt: ' + error.message, 'error');
    }
  };

  const handleChangeTypeConfirm = async () => {
    if (!newType || newType === selectedPrompt.type) {
      setChangeTypeOpen(false);
      return;
    }

    try {
      const result = await window.electronAPI.changePromptType({
        promptPath: selectedPrompt.path,
        newType,
        archivePath
      });

      if (result.success) {
        showSnackbar(result.message, 'success');
        onPromptUpdated(); // Refresh the prompt list
      } else {
        showSnackbar('Error changing prompt type: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Error changing prompt type: ' + error.message, 'error');
    }

    setChangeTypeOpen(false);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await window.electronAPI.deletePrompt(selectedPrompt.path);

      if (result.success) {
        showSnackbar(result.message, 'success');
        onPromptUpdated(); // Refresh the prompt list
        setDeleteDialogOpen(false);
      } else {
        showSnackbar('Error deleting prompt: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Error deleting prompt: ' + error.message, 'error');
    }

    setDeleteDialogOpen(false);
  };

  if (!selectedPrompt) {
    return (
      <Box className="content-area">
        <Box className="no-selection">
          <Typography variant="h6" color="text.secondary">
            Select a prompt to view details
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="content-area">
      <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
        <Paper sx={{ mb: 2 }}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={selectedPrompt.type}
                  color={
                    selectedPrompt.type === 'text' ? 'primary' :
                    selectedPrompt.type === 'image' ? 'secondary' : 'success'
                  }
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(selectedPrompt.timestamp)}
                </Typography>
              </Box>
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>

            {/* AI Source and Model Information */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                {selectedPrompt.aiSource && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      AI Source:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedPrompt.aiSource}
                    </Typography>
                  </Box>
                )}
                {selectedPrompt.modelName && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Model:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedPrompt.modelName}
                    </Typography>
                  </Box>
                )}
                {selectedPrompt.modelType && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Type:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedPrompt.modelType}
                    </Typography>
                  </Box>
                )}
                {selectedPrompt.baseModel && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Base Model:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedPrompt.baseModel}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Tags:
                </Typography>
                {selectedPrompt.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Prompt
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#f8f9fa'
              }}
            >
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
              >
                {selectedPrompt.prompt}
              </Typography>
            </Paper>

            {/* Negative Prompt */}
            {selectedPrompt.hasNegativePrompt && selectedPrompt.negativePrompt && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Negative Prompt
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: '#fff5f5'
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                  >
                    {selectedPrompt.negativePrompt}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        </Paper>

        {selectedPrompt.outputFiles && selectedPrompt.outputFiles.length > 0 && (
          <Paper>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
            >
              {selectedPrompt.outputFiles.map((file, index) => (
                <Tab key={index} label={file} />
              ))}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {selectedPrompt.outputFiles[tabValue] && (
                <MediaViewer
                  fileName={selectedPrompt.outputFiles[tabValue]}
                  filePath={`${selectedPrompt.path}/${selectedPrompt.outputFiles[tabValue]}`}
                  type={selectedPrompt.type}
                />
              )}
            </Box>
          </Paper>
        )}

        {(!selectedPrompt.outputFiles || selectedPrompt.outputFiles.length === 0) && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No output files available
            </Typography>
          </Paper>
        )}

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditClick}>
            <EditNoteIcon sx={{ mr: 1 }} />
            Edit Prompt
          </MenuItem>
          <MenuItem onClick={handleChangeTypeClick}>
            <EditIcon sx={{ mr: 1 }} />
            Change Type
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Prompt
          </MenuItem>
        </Menu>

        <Dialog open={changeTypeOpen} onClose={() => setChangeTypeOpen(false)}>
          <DialogTitle>Change Prompt Type</DialogTitle>
          <DialogContent>
            <Box sx={{ minWidth: 300, pt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                This will move the prompt and all its files to the new type folder.
              </Alert>
              <FormControl fullWidth>
                <InputLabel>New Type</InputLabel>
                <Select
                  value={newType}
                  label="New Type"
                  onChange={(e) => setNewType(e.target.value)}
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangeTypeOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleChangeTypeConfirm} 
              variant="contained"
              disabled={!newType || newType === selectedPrompt.type}
            >
              Change Type
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Prompt</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone. All files and data for this prompt will be permanently deleted.
            </Alert>
            <Typography>
              Are you sure you want to delete this prompt?
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {selectedPrompt?.type?.toUpperCase()} Prompt
              </Typography>
              <Typography variant="body2" sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {selectedPrompt?.prompt}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteConfirm} 
              variant="contained" 
              color="error"
            >
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>

        <EditPromptDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleEditSave}
          prompt={selectedPrompt}
        />
      </Box>
    </Box>
  );
};

export default ContentArea;