// Popup script
console.log('Popup script loaded')

interface TabInfo {
  title: string
  url: string
  selectedText: string
}

interface StorageData {
  extensionEnabled?: boolean
  theme?: string
}

// DOM elements
const tabInfoDiv = document.getElementById('tab-info') as HTMLDivElement
const highlightBtn = document.getElementById('highlight-btn') as HTMLButtonElement
const getInfoBtn = document.getElementById('get-info-btn') as HTMLButtonElement
const enabledCheckbox = document.getElementById('enabled-checkbox') as HTMLInputElement
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement
const statusDiv = document.getElementById('status') as HTMLDivElement

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings()
  await getCurrentTabInfo()
  setupEventListeners()
})

// Load settings from storage
async function loadSettings(): Promise<void> {
  try {
    const data = await chrome.storage.sync.get(['extensionEnabled', 'theme']) as StorageData
    
    enabledCheckbox.checked = data.extensionEnabled !== false
    themeSelect.value = data.theme || 'light'
    
    // Apply theme
    applyTheme(data.theme || 'light')
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

// Get current tab information
async function getCurrentTabInfo(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]
    
    if (currentTab) {
      const tabInfo = `
        <strong>Title:</strong> ${currentTab.title}<br>
        <strong>URL:</strong> ${currentTab.url}<br>
        <strong>ID:</strong> ${currentTab.id}
      `
      tabInfoDiv.innerHTML = tabInfo
    }
  } catch (error) {
    console.error('Error getting tab info:', error)
    tabInfoDiv.textContent = 'Error loading tab information'
  }
}

// Setup event listeners
function setupEventListeners(): void {
  highlightBtn.addEventListener('click', async () => {
    await sendMessageToActiveTab('highlightText')
    showStatus('Text highlighting triggered!', 'success')
  })
  
  getInfoBtn.addEventListener('click', async () => {
    const response = await sendMessageToActiveTab('getPageInfo') as TabInfo
    if (response) {
      const info = `
        <strong>Title:</strong> ${response.title}<br>
        <strong>URL:</strong> ${response.url}<br>
        <strong>Selected:</strong> ${response.selectedText || 'None'}
      `
      tabInfoDiv.innerHTML = info
      showStatus('Page info updated!', 'success')
    }
  })
  
  enabledCheckbox.addEventListener('change', async () => {
    await chrome.storage.sync.set({ extensionEnabled: enabledCheckbox.checked })
    showStatus('Settings saved!', 'success')
  })
  
  themeSelect.addEventListener('change', async () => {
    const theme = themeSelect.value
    await chrome.storage.sync.set({ theme })
    applyTheme(theme)
    showStatus('Theme updated!', 'success')
  })
}

// Send message to active tab
async function sendMessageToActiveTab(action: string, data?: any): Promise<any> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const activeTab = tabs[0]
    
    if (activeTab?.id) {
      return await chrome.tabs.sendMessage(activeTab.id, { action, data })
    }
  } catch (error) {
    console.error('Error sending message to tab:', error)
    showStatus('Error communicating with page', 'error')
  }
}

// Apply theme
function applyTheme(theme: string): void {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme')
  } else {
    document.body.classList.remove('dark-theme')
  }
}

// Show status message
function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  statusDiv.textContent = message
  statusDiv.className = `status ${type}`
  
  setTimeout(() => {
    statusDiv.textContent = ''
    statusDiv.className = 'status'
  }, 3000)
}

export {}
