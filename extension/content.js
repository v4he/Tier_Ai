console.log('[Content Script] Script injected on page');

window.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== 'object') return;

  if (!chrome.runtime || !chrome.runtime.id) {
    console.warn('[Content Script] Extension context lost. Reload page.');
    return;
  }

  if (event.data.type === "LOGOUT_FROM_PAGE") {
    console.log('[Content Script] LOGOUT_FROM_PAGE captured, forwarding to background...');
    try {
      chrome.runtime.sendMessage({ type: "LOGOUT" }, (response) => {
        if (chrome.runtime.lastError) {}
      });
    } catch (e) {
      console.warn('[Content Script] Failed to send LOGOUT');
    }
  }

  if (event.data.type === "LOGIN_FROM_PAGE" && event.data.token) {
    console.log('[Content Script] LOGIN_FROM_PAGE captured, forwarding to background...');
    try {
      chrome.runtime.sendMessage({ type: "LOGIN", token: event.data.token }, (response) => {
        if (chrome.runtime.lastError) {}
      });
    } catch (e) {
      console.warn('[Content Script] Failed to send LOGIN');
    }
  }
});

try {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "POPUP_LOG") {
      console.log('[POPUP LOG VIA CONTENT]: ' + message.text, message.data || '');
    }
    if (message.type === "BACKGROUND_LOG") {
      console.log('[BACKGROUND LOG VIA CONTENT]: ' + message.text, message.data || '');
    }
    sendResponse({ status: "log_received" });
  });
} catch (e) {
  console.log('[Content Script] Failed to set runtime listener');
}