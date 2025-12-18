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
  // Keep service worker alive for async operations
  (async () => {
    try {
      if (request.type === 'search') {
        const results = searchTabs(request.query)
        sendResponse({ type: 'searchResults', results })
        return
      }
      
      if (request.type === 'focusTab') {
        await chrome.tabs.update(request.tabId, { active: true })
        await chrome.windows.update(request.windowId, { focused: true })
        sendResponse({ type: 'success' })
        return
      }
      
      if (request.type === 'closeTab') {
        await chrome.tabs.remove(request.tabId)
        sendResponse({ type: 'success' })
        return
      }
      
      if (request.type === 'closeTabs') {
        await chrome.tabs.remove(request.tabIds)
        sendResponse({ type: 'success' })
        return
      }
      
      if (request.type === 'getIndex') {
        const results = Array.from(tabIndex.windows.values())
        sendResponse({ type: 'indexUpdate', results })
        return
      }
      
      if (request.type === 'getMetadata') {
        const metadata: Record<number, TabMetadata> = {}
        tabMetadata.forEach((value, key) => {
          metadata[key] = value
        })
        console.log('Sending metadata for', Object.keys(metadata).length, 'tabs')
        sendResponse({ type: 'metadata', metadata })
        return
      }
      
      if (request.type === 'addToFavorites') {
        console.log('Background received addToFavorites request:', request.tabIds)
        try {
          const result = await addTabsToFavorites(request.tabIds)
          console.log('addTabsToFavorites succeeded:', result)
          sendResponse({ type: 'success', ...result })
        } catch (error) {
          console.error('addTabsToFavorites failed:', error)
          const errorMessage = error instanceof Error ? error.message : String(error)
          sendResponse({ type: 'error', message: errorMessage })
        }
        return
      }
    } catch (error) {
      console.error('Message handler error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      sendResponse({ type: 'error', message: errorMessage })
    }
  })()
  
  // Return true to indicate async response
  return true
})

// Add tabs to favorites (bookmarks)
async function addTabsToFavorites(tabIds: number[]): Promise<{ addedCount: number, skippedCount: number, dateFolder: string }> {
  console.log('Starting addTabsToFavorites with tabIds:', tabIds)
  
  // Get all tabs info
  const tabs: chrome.tabs.Tab[] = []
  for (const tabId of tabIds) {
    try {
      const tab = await chrome.tabs.get(tabId)
      tabs.push(tab)
    } catch (error) {
      console.error(`Tab ${tabId} not found:`, error)
    }
  }
  
  console.log('Retrieved tabs:', tabs.length)
  
  if (tabs.length === 0) {
    throw new Error('No valid tabs to add to favorites')
  }
  
  // Format date as yyyy-mm-dd
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateFolder = `${year}-${month}-${day}`
  
  console.log('Date folder:', dateFolder)
  
  // Find or create TabStack folder
  const bookmarksTree = await chrome.bookmarks.getTree()
  console.log('Bookmarks tree retrieved:', bookmarksTree)
  
  // Get the second folder (index 1) from root, which is typically "Other Bookmarks"
  // Root structure: children[0]=bookmarks bar, children[1]=other bookmarks, children[2]=mobile bookmarks
  let otherBookmarksId: string | undefined
  
  if (bookmarksTree[0] && bookmarksTree[0].children && bookmarksTree[0].children.length > 1) {
    const otherBookmarksNode = bookmarksTree[0].children[1]
    otherBookmarksId = otherBookmarksNode.id
    console.log('Found second bookmarks folder:', otherBookmarksNode.title, 'ID:', otherBookmarksId)
  }
  
  if (!otherBookmarksId) {
    throw new Error('Could not find Other Bookmarks folder')
  }
  
  console.log('Using folder ID:', otherBookmarksId)
  
  // Search for existing TabStack folder
  let tabStackFolder: chrome.bookmarks.BookmarkTreeNode | null = null
  const otherBookmarksChildren = await chrome.bookmarks.getChildren(otherBookmarksId)
  console.log('Folder children:', otherBookmarksChildren)
  
  tabStackFolder = otherBookmarksChildren.find(node => node.title === 'TabStack' && !node.url) || null
  
  // Create TabStack folder if it doesn't exist
  if (!tabStackFolder) {
    console.log('Creating TabStack folder')
    tabStackFolder = await chrome.bookmarks.create({
      parentId: otherBookmarksId,
      title: 'TabStack'
    })
    console.log('Created TabStack folder:', tabStackFolder)
  } else {
    console.log('Found existing TabStack folder:', tabStackFolder)
  }
  
  if (!tabStackFolder || !tabStackFolder.id) {
    throw new Error('Failed to create or find TabStack folder')
  }
  
  // Find or create date folder
  const tabStackContents = await chrome.bookmarks.getChildren(tabStackFolder.id)
  console.log('TabStack contents:', tabStackContents)
  
  let dateNode = tabStackContents.find(node => node.title === dateFolder && !node.url) || null
  
  if (!dateNode) {
    console.log('Creating date folder:', dateFolder)
    dateNode = await chrome.bookmarks.create({
      parentId: tabStackFolder.id,
      title: dateFolder
    })
    console.log('Created date folder:', dateNode)
  } else {
    console.log('Found existing date folder:', dateNode)
  }
  
  if (!dateNode || !dateNode.id) {
    throw new Error('Failed to create or find date folder')
  }
  
  // Add each tab as a bookmark
  let addedCount = 0
  let skippedCount = 0
  
  for (const tab of tabs) {
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('edge://')) {
      try {
        await chrome.bookmarks.create({
          parentId: dateNode.id,
          title: tab.title || 'Untitled',
          url: tab.url
        })
        addedCount++
        console.log('Added bookmark:', tab.title)
      } catch (err) {
        console.error('Error creating bookmark for tab:', tab.title, err)
        skippedCount++
      }
    } else {
      console.log('Skipping system page:', tab.url)
      skippedCount++
    }
  }
  
  console.log(`Added ${addedCount} bookmarks, skipped ${skippedCount}`)
  
  return { addedCount, skippedCount, dateFolder }
}

export {}
