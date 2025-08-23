import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Box,
  Typography,
  Divider
} from '@mui/material';

const EditPromptDialog = ({ open, onClose, onSave, prompt: selectedPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [aiSource, setAiSource] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('');
  const [baseModel, setBaseModel] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedPrompt) {
      setPrompt(selectedPrompt.prompt || '');
      setTags(selectedPrompt.tags || []);
      setAiSource(selectedPrompt.aiSource || '');
      setModelName(selectedPrompt.modelName || '');
      setModelType(selectedPrompt.modelType || '');
      setBaseModel(selectedPrompt.baseModel || '');
      setNegativePrompt(selectedPrompt.negativePrompt || '');
      setTagInput('');
    }
  }, [selectedPrompt]);

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
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

  const handleSave = async () => {
    if (!prompt.trim()) {
      return;
    }

    setSaving(true);
    
    try {
      const promptData = {
        prompt: prompt.trim(),
        tags,
        aiSource: aiSource.trim(),
        modelName: modelName.trim(),
        modelType: modelType.trim(),
        baseModel: baseModel.trim(),
        negativePrompt: negativePrompt.trim()
      };

      await onSave(promptData);
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!selectedPrompt) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Prompt</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Type: {selectedPrompt.type} • Created: {new Date(selectedPrompt.timestamp).toLocaleString()}
            </Typography>
            <Divider />
          </Box>

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
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPromptDialog;