// Content script - runs in the context of web pages
console.log('Content script loaded')

// Example: Send message to background script
function sendMessageToBackground(action: string, data?: any) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, data }, (response) => {
      resolve(response)
    })
  })
}

// Example: Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request)
  
  if (request.action === 'highlightText') {
    highlightSelectedText()
    sendResponse({ success: true })
  }
  
  if (request.action === 'getPageInfo') {
    sendResponse({
      title: document.title,
      url: window.location.href,
      selectedText: window.getSelection()?.toString() || ''
    })
  }
})

// Example function: Highlight selected text
function highlightSelectedText() {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.style.backgroundColor = 'yellow'
    span.style.padding = '2px'
    
    try {
      range.surroundContents(span)
    } catch (e) {
      console.log('Could not highlight selection:', e)
    }
  }
}

// Example: Inject a script into the page context (if needed)
function injectScript() {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL('injected.js')
  script.onload = function() {
    // Remove script after loading
    if (script.parentNode) {
      script.parentNode.removeChild(script)
    }
  }
  ;(document.head || document.documentElement).appendChild(script)
}

// Uncomment if you need to inject a script
// injectScript()

export {}
