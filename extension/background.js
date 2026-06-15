chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
 
  sendResponse({ success: true, message: "Background is idle" });
});
