console.log('[Background] Service worker started');

function logToPage(text, data = null) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "BACKGROUND_LOG", text, data }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logToPage('Message received in background: ' + request.type);

  if (request.type === 'LOGOUT') {
    logToPage('Clearing extension storage (LOGOUT)...');
    chrome.storage.local.clear(() => {
      logToPage('Extension storage cleared');
      chrome.storage.local.get(null, (allData) => {
        logToPage('Storage state after clear:', allData);
      });
      chrome.runtime.sendMessage({ type: 'EXTENSION_LOGOUT_SUCCESS' }, () => {
        if (chrome.runtime.lastError) {
          logToPage('Popup closed, message not delivered');
        } else {
          logToPage('EXTENSION_LOGOUT_SUCCESS delivered to popup');
        }
      });
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'LOGIN') {
    logToPage('Saving token (LOGIN)...');
    chrome.storage.local.set({
      authToken: request.token,
      currentFolderId: null
    }, () => {
      logToPage('Token saved in extension');
      chrome.runtime.sendMessage({ type: 'EXTENSION_LOGIN_SUCCESS' }, () => {
        if (chrome.runtime.lastError) {
          logToPage('Popup closed, LOGIN message not delivered');
        } else {
          logToPage('EXTENSION_LOGIN_SUCCESS delivered to popup');
        }
      });
      sendResponse({ success: true });
    });
    return true;
  }

  sendResponse({ success: true });
});