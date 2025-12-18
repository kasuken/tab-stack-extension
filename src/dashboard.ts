// TabStack Dashboard Script
console.log('TabStack dashboard loaded')

interface TabMetadata {
  createdAt: number
  lastAccessed?: number
}

interface WindowData {
  windowId: number
  tabs: chrome.tabs.Tab[]
  focused: boolean
}

interface SearchResponse {
  type: 'searchResults'
  results: WindowData[]
}

interface MetadataResponse {
  type: 'metadata'
  metadata: Record<number, TabMetadata>
}

// DOM elements
const searchInput = document.getElementById('search-input') as HTMLInputElement
const totalTabsStat = document.getElementById('total-tabs-stat') as HTMLSpanElement
const totalWindowsStat = document.getElementById('total-windows-stat') as HTMLSpanElement
const addToFavoritesBtn = document.getElementById('add-to-favorites-btn') as HTMLButtonElement
const selectModeBtn = document.getElementById('select-mode-btn') as HTMLButtonElement
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement
const bulkActionsBar = document.getElementById('bulk-actions-bar') as HTMLDivElement
const selectedCount = document.getElementById('selected-count') as HTMLSpanElement
const closeSelectedBtn = document.getElementById('close-selected-btn') as HTMLButtonElement
const moveToNewWindowBtn = document.getElementById('move-to-new-window-btn') as HTMLButtonElement
const deselectAllBtn = document.getElementById('deselect-all-btn') as HTMLButtonElement
const resultsContainer = document.getElementById('results-container') as HTMLDivElement
const emptyState = document.getElementById('empty-state') as HTMLDivElement

// State
let currentResults: WindowData[] = []
let searchQuery = ''
let selectModeActive = false
let selectedTabIds = new Set<number>()
let tabMetadata: Record<number, TabMetadata> = {}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await loadMetadata()
  await performSearch('')
  setupEventListeners()
})

// Load tab metadata
async function loadMetadata(): Promise<void> {
  try {
    const response = await sendMessage({ type: 'getMetadata' }) as MetadataResponse
    if (response && response.metadata) {
      tabMetadata = response.metadata
      console.log('Loaded metadata for', Object.keys(tabMetadata).length, 'tabs')
    } else {
      console.warn('No metadata received from background script')
    }
  } catch (error) {
    console.error('Error loading metadata:', error)
  }
}

// Setup event listeners
function setupEventListeners(): void {
  // Refresh data when dashboard comes into focus
  window.addEventListener('focus', async () => {
    console.log('Dashboard focused - refreshing data')
    await loadMetadata()
    await performSearch(searchQuery)
  })
  
  // Also listen for visibility change (when tab becomes visible)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('Dashboard visible - refreshing data')
      await loadMetadata()
      await performSearch(searchQuery)
    }
  })
  
  // Debounced search
  let searchTimeout: number
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(() => {
      searchQuery = searchInput.value
      performSearch(searchQuery)
    }, 200)
  })
  
  // Select mode toggle
  selectModeBtn.addEventListener('click', () => {
    selectModeActive = !selectModeActive
    selectModeBtn.classList.toggle('active', selectModeActive)
    
    if (selectModeActive) {
      selectModeBtn.innerHTML = '<span class="btn-icon">☑️</span> Exit Select Mode'
    } else {
      selectModeBtn.innerHTML = '<span class="btn-icon">☑️</span> Select Mode'
      selectedTabIds.clear()
      updateBulkActionsBar()
    }
    
    renderResults(currentResults, searchQuery)
  })
  
  // Add to Favorites
  addToFavoritesBtn.addEventListener('click', async () => {
    const tabIds = Array.from(selectedTabIds)
    if (tabIds.length > 2) {
      await addTabsToFavorites(tabIds)
    }
  })
  
  // Refresh
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.classList.add('spinning')
    await loadMetadata()
    await performSearch(searchQuery)
    setTimeout(() => refreshBtn.classList.remove('spinning'), 500)
  })
  
  // Bulk actions
  closeSelectedBtn.addEventListener('click', async () => {
    const count = selectedTabIds.size
    if (count > 0 && confirm(`Close ${count} selected tab(s)?`)) {
      await sendMessage({ type: 'closeTabs', tabIds: Array.from(selectedTabIds) })
      selectedTabIds.clear()
      await loadMetadata()
      await performSearch(searchQuery)
    }
  })
  
  moveToNewWindowBtn.addEventListener('click', async () => {
    const tabIds = Array.from(selectedTabIds)
    if (tabIds.length > 0) {
      try {
        // Create new window with first tab
        const firstTabId = tabIds[0]
        const newWindow = await chrome.windows.create({ tabId: firstTabId })
        
        // Move remaining tabs to new window
        if (tabIds.length > 1 && newWindow && newWindow.id) {
          for (let i = 1; i < tabIds.length; i++) {
            await chrome.tabs.move(tabIds[i], { windowId: newWindow.id, index: i })
          }
        }
        
        selectedTabIds.clear()
        await performSearch(searchQuery)
      } catch (error) {
        console.error('Error moving tabs to new window:', error)
        alert('Error moving tabs. Some tabs may be pinned or restricted.')
      }
    }
  })
  
  deselectAllBtn.addEventListener('click', () => {
    selectedTabIds.clear()
    updateBulkActionsBar()
    renderResults(currentResults, searchQuery)
  })
}

// Perform search
async function performSearch(query: string): Promise<void> {
  try {
    const response = await sendMessage({ type: 'search', query }) as SearchResponse
    if (response && response.results) {
      currentResults = response.results
      renderResults(response.results, query)
      updateStats(response.results)
    }
  } catch (error) {
    console.error('Error searching tabs:', error)
  }
}

// Update stats
function updateStats(results: WindowData[]): void {
  const totalTabs = results.reduce((sum, w) => sum + w.tabs.length, 0)
  const totalWindows = results.length
  
  totalTabsStat.textContent = `${totalTabs} tab${totalTabs !== 1 ? 's' : ''}`
  totalWindowsStat.textContent = `${totalWindows} window${totalWindows !== 1 ? 's' : ''}`
}

// Update bulk actions bar
function updateBulkActionsBar(): void {
  const count = selectedTabIds.size
  
  if (count > 0) {
    bulkActionsBar.style.display = 'flex'
    selectedCount.textContent = `${count} tab${count !== 1 ? 's' : ''} selected`
  } else {
    bulkActionsBar.style.display = 'none'
  }
  
  // Show/hide Add to Favorites button
  if (count > 2) {
    addToFavoritesBtn.style.display = 'flex'
  } else {
    addToFavoritesBtn.style.display = 'none'
  }
}

// Render results
function renderResults(results: WindowData[], query: string): void {
  const totalTabs = results.reduce((sum, w) => sum + w.tabs.length, 0)
  
  // Clear previous results
  resultsContainer.innerHTML = ''
  
  if (totalTabs === 0) {
    emptyState.style.display = 'flex'
    resultsContainer.style.display = 'none'
    return
  }
  
  emptyState.style.display = 'none'
  resultsContainer.style.display = 'block'
  
  // Render each window
  results.forEach((windowData, index) => {
    // Sort tabs by most recently accessed/opened (most recent first)
    const sortedWindowData = {
      ...windowData,
      tabs: [...windowData.tabs].sort((a, b) => {
        const aMetadata = a.id ? tabMetadata[a.id] : null
        const bMetadata = b.id ? tabMetadata[b.id] : null
        
        // Get the most recent timestamp for each tab (lastAccessed or createdAt)
        const aTime = aMetadata?.lastAccessed || aMetadata?.createdAt || 0
        const bTime = bMetadata?.lastAccessed || bMetadata?.createdAt || 0
        
        // Sort descending (most recent first)
        return bTime - aTime
      })
    }
    
    const windowCard = createWindowCard(sortedWindowData, index)
    resultsContainer.appendChild(windowCard)
  })
}

// Create window card
function createWindowCard(windowData: WindowData, index: number): HTMLElement {
  const windowCard = document.createElement('div')
  windowCard.className = 'window-card'
  
  // Window header
  const windowHeader = document.createElement('div')
  windowHeader.className = 'window-card-header'
  
  const focusIndicator = windowData.focused ? '🔵' : '⚪'
  const tabCount = windowData.tabs.length
  
  windowHeader.innerHTML = `
    <div class="window-header-left">
      <span class="window-indicator">${focusIndicator}</span>
      <h2 class="window-title">Window ${index + 1}</h2>
      <span class="window-tab-count">${tabCount} tab${tabCount !== 1 ? 's' : ''}</span>
    </div>
    <div class="window-header-actions">
      ${selectModeActive ? `
        <button class="window-action-btn" data-action="select-all" data-window-id="${windowData.windowId}">
          Select All
        </button>
      ` : ''}
      <button class="window-action-btn danger" data-action="close-window" data-window-id="${windowData.windowId}">
        Close Window
      </button>
    </div>
  `
  
  // Window actions
  const selectAllBtn = windowHeader.querySelector('[data-action="select-all"]') as HTMLButtonElement
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      windowData.tabs.forEach(tab => {
        if (tab.id) selectedTabIds.add(tab.id)
      })
      updateBulkActionsBar()
      renderResults(currentResults, searchQuery)
    })
  }
  
  const closeWindowBtn = windowHeader.querySelector('[data-action="close-window"]') as HTMLButtonElement
  closeWindowBtn.addEventListener('click', async () => {
    if (confirm(`Close all ${tabCount} tabs in this window?`)) {
      await chrome.windows.remove(windowData.windowId)
      await loadMetadata()
      await performSearch(searchQuery)
    }
  })
  
  windowCard.appendChild(windowHeader)
  
  // Tabs grid
  const tabsGrid = document.createElement('div')
  tabsGrid.className = 'tabs-grid'
  
  windowData.tabs.forEach(tab => {
    const tabCard = createTabCard(tab)
    tabsGrid.appendChild(tabCard)
  })
  
  windowCard.appendChild(tabsGrid)
  
  return windowCard
}

// Create tab card
function createTabCard(tab: chrome.tabs.Tab): HTMLElement {
  const tabCard = document.createElement('div')
  tabCard.className = 'tab-card'
  
  const isSelected = tab.id ? selectedTabIds.has(tab.id) : false
  if (isSelected) {
    tabCard.classList.add('selected')
  }
  
  const favicon = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="14" font-size="14">📄</text></svg>'
  
  // Get metadata for this tab
  const metadata = tab.id ? tabMetadata[tab.id] : null
  const tabAge = metadata ? formatTimeAgo(metadata.createdAt) : null
  const lastAccessed = metadata?.lastAccessed ? formatTimeAgo(metadata.lastAccessed) : null
  
  // Debug logging
  if (tab.id) {
    if (!metadata) {
      console.log('❌ No metadata for tab', tab.id, tab.title)
    } else {
      console.log('✅ Tab', tab.id, 'metadata:', { tabAge, lastAccessed, createdAt: new Date(metadata.createdAt).toISOString() })
    }
  }
  
  // Build badges
  const badges: string[] = []
  if (tab.pinned) badges.push('<span class="tab-badge pinned" title="Pinned">📌</span>')
  if (tab.audible) badges.push('<span class="tab-badge audio" title="Playing audio">🔊</span>')
  if (tab.mutedInfo?.muted) badges.push('<span class="tab-badge muted" title="Muted">🔇</span>')
  if (tab.discarded) badges.push('<span class="tab-badge discarded" title="Discarded (memory saved)">💤</span>')
  
  tabCard.innerHTML = `
    ${selectModeActive ? `
      <div class="tab-checkbox-container">
        <input type="checkbox" class="tab-checkbox" ${isSelected ? 'checked' : ''}>
      </div>
    ` : ''}
    <div class="tab-card-content">
      <img class="tab-card-favicon" src="${favicon}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>📄</text></svg>'">
      <div class="tab-card-info">
        <div class="tab-card-title">${escapeHtml(tab.title || 'Untitled')}</div>
        <div class="tab-card-url">${escapeHtml(truncateUrl(tab.url || '', 50))}</div>
        <div class="tab-card-meta">
          ${tabAge ? `<span class="meta-item" title="Opened ${tabAge}">⏱️ ${tabAge}</span>` : `<span class="meta-item" title="No timing data">⏱️ N/A</span>`}
          ${lastAccessed && !tab.active ? `<span class="meta-item" title="Last accessed ${lastAccessed}">👁️ ${lastAccessed}</span>` : ''}
          ${badges.length > 0 ? `<span class="tab-badges">${badges.join('')}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="tab-card-actions">
      <button class="tab-action-btn" title="Focus tab" data-action="focus">
        👁️
      </button>
      <button class="tab-action-btn danger" title="Close tab" data-action="close">
        ✕
      </button>
    </div>
  `
  
  // Checkbox handling
  if (selectModeActive) {
    const checkbox = tabCard.querySelector('.tab-checkbox') as HTMLInputElement
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation()
      if (tab.id) {
        if (checkbox.checked) {
          selectedTabIds.add(tab.id)
          tabCard.classList.add('selected')
        } else {
          selectedTabIds.delete(tab.id)
          tabCard.classList.remove('selected')
        }
        updateBulkActionsBar()
      }
    })
    
    // Click card to toggle checkbox
    tabCard.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.tab-action-btn')) {
        checkbox.checked = !checkbox.checked
        checkbox.dispatchEvent(new Event('change'))
      }
    })
  } else {
    // Click to focus in non-select mode
    tabCard.addEventListener('click', async (e) => {
      if (!(e.target as HTMLElement).closest('.tab-action-btn')) {
        await sendMessage({ type: 'focusTab', tabId: tab.id, windowId: tab.windowId })
      }
    })
  }
  
  // Focus button
  const focusBtn = tabCard.querySelector('[data-action="focus"]') as HTMLButtonElement
  focusBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    await sendMessage({ type: 'focusTab', tabId: tab.id, windowId: tab.windowId })
  })
  
  // Close button
  const closeBtn = tabCard.querySelector('[data-action="close"]') as HTMLButtonElement
  closeBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    await sendMessage({ type: 'closeTab', tabId: tab.id })
    
    // Remove from metadata
    if (tab.id) {
      delete tabMetadata[tab.id]
    }
    
    tabCard.remove()
    
    // Update results
    currentResults = currentResults.map(w => ({
      ...w,
      tabs: w.tabs.filter(t => t.id !== tab.id)
    })).filter(w => w.tabs.length > 0)
    
    updateStats(currentResults)
    
    if (tab.id) {
      selectedTabIds.delete(tab.id)
      updateBulkActionsBar()
    }
  })
  
  return tabCard
}

// Send message to background script
async function sendMessage(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(response)
      }
    })
  })
}

// Utility functions
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function truncateUrl(url: string, maxLength: number): string {
  try {
    const urlObj = new URL(url)
    const display = urlObj.hostname + urlObj.pathname + urlObj.search
    return display.length > maxLength ? display.substring(0, maxLength) + '...' : display
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url
  }
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  
  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  return `${months}mo ago`
}

// Add tabs to favorites (bookmarks)
async function addTabsToFavorites(tabIds: number[]): Promise<void> {
  try {
    console.log('Requesting background script to add tabs to favorites:', tabIds)
    
    const response = await sendMessage({ type: 'addToFavorites', tabIds })
    console.log('Response from background:', response)
    
    if (!response) {
      throw new Error('No response from background script')
    }
    
    if (response.type === 'error') {
      console.error('Error response:', response)
      throw new Error(response.message || 'Unknown error from background script')
    }
    
    if (response.type === 'success') {
      const { addedCount, skippedCount, dateFolder } = response
      
      if (addedCount > 0) {
        alert(`✅ Added ${addedCount} tab${addedCount !== 1 ? 's' : ''} to favorites\n\nLocation: TabStack/${dateFolder}${skippedCount > 0 ? `\n\n(Skipped ${skippedCount} system page${skippedCount !== 1 ? 's' : ''})` : ''}`)
        
        // Clear selection
        selectedTabIds.clear()
        updateBulkActionsBar()
        renderResults(currentResults, searchQuery)
      } else {
        alert('⚠️ No valid tabs to bookmark (system pages cannot be bookmarked)')
      }
    } else {
      throw new Error(`Unexpected response type: ${response.type}`)
    }
  } catch (error) {
    console.error('Error adding tabs to favorites:', error)
    let errorMessage = 'Unknown error'
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error, null, 2)
    }
    
    alert(`❌ Error adding tabs to favorites:\n${errorMessage}\n\nCheck browser console (F12) for details.`)
  }
}

export {}
