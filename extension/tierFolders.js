const folderList = document.getElementById('folderList');

async function loadFolders() {
  try {
    const storage = await chrome.storage.local.get(['authToken']);
    const token = storage.authToken;

    if (!token) {
      chrome.storage.local.remove(['currentFolderId']);
      folderList.innerHTML = `
        <div style="color: #ef4444; margin-bottom: 12px;">Veuillez vous connecter d'abord</div>
        <button id="goToLoginBtn" style="background: #ba6f6f; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%;">
          Se connecter sur le site
        </button>
      `;
      document.getElementById('goToLoginBtn').onclick = () => {
        chrome.tabs.create({ url: 'http://localhost:5173/login' });
      };
      return;
    }

    const res = await fetch('http://localhost:5000/api/tierFolders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        chrome.storage.local.remove(['authToken', 'currentFolderId']);
        folderList.innerHTML = `
          <div style="color: #ef4444; margin-bottom: 12px;">Session expirée, reconnectez-vous</div>
          <button id="goToLoginBtn" style="background: #ba6f6f; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%;">
            Se connecter
          </button>
        `;
        document.getElementById('goToLoginBtn').onclick = () => {
          chrome.tabs.create({ url: 'http://localhost:5173/login' });
        };
        return;
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const folders = await res.json();
    folderList.innerHTML = '';
    
    if (!folders || folders.length === 0) {
      folderList.innerHTML = '<div style="color: #9ca3af; text-align: center; padding: 20px;">Aucun dossier</div>';
      return;
    }

    folders.forEach(f => {
      const div = document.createElement('div');
      div.className = 'folder';
      
      const thumb = document.createElement('img');
      thumb.className = 'folder-thumb';
      thumb.src = f.cover_image || 'https://placehold.co/40/3d3d3d/ffffff?text=?';
      thumb.alt = f.title;
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'folder-title';
      titleSpan.textContent = f.title;
      
      div.appendChild(thumb);
      div.appendChild(titleSpan);
      
      div.onclick = () => {
        chrome.storage.local.set({ currentFolderId: f.id }, () => {
          window.location.href = 'parseList.html';
        });
      };
      
      folderList.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading folders:', err);
    folderList.innerHTML = '<div style="color: #ef4444; text-align: center;">Erreur de connexion au serveur</div>';
  }
}

function logToPage(text, data = null) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "POPUP_LOG", text, data }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  });
}

loadFolders();
logToPage("Popup opened (tierFolders.js) and loadFolders() called");

chrome.runtime.onMessage.addListener((message) => {
  logToPage(`tierFolders.js caught internal message: ${message.type}`);
  
  if (message.type === 'EXTENSION_LOGOUT_SUCCESS') {
    logToPage("Logout detected, reloading folders");
    loadFolders(); 
  }

  if (message.type === 'EXTENSION_LOGIN_SUCCESS') {
    logToPage("Login detected, reloading folders");
    loadFolders();
  }
});