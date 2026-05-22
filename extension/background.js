chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Всю работу теперь делает popup.js
  sendResponse({ success: true, message: "Background is idle" });
});
