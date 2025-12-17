// TabStack Dashboard Script
console.log('TabStack dashboard loaded')

interface WindowData {
  windowId: number
  tabs: chrome.tabs.Tab[]
  focused: boolean
}

interface SearchResponse {
  type: 'searchResults'
  results: WindowData[]
}

// DOM elements
const searchInput = document.getElementById('search-input') as HTMLInputElement
const totalTabsStat = document.getElementById('total-tabs-stat') as HTMLSpanElement
const totalWindowsStat = document.getElementById('total-windows-stat') as HTMLSpanElement
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await performSearch('')
  setupEventListeners()
})

// Setup event listeners
function setupEventListeners(): void {
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
  
  // Refresh
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.classList.add('spinning')
    await performSearch(searchQuery)
    setTimeout(() => refreshBtn.classList.remove('spinning'), 500)
  })
  
  // Bulk actions
  closeSelectedBtn.addEventListener('click', async () => {
    const count = selectedTabIds.size
    if (count > 0 && confirm(`Close ${count} selected tab(s)?`)) {
      await sendMessage({ type: 'closeTabs', tabIds: Array.from(selectedTabIds) })
      selectedTabIds.clear()
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
    const windowCard = createWindowCard(windowData, index)
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

export {}
