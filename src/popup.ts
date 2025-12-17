// TabStack Popup Script
console.log('TabStack popup loaded')

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
const resultsCount = document.getElementById('results-count') as HTMLSpanElement
const closeAllBtn = document.getElementById('close-all-btn') as HTMLButtonElement
const resultsContainer = document.getElementById('results-container') as HTMLDivElement
const openDashboardBtn = document.getElementById('open-dashboard-btn') as HTMLButtonElement

let currentResults: WindowData[] = []
let searchQuery = ''

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await performSearch('')
  setupEventListeners()
})

// Setup event listeners
function setupEventListeners(): void {
  // Dashboard button
  openDashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
  })
  
  // Debounced search
  let searchTimeout: number
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout)
    searchTimeout = window.setTimeout(() => {
      searchQuery = searchInput.value
      performSearch(searchQuery)
    }, 150)
  })
  
  // Close all results
  closeAllBtn.addEventListener('click', async () => {
    const tabIds = currentResults.flatMap(w => w.tabs.map(t => t.id!).filter(id => id !== undefined))
    if (tabIds.length > 0 && confirm(`Close ${tabIds.length} tab(s)?`)) {
      await sendMessage({ type: 'closeTabs', tabIds })
    }
  })
}

// Perform search
async function performSearch(query: string): Promise<void> {
  try {
    const response = await sendMessage({ type: 'search', query }) as SearchResponse
    if (response && response.results) {
      currentResults = response.results
      renderResults(response.results, query)
    }
  } catch (error) {
    console.error('Error searching tabs:', error)
    resultsCount.textContent = 'Error loading tabs'
  }
}

// Render search results
function renderResults(results: WindowData[], query: string): void {
  const totalTabs = results.reduce((sum, w) => sum + w.tabs.length, 0)
  
  // Update header
  if (query) {
    resultsCount.textContent = `Found ${totalTabs} tab(s)`
    closeAllBtn.style.display = totalTabs > 0 ? 'block' : 'none'
  } else {
    resultsCount.textContent = `${totalTabs} tab(s) across ${results.length} window(s)`
    closeAllBtn.style.display = 'none'
  }
  
  // Clear previous results
  resultsContainer.innerHTML = ''
  
  if (totalTabs === 0) {
    resultsContainer.innerHTML = '<div class="no-results">No tabs found</div>'
    return
  }
  
  // Render each window
  results.forEach((windowData, index) => {
    const windowDiv = document.createElement('div')
    windowDiv.className = 'window-group'
    
    const windowHeader = document.createElement('div')
    windowHeader.className = 'window-header'
    windowHeader.innerHTML = `
      <span class="window-title">
        ${windowData.focused ? '🔵' : '⚪'} Window ${index + 1}
        <span class="tab-count">(${windowData.tabs.length} tabs)</span>
      </span>
    `
    windowDiv.appendChild(windowHeader)
    
    // Render tabs
    windowData.tabs.forEach(tab => {
      const tabItem = createTabItem(tab)
      windowDiv.appendChild(tabItem)
    })
    
    resultsContainer.appendChild(windowDiv)
  })
}

// Create tab item element
function createTabItem(tab: chrome.tabs.Tab): HTMLElement {
  const tabDiv = document.createElement('div')
  tabDiv.className = 'tab-item'
  
  const favicon = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="14" font-size="14">📄</text></svg>'
  
  tabDiv.innerHTML = `
    <img class="tab-favicon" src="${favicon}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><text y=%2214%22 font-size=%2214%22>📄</text></svg>'">
    <div class="tab-info">
      <div class="tab-title">${escapeHtml(tab.title || 'Untitled')}</div>
      <div class="tab-url">${escapeHtml(truncateUrl(tab.url || ''))}</div>
    </div>
    <button class="tab-close-btn" title="Close tab">✕</button>
  `
  
  // Click to focus tab
  tabDiv.addEventListener('click', async (e) => {
    if (!(e.target as HTMLElement).classList.contains('tab-close-btn')) {
      await sendMessage({ type: 'focusTab', tabId: tab.id, windowId: tab.windowId })
      window.close()
    }
  })
  
  // Close button
  const closeBtn = tabDiv.querySelector('.tab-close-btn') as HTMLButtonElement
  closeBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    await sendMessage({ type: 'closeTab', tabId: tab.id })
    tabDiv.remove()
    
    // Update count
    currentResults = currentResults.map(w => ({
      ...w,
      tabs: w.tabs.filter(t => t.id !== tab.id)
    })).filter(w => w.tabs.length > 0)
    
    const totalTabs = currentResults.reduce((sum, w) => sum + w.tabs.length, 0)
    if (searchQuery) {
      resultsCount.textContent = `Found ${totalTabs} tab(s)`
    } else {
      resultsCount.textContent = `${totalTabs} tab(s) across ${currentResults.length} window(s)`
    }
  })
  
  return tabDiv
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

function truncateUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search
    return urlObj.hostname + (path.length > 40 ? path.substring(0, 40) + '...' : path)
  } catch {
    return url.length > 60 ? url.substring(0, 60) + '...' : url
  }
}

export {}
