document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("appFrame");

  chrome.storage.local.get(["authToken", "currentFolderId"], (res) => {
    if (!res.authToken) {
      console.log("[Popup] User not authenticated. Redirect to login.");
      iframe.src = "tierFolders.html";
      return;
    }

    if (res.currentFolderId) {
      iframe.src = "parseList.html";
    } else {
      iframe.src = "tierFolders.html";
    }
  });
});