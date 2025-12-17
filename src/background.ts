// TabStack Background Service Worker
console.log('TabStack background script loaded')

// Tab index data structure
interface WindowData {
  windowId: number
  tabs: chrome.tabs.Tab[]
  focused: boolean
}

interface TabIndex {
  windows: Map<number, WindowData>
  lastUpdated: number
}

// In-memory tab index
const tabIndex: TabIndex = {
  windows: new Map<number, WindowData>(),
  lastUpdated: Date.now()
}

// Initialize tab index on startup
initializeTabIndex()

async function initializeTabIndex(): Promise<void> {
  try {
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] })
    
    for (const window of windows) {
      tabIndex.windows.set(window.id!, {
        windowId: window.id!,
        tabs: window.tabs || [],
        focused: window.focused || false
      })
    }
    
    tabIndex.lastUpdated = Date.now()
    console.log('Tab index initialized:', tabIndex.windows.size, 'windows')
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
    tabIndex.lastUpdated = Date.now()
  }
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const windowData = tabIndex.windows.get(removeInfo.windowId)
  if (windowData) {
    windowData.tabs = windowData.tabs.filter(tab => tab.id !== tabId)
    tabIndex.lastUpdated = Date.now()
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.windowId && tabIndex.windows.has(tab.windowId)) {
    const windowData = tabIndex.windows.get(tab.windowId)!
    const tabIndex2 = windowData.tabs.findIndex(t => t.id === tabId)
    if (tabIndex2 !== -1) {
      windowData.tabs[tabIndex2] = tab
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
})

export {}
