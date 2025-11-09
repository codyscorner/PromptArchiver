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
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  ButtonGroup
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';

const EditPromptDialog = ({ open, onClose, onSave, prompt: selectedPrompt }) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [aiSource, setAiSource] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('');
  const [baseModel, setBaseModel] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filesToAdd, setFilesToAdd] = useState([]);
  const [currentOutputFiles, setCurrentOutputFiles] = useState([]);
  const [fileMode, setFileMode] = useState('none'); // 'none', 'replace', 'add'
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (selectedPrompt) {
      setTitle(selectedPrompt.title || '');
      setPrompt(selectedPrompt.prompt || '');
      setTags(selectedPrompt.tags || []);
      setAiSource(selectedPrompt.aiSource || '');
      setModelName(selectedPrompt.modelName || '');
      setModelType(selectedPrompt.modelType || '');
      setBaseModel(selectedPrompt.baseModel || '');
      setNegativePrompt(selectedPrompt.negativePrompt || '');
      setCurrentOutputFiles(selectedPrompt.outputFiles || []);
      setSelectedFiles([]);
      setFilesToAdd([]);
      setFileMode('none');
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

  const handleSelectFilesToReplace = async () => {
    try {
      const filePaths = await window.electronAPI.selectFiles();
      if (filePaths && filePaths.length > 0) {
        setSelectedFiles(filePaths);
        setFilesToAdd([]);
        setFileMode('replace');
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  const handleSelectFilesToAdd = async () => {
    try {
      const filePaths = await window.electronAPI.selectFiles();
      if (filePaths && filePaths.length > 0) {
        setFilesToAdd(filePaths);
        setSelectedFiles([]);
        setFileMode('add');
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };

  const handleRemoveReplaceFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setFileMode('none');
    }
  };

  const handleRemoveAddFile = (index) => {
    const newFiles = filesToAdd.filter((_, i) => i !== index);
    setFilesToAdd(newFiles);
    if (newFiles.length === 0) {
      setFileMode('none');
    }
  };

  const getFileName = (filePath) => {
    return filePath.split('\\').pop().split('/').pop();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const filePaths = files.map(file => file.path);

      // Default behavior: add files (not replace)
      setFilesToAdd(prevFiles => [...prevFiles, ...filePaths]);
      setSelectedFiles([]);
      setFileMode('add');
    }
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
        tags,
        aiSource: aiSource.trim(),
        modelName: modelName.trim(),
        modelType: modelType.trim(),
        baseModel: baseModel.trim(),
        negativePrompt: negativePrompt.trim()
      };

      await onSave(promptData);

      // Handle file operations based on mode
      if (fileMode === 'replace' && selectedFiles.length > 0) {
        try {
          const result = await window.electronAPI.replacePromptFiles({
            promptPath: selectedPrompt.path,
            newFiles: selectedFiles
          });

          if (!result.success) {
            console.error('Error replacing files:', result.error);
          }
        } catch (error) {
          console.error('Error replacing files:', error);
        }
      } else if (fileMode === 'add' && filesToAdd.length > 0) {
        try {
          const result = await window.electronAPI.appendPromptFiles({
            promptPath: selectedPrompt.path,
            newFiles: filesToAdd
          });

          if (!result.success) {
            console.error('Error adding files:', result.error);
          }
        } catch (error) {
          console.error('Error adding files:', error);
        }
      }
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
              <ButtonGroup variant="outlined" size="small">
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleSelectFilesToAdd}
                >
                  Add More Files
                </Button>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleSelectFilesToReplace}
                >
                  Replace All Files
                </Button>
              </ButtonGroup>
            </Box>

            <Box
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                border: isDragging ? '2px dashed #1976d2' : '2px dashed #ccc',
                borderRadius: 2,
                backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                transition: 'all 0.2s ease',
                minHeight: (fileMode === 'none' && currentOutputFiles.length === 0) ? '100px' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              {fileMode === 'replace' && selectedFiles.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    New files selected. These will replace all existing output files when you save.
                  </Alert>
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
                            onClick={() => handleRemoveReplaceFile(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {fileMode === 'add' && filesToAdd.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {isDragging
                      ? 'Drop files here to add more...'
                      : 'These files will be added to your existing output files when you save.'}
                  </Alert>
                  <List dense>
                    {filesToAdd.map((filePath, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={getFileName(filePath)}
                          secondary={filePath}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveAddFile(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {fileMode === 'none' && currentOutputFiles.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Current files ({currentOutputFiles.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {currentOutputFiles.map((file, index) => (
                      <Chip
                        key={index}
                        label={file}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                    {isDragging
                      ? 'Drop files here to add more...'
                      : 'Drag & drop files here to add more, or use buttons above'}
                  </Typography>
                </Box>
              )}

              {fileMode === 'none' && currentOutputFiles.length === 0 && (
                <Alert severity="info" sx={{ m: 2 }}>
                  {isDragging
                    ? 'Drop files here...'
                    : 'No output files. Drag & drop files here, or click "Add More Files" / "Replace All Files" buttons above'}
                </Alert>
              )}
            </Box>
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