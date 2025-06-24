# YouTube Music Export

A modern TypeScript-based Chrome extension to export your YouTube Music listening history for personal research.

## Features

- 🎵 Auto-collect songs while browsing YouTube Music
- 📊 Export data as JSON with timestamps
- 🧹 Remove duplicate entries
- ⚡ Built with TypeScript and Tailwind CSS
- 🔒 ToS compliant - only collects your own data

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

### Development Scripts

- `npm run build` - Build the extension
- `npm run watch` - Watch for changes and rebuild
- `npm run clean` - Clean the dist folder

## Project Structure

```
ytm-export/
├── src/
│   ├── types.ts          # TypeScript type definitions
│   ├── content.ts        # Content script (injected into YouTube Music)
│   ├── background.ts     # Background script
│   ├── popup.ts          # Popup script
│   ├── popup.html        # Popup HTML with Tailwind CSS
│   ├── styles.css        # Tailwind CSS input
│   └── manifest.json     # Extension manifest
├── dist/                 # Built extension files
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Usage

1. Navigate to YouTube Music
2. The extension will automatically collect songs as you browse
3. Use the popup to:
   - Toggle auto-collection on/off
   - Extract songs from current page
   - Export all collected data
   - Remove duplicates
   - Clear all data

## Data Format

Exported JSON includes:
- Song title, artist, album
- YouTube Music URLs
- Timestamps
- Page context (history, playlist, etc.)
- Explicit content flags

## License

This extension is for personal use only and complies with YouTube Music's Terms of Service.