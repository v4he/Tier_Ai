const folderList = document.getElementById('folderList');

async function loadFolders() {
  try {
    const res = await fetch('http://localhost:5000/api/tierFolders');
    const folders = await res.json();
    folderList.innerHTML = '';
    
    if (!folders || folders.length === 0) {
      folderList.innerHTML = '<div style="color: #9ca3af;">u vas net papok</div>';
      return;
    }

    folders.forEach(f => {
      const div = document.createElement('div');
      div.className = 'folder';
      div.textContent = f.title;
      div.onclick = () => {

        chrome.storage.local.set({ currentFolderId: f.id }, () => {
          window.location.href = 'parseList.html';
        });
      };
      folderList.appendChild(div);
    });
  } catch (err) {
    folderList.innerHTML = '<div style="color: #ef4444;">oshibka podklyucheniya k serveru</div>';
  }
}

loadFolders();