import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import AddPromptDialog from './components/AddPromptDialog';
import SettingsDialog from './components/SettingsDialog';

function App() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archivePath, setArchivePath] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    filterPrompts();
  }, [prompts, searchTerm, typeFilter, ratingFilter]);

  const initializeApp = async () => {
    try {
      const config = await window.electronAPI.getAppConfig();
      setArchivePath(config.archivePath || '');
      setAppVersion(config.version || '');
      
      if (config.archivePath) {
        await window.electronAPI.ensureArchiveStructure(config.archivePath);
        await loadPrompts(config.archivePath);
      } else {
        setSettingsOpen(true);
        showSnackbar('Please select an archive folder to get started', 'info');
      }
    } catch (error) {
      showSnackbar('Error initializing app: ' + error.message, 'error');
    }
  };

  const loadPrompts = async (path) => {
    try {
      const loadedPrompts = await window.electronAPI.loadPrompts(path);
      setPrompts(loadedPrompts);
    } catch (error) {
      showSnackbar('Error loading prompts: ' + error.message, 'error');
    }
  };

  const filterPrompts = () => {
    let filtered = prompts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(prompt => 
        prompt.prompt.toLowerCase().includes(term) ||
        (prompt.title && prompt.title.toLowerCase().includes(term)) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(prompt => prompt.type === typeFilter);
    }

    if (ratingFilter !== 'all') {
      const minRating = ratingFilter;
      if (minRating === 0) {
        filtered = filtered.filter(prompt => !prompt.rating || prompt.rating === 0);
      } else {
        filtered = filtered.filter(prompt => (prompt.rating || 0) >= minRating);
      }
    }

    setFilteredPrompts(filtered);
  };

  const handleAddPrompt = async (promptData) => {
    if (!archivePath) {
      showSnackbar('Please select an archive folder first', 'warning');
      setSettingsOpen(true);
      return;
    }

    try {
      const result = await window.electronAPI.savePrompt({
        ...promptData,
        archivePath
      });

      if (result.success) {
        await loadPrompts(archivePath);
        setAddDialogOpen(false);
        showSnackbar('Prompt saved successfully!', 'success');
      } else {
        showSnackbar('Error saving prompt: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Error saving prompt: ' + error.message, 'error');
    }
  };

  const handleArchivePathChange = async (newPath) => {
    setArchivePath(newPath);
    await window.electronAPI.ensureArchiveStructure(newPath);
    await loadPrompts(newPath);
    showSnackbar('Archive path updated successfully!', 'success');
  };

  const handlePromptUpdated = async () => {
    await loadPrompts(archivePath);
    // Update selectedPrompt if it's currently selected
    if (selectedPrompt) {
      const updatedPrompts = await window.electronAPI.loadPrompts(archivePath);
      const updatedSelectedPrompt = updatedPrompts.find(p => p.folderName === selectedPrompt.folderName);
      if (updatedSelectedPrompt) {
        setSelectedPrompt(updatedSelectedPrompt);
      }
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExportPrompts = async (selectedPrompts) => {
    if (selectedPrompts.length === 0) {
      showSnackbar('No prompts selected for export', 'warning');
      return;
    }

    try {
      const exportPath = await window.electronAPI.selectExportLocation();
      if (!exportPath) return;

      const promptPaths = selectedPrompts.map(prompt => prompt.path);
      const result = await window.electronAPI.exportPrompts({
        promptPaths,
        exportPath
      });

      if (result.success) {
        showSnackbar(
          `Successfully exported ${selectedPrompts.length} prompt(s) to ${exportPath}`,
          'success'
        );
      } else {
        showSnackbar('Export failed: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Export error: ' + error.message, 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="app">
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Prompt Archiver
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {prompts.length} prompts
          </Typography>
        </Toolbar>
      </AppBar>

      <Box className="main-content">
        <Sidebar
          prompts={filteredPrompts}
          selectedPrompt={selectedPrompt}
          onSelectPrompt={setSelectedPrompt}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          ratingFilter={ratingFilter}
          onRatingFilterChange={setRatingFilter}
          onOpenSettings={() => setSettingsOpen(true)}
          onExportSelected={handleExportPrompts}
        />
        
        <ContentArea
          selectedPrompt={selectedPrompt}
          archivePath={archivePath}
          onPromptUpdated={handlePromptUpdated}
          showSnackbar={showSnackbar}
        />
      </Box>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          if (!archivePath) {
            showSnackbar('Please select an archive folder first', 'warning');
            setSettingsOpen(true);
          } else {
            setAddDialogOpen(true);
          }
        }}
      >
        <AddIcon />
      </Fab>

      <AddPromptDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleAddPrompt}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        archivePath={archivePath}
        onArchivePathChange={handleArchivePathChange}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;