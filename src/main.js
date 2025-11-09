const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

const store = new Store();
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: `Prompt Archiver (v${app.getVersion()})`,
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

  // Set up application menu
  setupApplicationMenu();

  // Ensure title persists after page load
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle(`Prompt Archiver (v${app.getVersion()})`);
  });
}

function setupApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Prompt',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('open-add-dialog');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Prompt Archiver',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Prompt Archiver',
              message: `Prompt Archiver v${app.getVersion()}`,
              detail: 'A desktop application for storing, organizing, and viewing AI prompts alongside their generated outputs (text, images, or videos).\n\nFeatures:\n• Local-first storage with no cloud dependency\n• Automatic organization by content type\n• Built-in viewers for text, images, and videos\n• Search and filter capabilities\n• Export and backup functionality',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Usage Guide',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'How to Use Prompt Archiver',
              message: 'Usage Guide',
              detail: 'Adding Prompts:\n1. Click the "+" button to open the Add Prompt dialog\n2. Enter your prompt text\n3. Select content type (text, image, or video)\n4. Add tags for organization (optional)\n5. Attach output files (optional)\n6. Click "Save Prompt"\n\nBrowsing Prompts:\n• Use the sidebar to browse all saved prompts\n• Filter by type using the dropdown\n• Search by prompt content or tags\n• Click on any prompt to view its details\n\nExporting:\n1. Select prompts using checkboxes in sidebar\n2. Click "Export Selected" to create ZIP backup\n3. Choose the export location',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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
      title,
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
      title: title || '',
      tags: tags || [],
      folderName,
      aiSource: aiSource || '',
      modelName: modelName || '',
      modelType: modelType || '',
      baseModel: baseModel || '',
      hasNegativePrompt: !!(negativePrompt && negativePrompt.trim()),
      rating: 0
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
                title: metadata.title || '',
                aiSource: metadata.aiSource || '',
                modelName: metadata.modelName || '',
                modelType: metadata.modelType || '',
                baseModel: metadata.baseModel || '',
                hasNegativePrompt: metadata.hasNegativePrompt || !!negativePrompt,
                rating: metadata.rating || 0
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
      title,
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
      title: title || '',
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

ipcMain.handle('append-prompt-files', async (event, { promptPath, newFiles }) => {
  try {
    // Copy new files without removing existing ones
    if (newFiles && newFiles.length > 0) {
      for (const filePath of newFiles) {
        try {
          const fileName = path.basename(filePath);
          let destPath = path.join(promptPath, fileName);

          // Check if file already exists and add a number suffix if needed
          let counter = 1;
          while (true) {
            try {
              await fs.access(destPath);
              // File exists, try with a number suffix
              const ext = path.extname(fileName);
              const nameWithoutExt = path.basename(fileName, ext);
              destPath = path.join(promptPath, `${nameWithoutExt}_${counter}${ext}`);
              counter++;
            } catch (error) {
              // File doesn't exist, we can use this path
              break;
            }
          }

          await fs.copyFile(filePath, destPath);
        } catch (fileError) {
          console.error(`Error copying file ${filePath}:`, fileError);
        }
      }
    }

    return { success: true, message: 'Files added successfully' };
  } catch (error) {
    console.error('Error appending prompt files:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-prompt-rating', async (event, { promptPath, rating }) => {
  try {
    // Update metadata with rating
    const metadataPath = path.join(promptPath, 'metadata.json');
    const existingMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    const updatedMetadata = {
      ...existingMetadata,
      rating: rating,
      lastModified: new Date().toISOString()
    };

    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));

    return { success: true, message: 'Rating updated successfully' };
  } catch (error) {
    console.error('Error updating rating:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clone-prompt', async (event, { promptPath, archivePath }) => {
  try {
    // Read the source prompt metadata
    const metadataPath = path.join(promptPath, 'metadata.json');
    const sourceMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    // Create new timestamp and folder name for the clone
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `prompt_${timestamp}`;
    const typePath = path.join(archivePath, sourceMetadata.type);
    const cloneFolder = path.join(typePath, folderName);

    // Create the clone folder
    await fs.mkdir(cloneFolder, { recursive: true });

    // Read all files from source folder
    const files = await fs.readdir(promptPath);

    // Copy all files to the new folder
    for (const file of files) {
      const sourcePath = path.join(promptPath, file);
      const destPath = path.join(cloneFolder, file);

      const stat = await fs.stat(sourcePath);
      if (stat.isFile()) {
        await fs.copyFile(sourcePath, destPath);
      }
    }

    // Update the metadata in the clone with new timestamp and folder name
    const cloneMetadataPath = path.join(cloneFolder, 'metadata.json');
    const cloneMetadata = {
      ...sourceMetadata,
      timestamp: new Date().toISOString(),
      folderName: folderName,
      clonedFrom: sourceMetadata.folderName,
      rating: 0 // Reset rating for the clone
    };

    await fs.writeFile(cloneMetadataPath, JSON.stringify(cloneMetadata, null, 2));

    return {
      success: true,
      message: 'Prompt cloned successfully',
      newPath: cloneFolder
    };
  } catch (error) {
    console.error('Error cloning prompt:', error);
    return { success: false, error: error.message };
  }
});