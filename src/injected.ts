// Injected script - runs in the page context (has access to page variables)
// This script is injected into the page and can access the page's window object

console.log('Injected script loaded')

// Example: Access page variables or modify page behavior
;(function() {
  'use strict'
  
  // Example function to interact with the page
  function initializePageIntegration() {
    // Add a custom event listener for extension communication
    window.addEventListener('extensionMessage', (event: any) => {
      console.log('Extension message received:', event.detail)
      
      // Handle different message types
      switch (event.detail.type) {
        case 'getData':
          // Example: Extract data from the page
          const pageData = {
            title: document.title,
            url: window.location.href,
            customData: getCustomPageData()
          }
          
          // Send response back to content script
          window.dispatchEvent(new CustomEvent('extensionResponse', {
            detail: { type: 'getData', data: pageData }
          }))
          break
          
        case 'modifyPage':
          // Example: Modify page content
          modifyPageContent(event.detail.data)
          break
      }
    })
    
    // Signal that the injected script is ready
    window.dispatchEvent(new CustomEvent('extensionInjectedReady'))
  }
  
  // Example function to get custom data from the page
  function getCustomPageData() {
    // This is where you can access page-specific variables or APIs
    // that are not available to content scripts
    return {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      language: navigator.language,
      // Add any page-specific data extraction here
    }
  }
  
  // Example function to modify page content
  function modifyPageContent(data: any) {
    console.log('Modifying page with data:', data)
    
    // Example: Add a notification to the page
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `
    notification.textContent = data.message || 'Extension action performed!'
    document.body.appendChild(notification)
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageIntegration)
  } else {
    initializePageIntegration()
  }
})()

export {}
