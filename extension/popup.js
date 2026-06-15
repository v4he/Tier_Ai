document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("appFrame");


  chrome.storage.local.get(["currentFolderId"], (res) => {
    if (res.currentFolderId) {

      iframe.src = "parseList.html";
    } else {

      iframe.src = "tierFolders.html";
    }
  });
});