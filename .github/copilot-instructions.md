# TabStack Extension Development Instructions

This is TabStack - an advanced tab management extension built with TypeScript and Vite. When working on this project:

## Project Overview

TabStack is a privacy-focused browser extension for managing tabs with smart search, grouping, and bulk operations. It provides:
- Real-time tab indexing grouped by window
- Local-only search across tab titles and URLs
- Quick actions (focus, close, bulk operations)
- Dual interface: popup for quick access + dashboard for power users

## General Guidelines

- This extension supports both Chrome and Edge browsers using Manifest V3
- All TypeScript files should follow strict typing practices
- Use the Chrome Extension APIs through the `chrome` namespace
- **Privacy-first**: All tab data stays local, no external API calls or tracking
- **Performance-focused**: Maintain in-memory tab index for instant search
- For cross-browser compatibility, consider using `webextension-polyfill`

## Project Structure

- `src/manifest.json` - Extension manifest (Manifest V3) - requires "tabs" permission
- `src/background.ts` - Service worker - tab indexing engine & event listeners
- `src/popup.ts` - Popup UI logic - quick search & basic actions
- `src/popup.html` - Popup UI layout - compact search interface
- `src/popup.css` - Popup UI styles
- `src/dashboard.ts` - Dashboard logic - advanced features (planned)
- `src/dashboard.html` - Full-page dashboard view (planned)
- `src/dashboard.css` - Dashboard styles (planned)
- `src/icons/` - Extension icons directory

**Note**: `content.ts` and `injected.ts` are not used in TabStack (no page injection needed)

## Core Architecture

### Background Service Worker (background.ts)

**Primary responsibility: Maintain real-time tab index**

Key implementation requirements:
1. **Tab Indexing**: 
   - Use `chrome.tabs.query({})` to get all tabs on startup
   - Group tabs by `windowId` in an in-memory data structure
   - Structure: `Map<windowId, Tab[]>` or similar

2. **Event Subscriptions** (ALL required for real-time sync):
   ```typescript
   chrome.tabs.onCreated     // Add tab to index
   chrome.tabs.onRemoved     // Remove tab from index
   chrome.tabs.onUpdated     // Update tab title/URL/status
   chrome.tabs.onMoved       // Update tab position in window
   chrome.tabs.onAttached    // Tab moved to different window
   chrome.tabs.onDetached    // Tab removed from window
   
   chrome.windows.onCreated  // Track new windows
   chrome.windows.onRemoved  // Clean up closed windows
   chrome.windows.onFocusChanged // Track active window
   ```

3. **Message Handling**:
   - Listen to `chrome.runtime.onMessage` for UI requests
   - Respond to: search queries, tab actions, index requests

4. **Search Implementation**:
   - Filter tabs by matching against `tab.title` and `tab.url`
   - Case-insensitive substring matching
   - Return results grouped by window

5. **Tab Actions**:
   - **Focus**: `chrome.tabs.update(tabId, { active: true })` + `chrome.windows.update(windowId, { focused: true })`
   - **Close Single**: `chrome.tabs.remove(tabId)`
   - **Close Multiple**: `chrome.tabs.remove([...tabIds])`

### Popup Interface (popup.html/ts)

**Fast-path for quick tab management**

Required features:
- Search input with real-time filtering (send queries to background script)
- Results list showing: tab title, URL (truncated), favicon
- Group results by window with window titles
- Click tab item → focus that tab
- Close button per tab → close that tab
- "Close all results" button → close all tabs in current filter
- Auto-update when tabs change (listen to background messages)

### Dashboard Interface (dashboard.html/ts)

**Full-page power-user interface**

URL: `chrome-extension://<id>/dashboard.html`

Enhanced features:
- Advanced search with multiple filters
- **Select mode**: Checkboxes on each tab for bulk selection
- Bulk actions: "Close selected", "Move selected to new window"
- Visual window grouping with statistics (tab count, etc.)
- Tab previews or thumbnails (if feasible)
- Export/import tab sessions (optional enhancement)

**Why internal page over external site:**
- Privacy: No data leaves the browser
- Security: Full extension API access
- Reliability: No network dependencies
- Performance: Direct background script communication

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build extension for production
- `npm run build:watch` - Build in watch mode for development
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean the dist directory
- `npm run zip` - Build and create extension ZIP file

## Extension APIs

When implementing TabStack features:
- Always use Manifest V3 APIs (avoid deprecated V2 APIs)
- Use `chrome.action` instead of `chrome.browserAction`
- Use service workers (`background.js`) instead of background pages
- **Primary APIs**: `chrome.tabs.*` and `chrome.windows.*`
- Use `chrome.storage.sync` for user preferences (e.g., theme, default view)
- Use `chrome.storage.local` for cached data if needed

### Required Permissions in manifest.json
```json
{
  "permissions": [
    "tabs",      // REQUIRED for all tab operations
    "storage"    // For user preferences
  ]
}
```

**Note**: No host permissions needed - TabStack operates entirely locally

### Key Chrome APIs for TabStack

**Tab Management:**
- `chrome.tabs.query({})` - Get all tabs
- `chrome.tabs.update(tabId, {active: true})` - Focus a tab
- `chrome.tabs.remove(tabIds)` - Close one or many tabs
- `chrome.tabs.get(tabId)` - Get single tab info
- `chrome.tabs.group(options)` - Group tabs (future enhancement)

**Event Listeners (ALL must be implemented):**
```typescript
chrome.tabs.onCreated.addListener((tab) => { /* update index */ })
chrome.tabs.onRemoved.addListener((tabId) => { /* remove from index */ })
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { /* update tab */ })
chrome.tabs.onMoved.addListener((tabId, moveInfo) => { /* reorder */ })
chrome.tabs.onAttached.addListener((tabId, attachInfo) => { /* moved to window */ })
chrome.tabs.onDetached.addListener((tabId, detachInfo) => { /* removed from window */ })

chrome.windows.onCreated.addListener((window) => { /* add window */ })
chrome.windows.onRemoved.addListener((windowId) => { /* remove window */ })
chrome.windows.onFocusChanged.addListener((windowId) => { /* track focus */ })
```

**Window Management:**
- `chrome.windows.update(windowId, {focused: true})` - Focus a window
- `chrome.windows.getAll({populate: true})` - Get all windows with tabs

## Best Practices

### General
- Always handle async operations with proper error handling
- Use `chrome.runtime.onMessage` for communication between background and UI
- Test extension functionality in both Chrome and Edge
- Follow Material Design principles for UI components
- Ensure all user-facing text is clear and accessible

### TabStack-Specific
- **Performance**: Keep tab index in memory for instant search (don't query every time)
- **Sync**: Update index immediately on tab events (no polling)
- **Search**: Use case-insensitive substring matching for best UX
- **Privacy**: Never send tab data to external servers
- **Error Handling**: Handle cases where tabs/windows no longer exist
- **State Management**: Keep background script as single source of truth
- **Debouncing**: Consider debouncing search input to reduce message passing
- **Window Grouping**: Always display tabs grouped by window for clarity

### Data Structures
Recommended in-memory structure in background.ts:
```typescript
interface TabIndex {
  windows: Map<number, WindowData>;
  lastUpdated: number;
}

interface WindowData {
  windowId: number;
  tabs: chrome.tabs.Tab[];
  focused: boolean;
}
```

### Message Protocol
Recommended message types between UI and background:
```typescript
// From UI to Background
type Message = 
  | { type: 'search', query: string }
  | { type: 'focusTab', tabId: number, windowId: number }
  | { type: 'closeTab', tabId: number }
  | { type: 'closeTabs', tabIds: number[] }
  | { type: 'getIndex' }

// From Background to UI
type Response =
  | { type: 'searchResults', results: GroupedTabs }
  | { type: 'indexUpdate', index: TabIndex }
  | { type: 'success' }
  | { type: 'error', message: string }
```

## Security

- Never inject untrusted content into pages
- Validate all data from external sources
- Use Content Security Policy appropriately
- Minimize permissions in manifest.json to only what's needed (tabs, storage only)
- **TabStack-specific**: No content scripts needed - reduces attack surface
- All tab data stays local - never transmitted to external servers
- Sanitize user search input before displaying results (XSS prevention)

## Code Generation Guidelines for TabStack

When generating code for TabStack:
1. **Prioritize type safety**: Use proper TypeScript types for all tab/window data
2. **Error handling**: Always handle cases where tabs/windows may not exist
3. **Browser compatibility**: Test on both Chrome and Edge
4. **Performance**: Optimize for users with 100+ tabs
5. **Real-time sync**: Ensure event listeners update the index immediately
6. **User feedback**: Provide visual feedback for all actions (loading states, confirmations)
7. **Accessibility**: Use semantic HTML and ARIA labels
8. **No external dependencies**: Keep the extension self-contained for privacy

When generating code for this extension, prioritize type safety, error handling, browser compatibility, and privacy.
