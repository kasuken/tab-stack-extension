// Background service worker
console.log('Background script loaded')

// Example: Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)
  
  if (details.reason === 'install') {
    // Set default settings or perform initial setup
    chrome.storage.sync.set({
      extensionEnabled: true,
      theme: 'light'
    })
  }
})

// Example: Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request)
  
  if (request.action === 'getActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] })
    })
    return true // Will respond asynchronously
  }
  
  if (request.action === 'executeAction') {
    // Perform some background action
    console.log('Executing action:', request.data)
    sendResponse({ success: true })
  }
})

// Example: Context menu (if needed)
/*
chrome.contextMenus.create({
  id: "extensionAction",
  title: "Extension Action",
  contexts: ["selection"]
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "extensionAction") {
    // Handle context menu click
    console.log('Context menu clicked:', info.selectionText)
  }
})
*/

export {}
