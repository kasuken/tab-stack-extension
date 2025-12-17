# Chrome/Edge Extension Development Instructions

This is a TypeScript browser extension project built with Vite. When working on this project:

## General Guidelines

- This extension supports both Chrome and Edge browsers using Manifest V3
- All TypeScript files should follow strict typing practices
- Use the Chrome Extension APIs through the `chrome` namespace
- For cross-browser compatibility, consider using `webextension-polyfill`

## Project Structure

- `src/manifest.json` - Extension manifest (Manifest V3)
- `src/background.ts` - Service worker script
- `src/content.ts` - Content script that runs in web pages
- `src/popup.ts` - Popup UI logic
- `src/popup.html` - Popup UI layout
- `src/popup.css` - Popup UI styles
- `src/injected.ts` - Script that runs in page context (optional)
- `src/icons/` - Extension icons directory

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build extension for production
- `npm run build:watch` - Build in watch mode for development
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean the dist directory
- `npm run zip` - Build and create extension ZIP file

## Extension APIs

When suggesting Chrome Extension APIs:
- Always use Manifest V3 APIs (avoid deprecated V2 APIs)
- Use `chrome.action` instead of `chrome.browserAction`
- Use service workers (`background.js`) instead of background pages
- Prefer `chrome.storage.sync` for settings that should sync across devices
- Use `chrome.storage.local` for local-only data

## Best Practices

- Always handle async operations with proper error handling
- Use `chrome.runtime.onMessage` for communication between scripts
- Implement proper permission requests in manifest.json
- Test extension functionality in both Chrome and Edge
- Follow Material Design principles for UI components
- Ensure all user-facing text is clear and accessible

## Security

- Never inject untrusted content into pages
- Validate all data from external sources
- Use Content Security Policy appropriately
- Minimize permissions in manifest.json to only what's needed

When generating code for this extension, prioritize type safety, error handling, and browser compatibility.
