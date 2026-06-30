let scrapedData = null;
let selectedImageUrl = null;
let currentFolderId = null;
let authToken = null;

const toastEl = document.getElementById("toastMsg");
const previewBlock = document.getElementById("previewBlock");
const imagePicker = document.getElementById("imagePicker");

function handleUnauthorized() {
  console.log('[parseList] handleUnauthorized called');
  chrome.storage.local.remove(["authToken", "currentFolderId"], () => {
    console.log('[parseList] Data removed, redirect to tierFolders.html');
    window.location.href = "tierFolders.html";
  });
}

document.getElementById("changeFolderBtn").addEventListener("click", () => {
  chrome.storage.local.remove(["currentFolderId"], () => {
    window.location.href = "tierFolders.html";
  });
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  previewBlock.style.display = "none";
  toastEl.classList.remove("show");
  scrapedData = null;
  selectedImageUrl = null;
});

async function loadSavedListings(folderId) {
  const container = document.getElementById("listingsContainer");
  const listTitle = document.getElementById("listTitle");
  if (!container) return;

  console.log('[parseList] Loading products for folder:', folderId);

  try {
    const response = await fetch(`http://localhost:5000/api/listings/${folderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('[parseList] 401 - invalid token');
        handleUnauthorized();
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const listings = await response.json();
    container.innerHTML = "";

    if (!listings || listings.length === 0) {
      listTitle.textContent = "Dans ce dossier il n'y a rien";
      container.innerHTML = '<div class="list-item-empty">Vide. Scannez des pages de produits pour remplir le dossier !</div>';
      return;
    }

    listTitle.textContent = `Produits dans ce dossier (${listings.length}) :`;

    listings.forEach(item => {
      const card = document.createElement("div");
      card.className = "list-item-card";
      const displayPrice = item.price ? `${Number(item.price).toLocaleString()} €` : "Prix non indiqué";

      card.innerHTML = `
        <img class="list-item-img" src="${item.image_url || 'https://placehold.co/100'}" alt="img">
        <div class="list-item-info">
          <div class="list-item-title" title="${item.title}">${item.title || "Sans titre"}</div>
          <div class="list-item-price">${displayPrice}</div>
        </div>
      `;
      container.appendChild(card);
    });
    
    console.log('[parseList] Products loaded, count:', listings.length);
  } catch (err) {
    console.error("Error loading products:", err);
    container.innerHTML = '<div class="list-item-empty" style="color: #ef4444;">Impossible de mettre à jour la liste des produits</div>';
  }
}

document.getElementById("scanBtn").addEventListener("click", async () => {
  scrapedData = null;
  selectedImageUrl = null;

  toastEl.textContent = "Scan de la page en cours...";
  toastEl.classList.add("show");
  previewBlock.style.display = "none";

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (!tab || !tab.id || tab.url.startsWith("chrome-extension://")) {
      toastEl.textContent = "Erreur : veuillez naviguer vers une page de produit";
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          const parseSrcset = (srcset) => {
            if (!srcset) return null;
            const candidates = srcset.split(',').map(s => s.trim().split(' ')[0]);
            return candidates[candidates.length - 1] || null;
          };

          const getBgImageUrl = (el) => {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none' && bg.startsWith('url')) {
              const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
              return matches ? matches[1] : null;
            }
            return null;
          };

          let candidates = [];
          const ogImg = document.querySelector('meta[property="og:image"]');
          const twitterImg = document.querySelector('meta[name="twitter:image"]');
          if (ogImg && ogImg.content) candidates.push({ src: ogImg.content, area: 999999 });
          if (twitterImg && twitterImg.content) candidates.push({ src: twitterImg.content, area: 999999 });

          document.querySelectorAll('picture, source').forEach(el => {
            const src = parseSrcset(el.getAttribute('srcset')) || el.getAttribute('src');
            if (src) candidates.push({ src, area: 500000 });
          });

          document.querySelectorAll('*').forEach(el => {
            if (el.tagName === 'IMG') {
              let src = el.src;
              const lazyAttributes = ['data-old-hires', 'data-a-dynamic-image', 'data-lazy-src', 'data-src', 'data-original', 'srcset', 'data-srcset'];
              for (let attr of lazyAttributes) {
                let attrValue = el.getAttribute(attr);
                if (attrValue) {
                  if (attr === 'data-a-dynamic-image') {
                    try {
                      const urls = Object.keys(JSON.parse(attrValue));
                      if (urls.length > 0) { src = urls[0]; break; }
                    } catch (e) {}
                  } else if (attr.includes('srcset')) {
                    const parsed = parseSrcset(attrValue);
                    if (parsed) { src = parsed; break; }
                  } else {
                    src = attrValue;
                    break;
                  }
                }
              }
              if (src && !src.startsWith('data:image')) {
                const width = el.naturalWidth || el.clientWidth || 300;
                const height = el.naturalHeight || el.clientHeight || 300;
                candidates.push({ src, area: width * height });
              }
            } else {
              const bgSrc = getBgImageUrl(el);
              if (bgSrc && !bgSrc.startsWith('data:image')) {
                const width = el.clientWidth || 300;
                const height = el.clientHeight || 300;
                candidates.push({ src: bgSrc, area: width * height });
              }
            }
          });

          const trashWords = ['avatar', 'logo', 'icon', 'sprite', 'bg', 'banner', 'loader', 'theme', 'svg', 'metric', 'pixel'];
          let validUrls = [];
          candidates.forEach(c => {
            if (!c.src) return;
            let absoluteUrl = c.src;
            try {
              absoluteUrl = new URL(c.src, window.location.href).href;
            } catch(e) { return; }

            const lowerSrc = absoluteUrl.toLowerCase();
            if (trashWords.some(word => lowerSrc.includes(word))) return;
            if (c.area < 150 * 150) return;

            validUrls.push({ url: absoluteUrl, area: c.area });
          });

          validUrls.sort((a, b) => b.area - a.area);
          let uniqueUrls = [...new Set(validUrls.map(v => v.url))];

          return {
            url: window.location.href,
            html: document.documentElement.outerHTML, 
            imageCandidates: uniqueUrls.slice(0, 9),
            titleFallback: document.title
          };
        }
      },
      async (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
          toastEl.textContent = "Erreur de lecture de la page";
          return;
        }

        scrapedData = results[0].result;
        const { imageCandidates, titleFallback } = scrapedData;

        if (!imageCandidates || imageCandidates.length === 0) {
          toastEl.textContent = "Texte prêt à être envoyé, mais aucune photo du produit trouvée.";
          selectedImageUrl = null;
          return;
        }

        toastEl.classList.remove("show");

        document.getElementById('productTitle').textContent = titleFallback.slice(0, 60) + "...";
        document.getElementById('productPrice').innerHTML = `Déterminé par l'IA... <span>(en cours)</span>`;

        selectedImageUrl = imageCandidates[0]; 
        imagePicker.innerHTML = '';
        
        imageCandidates.forEach((src, index) => {
          const img = document.createElement('img');
          img.src = src;
          img.className = 'picker-img';
          if (index === 0) img.classList.add('selected');
          
          img.addEventListener('click', (e) => {
            document.querySelectorAll('.picker-img').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedImageUrl = e.target.src;
          });
          
          imagePicker.appendChild(img);
        });

        previewBlock.style.display = 'flex';
      }
    );
  } catch (err) {
    toastEl.textContent = 'Erreur : ' + err.message;
  }
});

document.getElementById('confirmBtn').addEventListener('click', async () => {
  const innerStatus = document.getElementById('innerStatus');
  if (!scrapedData || !selectedImageUrl || !currentFolderId) {
    innerStatus.textContent = 'Erreur : pas de données à envoyer';
    return;
  }

  innerStatus.textContent = 'Sauvegarde du produit...';

  try {
    const response = await fetch('http://localhost:5000/api/parse', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        url: scrapedData.url,
        html: scrapedData.html, 
        imageUrl: selectedImageUrl,
        tierListId: Number(currentFolderId) 
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await response.json();
    innerStatus.textContent = 'Ajouté avec succès !';
    
    await loadSavedListings(currentFolderId);

    setTimeout(() => {
      previewBlock.style.display = 'none';
      innerStatus.textContent = '';
      scrapedData = null;
      selectedImageUrl = null;
    }, 1000);

  } catch (err) {
    innerStatus.textContent = 'Erreur d\'envoi : ' + err.message;
  }
});

function initPage() {
  console.log('[parseList] initPage called');
  
  chrome.storage.local.get(['currentFolderId', 'authToken'], async (res) => {
    console.log('[parseList] Data from storage:');
    console.log('  folderId:', res.currentFolderId);
    console.log('  token:', res.authToken ? res.authToken.substring(0, 30) + '...' : 'undefined');
    
    currentFolderId = res.currentFolderId;
    authToken = res.authToken;
    
    if (!authToken) {
      console.log('[parseList] No token, redirect to tierFolders.html');
      handleUnauthorized();
      return;
    }
    
    const folderNameEl = document.getElementById("folderName");
    
    if (currentFolderId && folderNameEl) {
      folderNameEl.textContent = `Dossier #${currentFolderId}`;
      loadSavedListings(currentFolderId);

      try {
        const response = await fetch(`http://localhost:5000/api/tierFolders`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log('[parseList] 401 while loading folders');
            handleUnauthorized();
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const folders = await response.json();
        const currentFolder = folders.find(f => f.id === currentFolderId);
        if (currentFolder) {
          folderNameEl.textContent = currentFolder.title;
          console.log('[parseList] Folder name updated:', currentFolder.title);
        }
      } catch (e) {
        console.log('[parseList] Error loading folders:', e);
      }
    } else {
      console.log('[parseList] No folderId, redirect to folder selection');
      window.location.href = "tierFolders.html";
    }
  });
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

initPage();
logToPage("Popup opened (parseList.js) and initPage() called");

chrome.runtime.onMessage.addListener((message) => {
  logToPage(`parseList.js caught internal message: ${message.type}`);
  
  if (message.type === 'EXTENSION_LOGOUT_SUCCESS') {
    logToPage("Logout detected, redirect to tierFolders.html");
    window.location.href = "tierFolders.html";
  }
  
  if (message.type === 'EXTENSION_LOGIN_SUCCESS') {
    logToPage("Login detected, redirect to tierFolders.html");
    window.location.href = "tierFolders.html";
  }
});