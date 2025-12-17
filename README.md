# Chrome/Edge Extension TypeScript Template

A modern, well-structured template for building Chrome and Edge browser extensions using TypeScript and Vite.

## Features

- 🚀 **Fast Development** - Powered by Vite for instant hot reload
- 📦 **TypeScript** - Full TypeScript support with strict typing
- 🎯 **Manifest V3** - Uses the latest extension manifest version
- 🔧 **Pre-configured** - Ready-to-use setup with all necessary configurations
- 🎨 **Modern UI** - Clean popup interface with dark/light theme support
- 📱 **Cross-browser** - Compatible with both Chrome and Edge
- 🛠️ **Developer Tools** - Comprehensive build scripts and development workflow

## Quick Start

1. **Clone or download this template**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start development:**
   ```bash
   npm run dev
   ```
4. **Load the extension in your browser:**
   - Open Chrome/Edge and go to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Project Structure

```
src/
├── manifest.json       # Extension manifest (V3)
├── background.ts       # Service worker
├── content.ts          # Content script
├── popup.html          # Popup UI
├── popup.ts           # Popup logic
├── popup.css          # Popup styles
├── injected.ts        # Page context script (optional)
└── icons/             # Extension icons
    └── README.md      # Icon guidelines
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build extension for production |
| `npm run build:watch` | Build in watch mode |
| `npm run type-check` | Run TypeScript type checking |
| `npm run clean` | Clean the dist directory |
| `npm run zip` | Build and create extension ZIP file |

## VS Code Tasks

This template includes preconfigured VS Code tasks for streamlined development. Access them via:
- **Command Palette:** `Ctrl+Shift+P` → "Tasks: Run Task"
- **Terminal Menu:** Terminal → Run Task

| Task | Description | Type |
|------|-------------|------|
| **Build Extension** | Production build with TypeScript compilation | Build |
| **Build Extension (Watch)** | Continuous build in watch mode for development | Build (Background) |
| **Type Check** | Run TypeScript type checking without compilation | Test |
| **Clean** | Remove all build artifacts from dist folder | Build |
| **Create Extension ZIP** | Build and package extension for store submission | Build |

### Task Usage Examples

**Quick Build:**
```
Ctrl+Shift+P → Tasks: Run Task → Build Extension
```

**Development with Auto-rebuild:**
```
Ctrl+Shift+P → Tasks: Run Task → Build Extension (Watch)
```

**Type Validation:**
```
Ctrl+Shift+P → Tasks: Run Task → Type Check
```

## Development Workflow

### 1. Development Mode
```bash
npm run dev
```
This starts Vite in development mode with hot reload. Load the `dist` folder as an unpacked extension in your browser.

### 2. Making Changes
- Edit files in the `src/` directory
- The extension will automatically rebuild
- Reload the extension in your browser to see changes

### 3. Production Build
```bash
npm run build
```
Creates an optimized build in the `dist/` folder ready for publishing.

### 4. Creating Distribution Package
```bash
npm run zip
```
Builds the extension and creates a `extension.zip` file ready for Chrome Web Store submission.

## Extension Components

### Background Script (`background.ts`)
- Service worker that runs in the background
- Handles extension lifecycle events
- Manages cross-tab communication
- Example: Installation handling, context menus, message passing

### Content Script (`content.ts`)
- Runs in the context of web pages
- Can access and modify page DOM
- Communicates with background script and popup
- Example: Text highlighting, page data extraction

### Popup (`popup.html`, `popup.ts`, `popup.css`)
- Extension's popup interface
- Activated when clicking the extension icon
- Includes settings, current tab info, and action buttons
- Features dark/light theme support

### Injected Script (`injected.ts`)
- Optional script that runs in page context
- Has access to page variables and functions
- Useful for deep page integration
- Communicates with content script via custom events

## Configuration

### Manifest (`src/manifest.json`)
The extension manifest defines:
- Extension metadata and permissions
- Background script configuration
- Content script injection rules
- Popup and icon definitions
- Web accessible resources

### Vite Configuration (`vite.config.ts`)
- Configures Vite for extension building
- Sets up the web extension plugin
- Defines build output directory (`dist`)
- Handles manifest generation

### TypeScript Configuration (`tsconfig.json`)
- Strict TypeScript settings
- Chrome extension type definitions
- Optimized for extension development

## Browser Compatibility

This template works with:
- ✅ Chrome (Manifest V3)
- ✅ Edge (Manifest V3)
- ✅ Other Chromium-based browsers

## Publishing

### Chrome Web Store
1. Build the extension: `npm run zip`
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Upload the `extension.zip` file
4. Fill in store listing details
5. Submit for review

### Edge Add-ons
1. Build the extension: `npm run zip`
2. Go to [Microsoft Edge Add-ons Developer Portal](https://partner.microsoft.com/en-us/dashboard/microsoftedge/)
3. Upload the `extension.zip` file
4. Fill in store listing details
5. Submit for review

## Customization

### Icons
Replace the placeholder icons in `src/icons/` with your own:
- `icon-16.png` (16x16) - Toolbar icon
- `icon-32.png` (32x32) - Windows taskbar
- `icon-48.png` (48x48) - Extension management
- `icon-128.png` (128x128) - Chrome Web Store

### Permissions
Edit `src/manifest.json` to add/remove permissions based on your extension's needs:
```json
{
  "permissions": [
    "activeTab",
    "storage"
  ]
}
```

### Content Scripts
Modify the `content_scripts` section in `manifest.json` to change which sites your content script runs on:
```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Extension not loading:**
   - Make sure you built the project (`npm run build`)
   - Check that you're loading the `dist` folder, not `src`
   - Look for errors in the browser's extension management page

2. **Hot reload not working:**
   - Restart the development server (`npm run dev`)
   - Reload the extension in the browser
   - Check the console for any errors

3. **TypeScript errors:**
   - Run `npm run type-check` to see all type issues
   - Make sure all dependencies are installed
   - Check that `@types/chrome` is properly installed

### Build Issues

If you encounter build problems:
```bash
# Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This template is provided as-is for educational and development purposes. Feel free to use it as a starting point for your own extensions.

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Chrome Web Store](https://chrome.google.com/webstore/)
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons/)
