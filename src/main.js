const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

const store = new Store();
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools(); // Commented out - can open manually with F12
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('get-app-config', () => {
  return {
    archivePath: store.get('archivePath'),
    version: app.getVersion()
  };
});

ipcMain.handle('set-archive-path', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const newPath = path.join(result.filePaths[0], 'Prompt_Archive');
    store.set('archivePath', newPath);
    return newPath;
  }
  return null;
});

ipcMain.handle('ensure-archive-structure', async (event, archivePath) => {
  try {
    await fs.mkdir(archivePath, { recursive: true });
    await fs.mkdir(path.join(archivePath, 'text'), { recursive: true });
    await fs.mkdir(path.join(archivePath, 'image'), { recursive: true });
    await fs.mkdir(path.join(archivePath, 'video'), { recursive: true });
    return true;
  } catch (error) {
    console.error('Error creating archive structure:', error);
    return false;
  }
});

ipcMain.handle('save-prompt', async (event, promptData) => {
  try {
    const { 
      prompt, 
      type, 
      tags, 
      archivePath, 
      outputFiles,
      aiSource,
      modelName,
      modelType,
      baseModel,
      negativePrompt
    } = promptData;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `prompt_${timestamp}`;
    const typePath = path.join(archivePath, type);
    const promptFolder = path.join(typePath, folderName);
    
    await fs.mkdir(promptFolder, { recursive: true });
    
    // Save prompt
    await fs.writeFile(path.join(promptFolder, 'prompt.txt'), prompt);
    
    // Save negative prompt if provided
    if (negativePrompt && negativePrompt.trim()) {
      await fs.writeFile(path.join(promptFolder, 'negative_prompt.txt'), negativePrompt);
    }
    
    // Save metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      type,
      tags: tags || [],
      folderName,
      aiSource: aiSource || '',
      modelName: modelName || '',
      modelType: modelType || '',
      baseModel: baseModel || '',
      hasNegativePrompt: !!(negativePrompt && negativePrompt.trim())
    };
    await fs.writeFile(path.join(promptFolder, 'metadata.json'), JSON.stringify(metadata, null, 2));
    
    // Copy output files if provided
    if (outputFiles && outputFiles.length > 0) {
      for (const filePath of outputFiles) {
        try {
          const fileName = path.basename(filePath);
          const destPath = path.join(promptFolder, fileName);
          await fs.copyFile(filePath, destPath);
        } catch (fileError) {
          console.error(`Error copying file ${filePath}:`, fileError);
        }
      }
    }
    
    return { success: true, path: promptFolder };
  } catch (error) {
    console.error('Error saving prompt:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-prompts', async (event, archivePath) => {
  try {
    const prompts = [];
    const types = ['text', 'image', 'video'];
    
    for (const type of types) {
      const typePath = path.join(archivePath, type);
      try {
        const folders = await fs.readdir(typePath);
        
        for (const folder of folders) {
          const folderPath = path.join(typePath, folder);
          const stat = await fs.stat(folderPath);
          
          if (stat.isDirectory()) {
            try {
              const metadataPath = path.join(folderPath, 'metadata.json');
              const promptPath = path.join(folderPath, 'prompt.txt');
              
              const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
              const prompt = await fs.readFile(promptPath, 'utf8');
              
              // Try to read negative prompt if it exists
              let negativePrompt = '';
              try {
                const negativePath = path.join(folderPath, 'negative_prompt.txt');
                negativePrompt = await fs.readFile(negativePath, 'utf8');
              } catch (error) {
                // Negative prompt file doesn't exist, that's okay
              }
              
              // Find output files
              const files = await fs.readdir(folderPath);
              const outputFiles = files.filter(f => f !== 'prompt.txt' && f !== 'metadata.json' && f !== 'negative_prompt.txt');
              
              prompts.push({
                ...metadata,
                prompt,
                negativePrompt,
                outputFiles,
                path: folderPath,
                // Ensure backward compatibility with old prompts
                aiSource: metadata.aiSource || '',
                modelName: metadata.modelName || '',
                modelType: metadata.modelType || '',
                baseModel: metadata.baseModel || '',
                hasNegativePrompt: metadata.hasNegativePrompt || !!negativePrompt
              });
            } catch (error) {
              console.error(`Error reading prompt folder ${folder}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading type folder ${type}:`, error);
      }
    }
    
    return prompts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error loading prompts:', error);
    return [];
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath);
    console.log('Backend reading file:', filePath, 'Size:', data.length, 'Type:', typeof data);
    
    // Check if it's a text file based on extension
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = ['.txt', '.md', '.json', '.xml', '.csv', '.log'];
    
    if (textExtensions.includes(ext)) {
      // Return as UTF-8 string for text files
      return { success: true, data: data.toString('utf8'), isText: true };
    } else {
      // Return as base64 for binary files (images, videos)
      return { success: true, data: data.toString('base64'), isText: false };
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-file-url', async (event, filePath) => {
  try {
    // Check if file exists
    await fs.access(filePath, require('fs').constants.F_OK);
    // Return file URL for direct access
    const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
    return { success: true, url: fileUrl };
  } catch (error) {
    console.error('Error accessing file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'] },
      { name: 'Text', extensions: ['txt', 'md', 'json'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }
  return [];
});

ipcMain.handle('export-prompts', async (event, { promptPaths, exportPath }) => {
  try {
    const archiver = require('archiver');
    const fs = require('fs');
    
    const output = fs.createWriteStream(exportPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({ success: true, size: archive.pointer() });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add each prompt folder to the archive
      promptPaths.forEach((promptPath, index) => {
        const folderName = path.basename(promptPath);
        archive.directory(promptPath, folderName);
      });

      archive.finalize();
    });
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-export-location', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'prompt_export.zip',
    filters: [
      { name: 'ZIP Files', extensions: ['zip'] }
    ]
  });
  
  if (!result.canceled && result.filePath) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('change-prompt-type', async (event, { promptPath, newType, archivePath }) => {
  try {
    const oldFolderName = path.basename(promptPath);
    const currentType = path.basename(path.dirname(promptPath));
    
    if (currentType === newType) {
      return { success: true, message: 'Prompt is already in the correct type folder' };
    }
    
    const newTypePath = path.join(archivePath, newType);
    const newPromptPath = path.join(newTypePath, oldFolderName);
    
    // Ensure the new type directory exists
    await fs.mkdir(newTypePath, { recursive: true });
    
    // Check if destination already exists
    try {
      await fs.access(newPromptPath);
      return { success: false, error: 'A prompt with this name already exists in the destination folder' };
    } catch (error) {
      // Good, destination doesn't exist
    }
    
    // Move the entire prompt folder
    await fs.rename(promptPath, newPromptPath);
    
    // Update metadata.json with new type
    const metadataPath = path.join(newPromptPath, 'metadata.json');
    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
      metadata.type = newType;
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
    
    return { 
      success: true, 
      newPath: newPromptPath,
      message: `Prompt moved from ${currentType} to ${newType}` 
    };
  } catch (error) {
    console.error('Error changing prompt type:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-prompt', async (event, { promptPath, promptData }) => {
  try {
    const { 
      prompt, 
      tags, 
      aiSource,
      modelName,
      modelType,
      baseModel,
      negativePrompt
    } = promptData;
    
    // Update prompt file
    await fs.writeFile(path.join(promptPath, 'prompt.txt'), prompt);
    
    // Update or create negative prompt file
    const negativePath = path.join(promptPath, 'negative_prompt.txt');
    if (negativePrompt && negativePrompt.trim()) {
      await fs.writeFile(negativePath, negativePrompt);
    } else {
      // Remove negative prompt file if it exists but new prompt is empty
      try {
        await fs.unlink(negativePath);
      } catch (error) {
        // File doesn't exist, that's okay
      }
    }
    
    // Update metadata
    const metadataPath = path.join(promptPath, 'metadata.json');
    const existingMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
    
    const updatedMetadata = {
      ...existingMetadata,
      tags: tags || [],
      aiSource: aiSource || '',
      modelName: modelName || '',
      modelType: modelType || '',
      baseModel: baseModel || '',
      hasNegativePrompt: !!(negativePrompt && negativePrompt.trim()),
      lastModified: new Date().toISOString()
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    
    return { success: true, message: 'Prompt updated successfully' };
  } catch (error) {
    console.error('Error updating prompt:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-prompt', async (event, promptPath) => {
  try {
    // Delete the entire prompt folder
    await fs.rm(promptPath, { recursive: true, force: true });
    return { success: true, message: 'Prompt deleted successfully' };
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('replace-prompt-files', async (event, { promptPath, newFiles }) => {
  try {
    // Get list of existing output files to remove
    const files = await fs.readdir(promptPath);
    const existingOutputFiles = files.filter(f => 
      f !== 'prompt.txt' && 
      f !== 'metadata.json' && 
      f !== 'negative_prompt.txt'
    );
    
    // Remove existing output files
    for (const file of existingOutputFiles) {
      try {
        await fs.unlink(path.join(promptPath, file));
      } catch (error) {
        console.error(`Error removing file ${file}:`, error);
      }
    }
    
    // Copy new files
    if (newFiles && newFiles.length > 0) {
      for (const filePath of newFiles) {
        try {
          const fileName = path.basename(filePath);
          const destPath = path.join(promptPath, fileName);
          await fs.copyFile(filePath, destPath);
        } catch (fileError) {
          console.error(`Error copying file ${filePath}:`, fileError);
        }
      }
    }
    
    return { success: true, message: 'Files replaced successfully' };
  } catch (error) {
    console.error('Error replacing prompt files:', error);
    return { success: false, error: error.message };
  }
});