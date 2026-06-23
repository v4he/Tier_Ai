let scrapedData = null;
let selectedImageUrl = null;
let currentFolderId = null;

// Нажатие на "Сменить папку" (сброс памяти)
document.getElementById("changeFolderBtn").addEventListener("click", () => {
  chrome.storage.local.remove(["currentFolderId"], () => {
    window.location.href = "tierFolders.html";
  });
});



// Нажатие на "Отмена" в модалке превью
document.getElementById("cancelBtn").addEventListener("click", () => {
  document.getElementById("previewBlock").style.display = "none";
  document.getElementById("toastMsg").classList.remove("show");
  // Чистим кэш при отмене
  scrapedData = null;
  selectedImageUrl = null;
});

// ФУНКЦИЯ ЗАГРУЗКИ ТОВАРОВ ИЗ API
async function loadSavedListings(folderId) {
  const container = document.getElementById("listingsContainer");
  const listTitle = document.getElementById("listTitle");
  if (!container) return;

  try {
    const response = await fetch(`http://localhost:5000/api/listings/${folderId}`);
    const listings = await response.json();
    
    container.innerHTML = "";

    if (!listings || listings.length === 0) {
      listTitle.textContent = "В этой папке пусто";
      container.innerHTML = '<div class="list-item-empty">Пусто. Сканируйте страницы товаров, чтобы наполнить папку!</div>';
      return;
    }

    listTitle.textContent = `Товары в этой папке (${listings.length}):`;

    listings.forEach(item => {
      const card = document.createElement("div");
      card.className = "list-item-card";
      const displayPrice = item.price ? `${Number(item.price).toLocaleString()} €` : "Цена не указана";

      card.innerHTML = `
        <img class="list-item-img" src="${item.image_url || 'https://placehold.co/100'}" alt="img">
        <div class="list-item-info">
          <div class="list-item-title" title="${item.title}">${item.title || "Без названия"}</div>
          <div class="list-item-price">${displayPrice}</div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Ошибка загрузки товаров папки:", err);
    container.innerHTML = '<div class="list-item-empty" style="color: #ef4444;">Не удалось обновить список товаров</div>';
  }
}

// КНОПКА СКАНИРОВАНИЯ
document.getElementById("scanBtn").addEventListener("click", async () => {
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Жестко обнуляем старые данные при каждом новом нажатии на Scan!
  scrapedData = null;
  selectedImageUrl = null;

  const toastEl = document.getElementById("toastMsg");
  const previewBlock = document.getElementById("previewBlock");
  const imagePicker = document.getElementById("imagePicker");
  
  toastEl.textContent = "Сканирование страницы...";
  toastEl.classList.add("show");
  previewBlock.style.display = "none";

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (!tab || !tab.id || tab.url.startsWith("chrome-extension://")) {
      toastEl.textContent = "Ошибка: перейдите на страницу товара";
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
          toastEl.textContent = "Ошибка чтения страницы";
          return;
        }

        scrapedData = results[0].result;
        const { imageCandidates, titleFallback } = scrapedData;

        if (!imageCandidates || imageCandidates.length === 0) {
          toastEl.textContent = "Текст готов к отправке, но фото товара не найдены.";
          selectedImageUrl = null;
          return;
        }

        toastEl.classList.remove("show");

        document.getElementById('productTitle').textContent = titleFallback.slice(0, 60) + "...";
        document.getElementById('productPrice').innerHTML = `Определяется ИИ... <span>(в процессе)</span>`;

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
    toastEl.textContent = 'Ошибка: ' + err.message;
  }
});

// КНОПКА ПОДТВЕРДИТЬ
document.getElementById('confirmBtn').addEventListener('click', async () => {
  const innerStatus = document.getElementById('innerStatus');
  if (!scrapedData || !selectedImageUrl || !currentFolderId) {
    innerStatus.textContent = 'Ошибка: нет данных для отправки';
    return;
  }

  innerStatus.textContent = 'Сохранение товара...';

  try {
    const response = await fetch('http://localhost:5000/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: scrapedData.url,
        html: scrapedData.html, 
        imageUrl: selectedImageUrl,
        tierListId: Number(currentFolderId) 
      })
    });

    await response.json();
    innerStatus.textContent = '✓ Успешно добавлено!';
    
    await loadSavedListings(currentFolderId);

    setTimeout(() => {
      document.getElementById('previewBlock').style.display = 'none';
      innerStatus.textContent = '';
      // Чистим память после успешной отправки лота
      scrapedData = null;
      selectedImageUrl = null;
    }, 1000);

  } catch (err) {
    innerStatus.textContent = 'Ошибка отправки: ' + err.message;
  }
});

// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ
function initPage() {
  chrome.storage.local.get(['currentFolderId'], async (res) => {
    currentFolderId = res.currentFolderId;
    const folderNameEl = document.getElementById("folderName");
    
    if (currentFolderId && folderNameEl) {
      folderNameEl.textContent = `Папка #${currentFolderId}`;
      loadSavedListings(currentFolderId);

      try {
        const response = await fetch(`http://localhost:5000/api/tierFolders`);
        const folders = await response.json();
        const currentFolder = folders.find(f => f.id === currentFolderId);
        if (currentFolder) {
          folderNameEl.textContent = currentFolder.title;
        }
      } catch (e) {
        console.log("Сервер офлайн, выводим дефолтный ID");
      }
    }
  });
}

initPage();