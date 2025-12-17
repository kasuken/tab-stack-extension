# TabStack - Advanced Tab Manager

A powerful Chrome/Edge extension for managing browser tabs with smart search, grouping, and bulk operations. Built with TypeScript and Vite.

## Features

- 🔍 **Smart Search** - Instantly filter tabs by title and URL across all windows
- 📊 **Tab Organization** - Automatic grouping by window with visual hierarchy
- ⚡ **Quick Actions** - Focus, close, or bulk manage tabs with ease
- 🔄 **Real-time Sync** - Automatic updates as tabs are created, moved, or closed
- 🎯 **Bulk Operations** - Select multiple tabs and close them in one action
- 📱 **Dual Interface** - Fast popup for quick access + full dashboard for power users
- 🚀 **Fast Development** - Powered by Vite for instant hot reload
- 📦 **TypeScript** - Full TypeScript support with strict typing
- 🎯 **Manifest V3** - Uses the latest extension manifest version

## Core Capabilities

### Tab Indexing & Organization
- **Automatic Indexing**: Uses `chrome.tabs.query({})` to list all tabs
- **Window Grouping**: Tabs are automatically grouped by `windowId` for better organization
- **In-memory Model**: Fast, efficient data structure for instant access

### Search & Filter
- **Local-only Search**: Privacy-focused filtering by tab title and URL
- **Real-time Results**: Instant updates as you type
- **Multi-criteria**: Search across both title and URL simultaneously

### Tab Actions
- **Focus Tab**: `chrome.tabs.update(tabId, { active: true })` + window focus
- **Close Tabs**: Single or bulk close operations with `chrome.tabs.remove([...ids])`
- **Close All Results**: Quickly close all tabs matching current search filter
- **Select Mode**: Checkbox selection for granular bulk operations

### Real-time Synchronization
Subscribes to Chrome events for automatic updates:

**Tab Events:**
- `tabs.onCreated` - New tab opened
- `tabs.onRemoved` - Tab closed
- `tabs.onUpdated` - Tab title/URL changed
- `tabs.onMoved` - Tab reordered
- `tabs.onAttached` - Tab moved to different window
- `tabs.onDetached` - Tab removed from window

**Window Events:**
- `windows.onCreated` - New window opened
- `windows.onRemoved` - Window closed
- `windows.onFocusChanged` - Different window focused

## User Interface

### Popup (popup.html)
- **Quick Access**: Click extension icon for instant tab search
- **Search Box**: Filter tabs in real-time
- **Results List**: Compact view of matching tabs
- **Fast Actions**: Quickly focus or close tabs

### Dashboard (dashboard.html)
- **Full-page View**: `chrome-extension://<id>/dashboard.html`
- **Privacy-focused**: Internal extension page (no external sites)
- **Enhanced Features**: Advanced filtering, bulk operations, and analytics
- **Better UX**: More screen space for managing large tab collections

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
├── background.ts       # Service worker - tab indexing & event listeners
├── popup.html          # Popup UI - quick search interface
├── popup.ts           # Popup logic - search & basic actions
├── popup.css          # Popup styles
├── dashboard.html     # Full dashboard UI (planned)
├── dashboard.ts       # Dashboard logic - advanced features (planned)
├── dashboard.css      # Dashboard styles (planned)
└── icons/             # Extension icons
    └── README.md      # Icon guidelines
```

## Architecture

### Background Service Worker (background.ts)
**Primary responsibilities:**
- **Tab Indexing**: Query and maintain in-memory tab model grouped by window
- **Event Subscriptions**: Listen to all tab and window events
- **State Management**: Keep tab index synchronized in real-time
- **Message Handling**: Respond to requests from popup/dashboard

**Key APIs used:**
- `chrome.tabs.query({})` - Initial tab indexing
- `chrome.tabs.*` event listeners - Real-time sync
- `chrome.windows.*` event listeners - Window tracking
- `chrome.runtime.onMessage` - Communication with UI

### Popup Interface (popup.html/ts)
**Quick access features:**
- Search input with real-time filtering
- Results list showing matching tabs
- Click to focus tab
- Close button for individual tabs
- "Close all results" for bulk operations

### Dashboard Interface (dashboard.html/ts)
**Advanced features:**
- Full-page extension view (`chrome-extension://<id>/dashboard.html`)
- Enhanced search with multiple filters
- Select mode with checkboxes for bulk operations
- Visual grouping by window
- Tab statistics and analytics
- Better performance with large tab collections

**Privacy advantage:** Internal extension page keeps all data local, no external dependencies

## Quick Start

### Installation
1. **Build the extension:**
   ```bash
   npm install
   npm run build
   ```

2. **Load in browser:**
   - Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

### Using TabStack

#### Popup Interface (Quick Access)
1. Click the TabStack extension icon in your browser toolbar
2. **Search**: Type in the search box to filter tabs by title or URL
3. **Focus Tab**: Click on any tab in the results to switch to it
4. **Close Tab**: Click the ✕ button next to a tab to close it
5. **Bulk Close**: Use "Close All Results" to close all filtered tabs at once
6. **Open Dashboard**: Click the "Dashboard" button for advanced features

#### Dashboard (Power User Features)
Access the dashboard by:
- Clicking "Dashboard" button in the popup, or
- Navigating to `chrome-extension://<your-extension-id>/dashboard.html`

**Dashboard Features:**
- **Select Mode**: Click "Select Mode" to enable multi-tab selection with checkboxes
- **Bulk Operations**:
  - ☑️ Select individual tabs or use "Select All" for entire windows
  - ✕ "Close Selected" - Close all selected tabs at once
  - 🪟 "Move to New Window" - Move selected tabs to a new browser window
- **Window Management**: 
  - View tabs organized by window
  - Close entire windows
  - See which window is currently focused (🔵 indicator)
- **Enhanced Search**: Filter across all tabs with real-time results
- **Statistics**: View total tab count and window count at a glance
- **Grid View**: See more tabs at once with card-based layout

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
**TabStack's core engine:**
- Maintains in-memory tab index grouped by `windowId`
- Subscribes to all tab/window events for real-time sync
- Handles search queries and returns filtered results
- Executes tab actions (focus, close, bulk operations)

**Event handlers:**
```typescript
chrome.tabs.onCreated.addListener()    // Add new tab to index
chrome.tabs.onRemoved.addListener()    // Remove tab from index
chrome.tabs.onUpdated.addListener()    // Update tab metadata
chrome.tabs.onMoved.addListener()      // Update tab position
chrome.tabs.onAttached.addListener()   // Handle tab moved to window
chrome.tabs.onDetached.addListener()   // Handle tab removed from window
chrome.windows.onCreated.addListener() // Track new windows
chrome.windows.onRemoved.addListener() // Clean up closed windows
chrome.windows.onFocusChanged.addListener() // Track active window
```

### Popup (`popup.html`, `popup.ts`, `popup.css`)
**Fast-path interface:**
- Search box with real-time filtering
- Compact results list grouped by window
- Quick actions: focus tab (click) or close (button)
- "Close all results" button for current filter
- Communicates with background script for tab data and actions

### Dashboard (`dashboard.html`, `dashboard.ts`, `dashboard.css`)
**Power-user interface:**
- Full-page internal view at `chrome-extension://<id>/dashboard.html`
- Advanced search with multiple criteria
- Select mode with checkboxes for bulk operations
- Visual window grouping with statistics
- Enhanced tab management features
- Better performance for users with many tabs

**Why internal page?**
- Privacy: All data stays local, no external sites
- Security: Full extension privileges
- Performance: Direct access to background script
- Reliability: No external dependencies or network calls

## Configuration

### Manifest (`src/manifest.json`)
The extension manifest defines:
- Extension metadata (name: "TabStack")
- **Required permissions**: `"tabs"`, `"storage"` (for settings)
- **Optional host permissions**: None needed (privacy-focused, local-only)
- Background service worker configuration
- Popup and dashboard page definitions
- Action icon and toolbar integration

**Key permissions:**
```json
{
  "permissions": [
    "tabs",      // Required for tab querying and management
    "storage"    // For user preferences and settings
  ]
}
```

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
