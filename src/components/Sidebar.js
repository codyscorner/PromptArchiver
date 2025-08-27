import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Checkbox,
  Button
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import StarRating from './StarRating';

const Sidebar = ({
  prompts,
  selectedPrompt,
  onSelectPrompt,
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  ratingFilter,
  onRatingFilterChange,
  onOpenSettings,
  onExportSelected
}) => {
  const [selectedForExport, setSelectedForExport] = React.useState(new Set());
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPromptPreview = (prompt) => {
    return prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
  };

  const handleExportToggle = (promptId) => {
    const newSelected = new Set(selectedForExport);
    if (newSelected.has(promptId)) {
      newSelected.delete(promptId);
    } else {
      newSelected.add(promptId);
    }
    setSelectedForExport(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedForExport.size === prompts.length) {
      setSelectedForExport(new Set());
    } else {
      setSelectedForExport(new Set(prompts.map(p => p.folderName)));
    }
  };

  const handleExport = () => {
    const selectedPrompts = prompts.filter(p => selectedForExport.has(p.folderName));
    onExportSelected(selectedPrompts);
    setSelectedForExport(new Set());
  };

  return (
    <Box className="sidebar">
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Prompts
          </Typography>
          <Tooltip title="Settings">
            <IconButton onClick={onOpenSettings} size="small">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => onTypeFilterChange(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="image">Image</MenuItem>
            <MenuItem value="video">Video</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Rating</InputLabel>
          <Select
            value={ratingFilter}
            label="Rating"
            onChange={(e) => onRatingFilterChange(e.target.value)}
          >
            <MenuItem value="all">All Ratings</MenuItem>
            <MenuItem value={5}>
              <StarRating rating={5} readonly size="small" />
            </MenuItem>
            <MenuItem value={4}>
              <StarRating rating={4} readonly size="small" /> +
            </MenuItem>
            <MenuItem value={3}>
              <StarRating rating={3} readonly size="small" /> +
            </MenuItem>
            <MenuItem value={2}>
              <StarRating rating={2} readonly size="small" /> +
            </MenuItem>
            <MenuItem value={1}>
              <StarRating rating={1} readonly size="small" /> +
            </MenuItem>
            <MenuItem value={0}>Unrated</MenuItem>
          </Select>
        </FormControl>

        {prompts.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              size="small"
              onClick={handleSelectAll}
              variant="outlined"
            >
              {selectedForExport.size === prompts.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedForExport.size > 0 && (
              <Button
                size="small"
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={handleExport}
              >
                Export Selected ({selectedForExport.size})
              </Button>
            )}
          </Box>
        )}
      </Box>

      <List className="scrollable" sx={{ p: 0 }}>
        {prompts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No prompts found
            </Typography>
          </Box>
        ) : (
          prompts.map((prompt) => (
            <ListItem
              key={prompt.folderName}
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 2,
                borderBottom: 1,
                borderColor: 'divider',
                backgroundColor: selectedPrompt?.folderName === prompt.folderName ? 'action.selected' : 'transparent'
              }}
            >
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start' }}>
                <Checkbox
                  checked={selectedForExport.has(prompt.folderName)}
                  onChange={() => handleExportToggle(prompt.folderName)}
                  size="small"
                  sx={{ mt: -1, mr: 1 }}
                />
                
                <Box 
                  sx={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => onSelectPrompt(prompt)}
                >
              <Box sx={{ width: '100%', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Chip
                    label={prompt.type}
                    size="small"
                    color={
                      prompt.type === 'text' ? 'primary' :
                      prompt.type === 'image' ? 'secondary' : 'success'
                    }
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(prompt.timestamp)}
                  </Typography>
                </Box>
                
                <Typography
                  variant="body2"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                    mb: 1
                  }}
                >
                  {getPromptPreview(prompt.prompt)}
                </Typography>

                <StarRating 
                  rating={prompt.rating || 0} 
                  readonly 
                  size="small" 
                />
                
                {prompt.tags && prompt.tags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {prompt.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem', height: 20 }}
                      />
                    ))}
                  </Box>
                )}
                
                {prompt.outputFiles && prompt.outputFiles.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {prompt.outputFiles.length} output file(s)
                  </Typography>
                )}
                </Box>
                </Box>
              </Box>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
};

export default Sidebar;