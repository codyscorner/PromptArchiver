# Prompt Archiver

A desktop application for storing, organizing, and viewing AI prompts alongside their generated outputs (text, images, or videos).

## Features

- **Local-First Storage**: All data stored locally on your machine with no cloud dependency
- **Automatic Organization**: Creates organized folder structure by content type (text/image/video)
- **Media Support**: Built-in viewers for text, images, and videos
- **Search & Filter**: Find prompts by content or tags
- **Tagging System**: Organize prompts with custom tags
- **Export/Backup**: Export selected prompts to ZIP files for backup or sharing
- **Cross-Platform**: Built with Electron for Windows (with future macOS/Linux support)

## Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Setup
1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
To run the application in development mode:
```bash
npm run dev
```

### Building
To build the application for distribution:
```bash
npm run dist
```

## Usage

### Adding Prompts
1. Click the "+" button to open the Add Prompt dialog
2. Enter your prompt text
3. Select the content type (text, image, or video)
4. Add tags for organization (optional)
5. Attach output files (optional)
6. Click "Save Prompt"

### Browsing Prompts
- Use the sidebar to browse all saved prompts
- Filter by type using the dropdown
- Search by prompt content or tags
- Click on any prompt to view its details

### Viewing Content
- Text outputs are displayed in a formatted text viewer
- Images are shown with zoom and fit capabilities
- Videos can be played directly in the application

### Exporting
1. Select prompts using the checkboxes in the sidebar
2. Click "Export Selected" to create a ZIP backup
3. Choose the export location

### Settings
- Click the settings icon to configure the archive location
- The default location is `~/Prompt_Archive`

## File Structure

The application organizes your prompts in the following structure:

```
Prompt_Archive/
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
    │   └── generated_video.mp4
```

Each prompt folder contains:
- `prompt.txt`: The original prompt text
- `metadata.json`: Timestamp, tags, and other metadata
- Output files: Any generated content (images, videos, text files)

## Technical Details

### Built With
- **Electron**: Cross-platform desktop app framework
- **React**: Frontend user interface
- **Material-UI**: Component library for consistent design
- **Node.js**: Backend file system operations

### Key Features
- **Security**: Local-only storage with no external data transmission
- **Performance**: Handles thousands of prompts efficiently
- **Extensibility**: Modular architecture for future enhancements

## Future Enhancements

- Drag-and-drop file support
- Markdown support for text prompts
- Side-by-side comparison view
- AI-powered auto-tagging
- Optional NAS/private cloud sync

## License

MIT License - see LICENSE file for details