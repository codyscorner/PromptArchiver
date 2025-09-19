import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';

const AddPromptDialog = ({ open, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('text');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [aiSource, setAiSource] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('');
  const [baseModel, setBaseModel] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');

  const handleClose = () => {
    if (!saving) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrompt('');
    setType('text');
    setTags([]);
    setTagInput('');
    setSelectedFiles([]);
    setAiSource('');
    setModelName('');
    setModelType('');
    setBaseModel('');
    setNegativePrompt('');
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSelectFiles = async () => {
    try {
      const filePaths = await window.electronAPI.selectFiles();
      if (filePaths && filePaths.length > 0) {
        setSelectedFiles(filePaths);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      return;
    }

    setSaving(true);
    
    try {
      const promptData = {
        title: title.trim(),
        prompt: prompt.trim(),
        type,
        tags,
        outputFiles: selectedFiles,
        aiSource: aiSource.trim(),
        modelName: modelName.trim(),
        modelType: modelType.trim(),
        baseModel: baseModel.trim(),
        negativePrompt: negativePrompt.trim()
      };

      await onSave(promptData);
      resetForm();
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFileName = (filePath) => {
    return filePath.split('\\').pop().split('/').pop();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Prompt</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your prompt (max 40 characters)"
            inputProps={{ maxLength: 40 }}
            helperText={`${title.length}/40 characters`}
          />

          <TextField
            label="Prompt"
            multiline
            rows={6}
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your AI prompt here..."
            required
          />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="image">Image</MenuItem>
              <MenuItem value="video">Video</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="AI Source (Website or Local)"
              fullWidth
              value={aiSource}
              onChange={(e) => setAiSource(e.target.value)}
              placeholder="e.g., Fotor AI, Clipfly, Pollo AI, Local..."
              helperText="Optional: Where did you generate this?"
            />
            <TextField
              label="Model Name"
              fullWidth
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., GPT-4, DALL-E 3, Stable Diffusion..."
              helperText="Optional: Which model was used?"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Model Type"
              fullWidth
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              placeholder="e.g., Text, Image, Video, Chat..."
              helperText="Optional: What type of model?"
            />
            <TextField
              label="Base Model"
              fullWidth
              value={baseModel}
              onChange={(e) => setBaseModel(e.target.value)}
              placeholder="e.g., VEO 3, SDXL 1.5, Candid Instax Photo..."
              helperText="Optional: Base model or variant"
            />
          </Box>

          <TextField
            label="Negative Prompt"
            multiline
            rows={3}
            fullWidth
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Enter negative prompt here (things to avoid)..."
            helperText="Optional: What should the AI avoid generating?"
          />

          <Box>
            <TextField
              label="Tags"
              fullWidth
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleAddTag}
              placeholder="Type tag and press Enter"
              helperText="Press Enter to add tags"
            />
            
            {tags.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                Output Files
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                onClick={handleSelectFiles}
                size="small"
              >
                Select Files
              </Button>
            </Box>

            {selectedFiles.length > 0 ? (
              <List dense>
                {selectedFiles.map((filePath, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={getFileName(filePath)}
                      secondary={filePath}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveFile(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No output files selected. You can add them later or leave empty for text-only prompts.
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!prompt.trim() || saving}
        >
          {saving ? 'Saving...' : 'Save Prompt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPromptDialog;