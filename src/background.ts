// TabStack Background Service Worker
console.log('TabStack background script loaded')

// Tab index data structure
interface TabMetadata {
  createdAt: number
  lastAccessed?: number
}

interface WindowData {
  windowId: number
  tabs: chrome.tabs.Tab[]
  focused: boolean
}

interface TabIndex {
  windows: Map<number, WindowData>
  lastUpdated: number
}

// In-memory tab index and metadata
const tabIndex: TabIndex = {
  windows: new Map<number, WindowData>(),
  lastUpdated: Date.now()
}

// Track tab metadata (creation time, etc.)
const tabMetadata = new Map<number, TabMetadata>()

// Initialize tab index on startup
initializeTabIndex()

async function initializeTabIndex(): Promise<void> {
  try {
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] })
    const now = Date.now()
    
    for (const window of windows) {
      const tabs = window.tabs || []
      
      // Initialize metadata for existing tabs
      tabs.forEach(tab => {
        if (tab.id && !tabMetadata.has(tab.id)) {
          tabMetadata.set(tab.id, {
            createdAt: now,
            lastAccessed: tab.active ? now : undefined
          })
        }
      })
      
      tabIndex.windows.set(window.id!, {
        windowId: window.id!,
        tabs,
        focused: window.focused || false
      })
    }
    
    tabIndex.lastUpdated = Date.now()
    console.log('Tab index initialized:', tabIndex.windows.size, 'windows')
    console.log('Tab metadata initialized for', tabMetadata.size, 'tabs')
  } catch (error) {
    console.error('Error initializing tab index:', error)
  }
}

// Search tabs by title and URL
function searchTabs(query: string): WindowData[] {
  if (!query.trim()) {
    return Array.from(tabIndex.windows.values())
  }
  
  const lowerQuery = query.toLowerCase()
  const results: WindowData[] = []
  
  for (const windowData of tabIndex.windows.values()) {
    const matchingTabs = windowData.tabs.filter(tab => {
      const titleMatch = tab.title?.toLowerCase().includes(lowerQuery)
      const urlMatch = tab.url?.toLowerCase().includes(lowerQuery)
      return titleMatch || urlMatch
    })
    
    if (matchingTabs.length > 0) {
      results.push({
        windowId: windowData.windowId,
        tabs: matchingTabs,
        focused: windowData.focused
      })
    }
  }
  
  return results
}

// Tab event listeners
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.windowId && tabIndex.windows.has(tab.windowId)) {
    const windowData = tabIndex.windows.get(tab.windowId)!
    windowData.tabs.push(tab)
    
    // Track creation time
    if (tab.id) {
      tabMetadata.set(tab.id, {
        createdAt: Date.now(),
        lastAccessed: tab.active ? Date.now() : undefined
      })
    }
    
    tabIndex.lastUpdated = Date.now()
  }
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const windowData = tabIndex.windows.get(removeInfo.windowId)
  if (windowData) {
    windowData.tabs = windowData.tabs.filter(tab => tab.id !== tabId)
    tabIndex.lastUpdated = Date.now()
  }
  
  // Clean up metadata
  tabMetadata.delete(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.windowId && tabIndex.windows.has(tab.windowId)) {
    const windowData = tabIndex.windows.get(tab.windowId)!
    const tabIdx = windowData.tabs.findIndex(t => t.id === tabId)
    if (tabIdx !== -1) {
      windowData.tabs[tabIdx] = tab
      
      // Update last accessed time if tab became active
      if (tab.active) {
        const metadata = tabMetadata.get(tabId)
        if (metadata) {
          metadata.lastAccessed = Date.now()
        }
      }
      
      tabIndex.lastUpdated = Date.now()
    }
  }
})

chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
  const windowData = tabIndex.windows.get(moveInfo.windowId)
  if (windowData) {
    const tabIdx = windowData.tabs.findIndex(t => t.id === tabId)
    if (tabIdx !== -1) {
      const [tab] = windowData.tabs.splice(tabIdx, 1)
      windowData.tabs.splice(moveInfo.toIndex, 0, tab)
      tabIndex.lastUpdated = Date.now()
    }
  }
})

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  chrome.tabs.get(tabId).then(tab => {
    const windowData = tabIndex.windows.get(attachInfo.newWindowId)
    if (windowData) {
      windowData.tabs.splice(attachInfo.newPosition, 0, tab)
      tabIndex.lastUpdated = Date.now()
    }
  })
})

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  const windowData = tabIndex.windows.get(detachInfo.oldWindowId)
  if (windowData) {
    windowData.tabs = windowData.tabs.filter(tab => tab.id !== tabId)
    tabIndex.lastUpdated = Date.now()
  }
})

// Window event listeners
chrome.windows.onCreated.addListener((window) => {
  if (window.id && window.type === 'normal') {
    tabIndex.windows.set(window.id, {
      windowId: window.id,
      tabs: [],
      focused: window.focused || false
    })
    tabIndex.lastUpdated = Date.now()
  }
})

chrome.windows.onRemoved.addListener((windowId) => {
  tabIndex.windows.delete(windowId)
  tabIndex.lastUpdated = Date.now()
})

chrome.windows.onFocusChanged.addListener((windowId) => {
  for (const windowData of tabIndex.windows.values()) {
    windowData.focused = windowData.windowId === windowId
  }
  tabIndex.lastUpdated = Date.now()
})

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'search') {
    const results = searchTabs(request.query)
    sendResponse({ type: 'searchResults', results })
    return true
  }
  
  if (request.type === 'focusTab') {
    chrome.tabs.update(request.tabId, { active: true })
      .then(() => chrome.windows.update(request.windowId, { focused: true }))
      .then(() => sendResponse({ type: 'success' }))
      .catch(error => sendResponse({ type: 'error', message: error.message }))
    return true
  }
  
  if (request.type === 'closeTab') {
    chrome.tabs.remove(request.tabId)
      .then(() => sendResponse({ type: 'success' }))
      .catch(error => sendResponse({ type: 'error', message: error.message }))
    return true
  }
  
  if (request.type === 'closeTabs') {
    chrome.tabs.remove(request.tabIds)
      .then(() => sendResponse({ type: 'success' }))
      .catch(error => sendResponse({ type: 'error', message: error.message }))
    return true
  }
  
  if (request.type === 'getIndex') {
    const results = Array.from(tabIndex.windows.values())
    sendResponse({ type: 'indexUpdate', results })
    return true
  }
  
  if (request.type === 'getMetadata') {
    const metadata: Record<number, TabMetadata> = {}
    tabMetadata.forEach((value, key) => {
      metadata[key] = value
    })
    console.log('Sending metadata for', Object.keys(metadata).length, 'tabs')
    sendResponse({ type: 'metadata', metadata })
    return true
  }
})

export {}
