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
});

// ФУНКЦИЯ ЗАГРУЗКИ ТОВАРОВ ИЗ ТВОЕГО API
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
          // Хелпер для очистки и разбора srcset (Zalando часто использует его)
          const parseSrcset = (srcset) => {
            if (!srcset) return null;
            const candidates = srcset.split(',').map(s => s.trim().split(' ')[0]);
            return candidates[candidates.length - 1] || null; // Берем самое качественное (последнее) фото
          };

          // Хелпер для вытаскивания картинок из CSS background-image
          const getBgImageUrl = (el) => {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none' && bg.startsWith('url')) {
              const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
              return matches ? matches[1] : null;
            }
            return null;
          };

          // 1. Собираем базовые мета-теги
          let candidates = [];
          const ogImg = document.querySelector('meta[property="og:image"]');
          const twitterImg = document.querySelector('meta[name="twitter:image"]');
          if (ogImg && ogImg.content) candidates.push({ src: ogImg.content, area: 999999 });
          if (twitterImg && twitterImg.content) candidates.push({ src: twitterImg.content, area: 999999 });

          // 2. Ищем внутри тегов <picture> и источников <source>
          document.querySelectorAll('picture, source').forEach(el => {
            const src = parseSrcset(el.getAttribute('srcset')) || el.getAttribute('src');
            if (src) candidates.push({ src, area: 500000 });
          });

          // 3. Сканируем абсолютно ВСЕ элементы на странице на наличие фоновых изображений (для сложных версток)
          document.querySelectorAll('*').forEach(el => {
            // Если это обычный тег IMG
            if (el.tagName === 'IMG') {
              // Ищем во всех возможных ленивых атрибутах, включая srcset
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
                // Измеряем размеры. Если они 0 (скрыта), даем дефолтный вес 300x300, чтобы не отсечь её
                const width = el.naturalWidth || el.clientWidth || 300;
                const height = el.naturalHeight || el.clientHeight || 300;
                candidates.push({ src, area: width * height, element: el });
              }
            } else {
              // Если это не IMG, проверяем фоновый рисунок в CSS
              const bgSrc = getBgImageUrl(el);
              if (bgSrc && !bgSrc.startsWith('data:image')) {
                const width = el.clientWidth || 300;
                const height = el.clientHeight || 300;
                candidates.push({ src: bgSrc, area: width * height });
              }
            }
          });

          // СЛОВАРЬ МУСОРА
          const trashWords = ['avatar', 'logo', 'icon', 'sprite', 'bg', 'banner', 'loader', 'theme', 'svg', 'metric', 'pixel'];

          // Фильтруем собранный массив
          let validUrls = [];
          candidates.forEach(c => {
            if (!c.src) return;
            
            // Превращаем относительные ссылки в абсолютные (ведь некоторые сайты пишут просто /media/image.jpg)
            let absoluteUrl = c.src;
            try {
              absoluteUrl = new URL(c.src, window.location.href).href;
            } catch(e) { return; }

            const lowerSrc = absoluteUrl.toLowerCase();
            
            // Защита от мусора
            if (trashWords.some(word => lowerSrc.includes(word))) return;
            
            // Если размер точно известен и он слишком мелкий — пропускаем
            if (c.area < 150 * 150) return;

            validUrls.push({ url: absoluteUrl, area: c.area });
          });

          // Сортируем от больших изображений к меньшим
          validUrls.sort((a, b) => b.area - a.area);

          // Убираем дубликаты
          let uniqueUrls = [...new Set(validUrls.map(v => v.url))];

          return {
            url: window.location.href,
            text: document.body.innerText,
            imageCandidates: uniqueUrls.slice(0, 9) // Возьмем топ-9 кандидатов
          };
        }
      },
      async (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
          toastEl.textContent = "Ошибка чтения страницы";
          return;
        }

        scrapedData = results[0].result;
        const { imageCandidates, text } = scrapedData;

        if (!imageCandidates || imageCandidates.length === 0) {
          toastEl.textContent = "Текст собран, но фото не найдены.";
          selectedImageUrl = null;
          return;
        }

        toastEl.classList.remove("show");

        let title = "Товар из сканера";
        let price = "Цена не найдена";
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) title = lines[0].slice(0, 60);
        for (let line of lines) {
          const match = line.match(/(\d[\d\s.,]*)\s*(€|\$|руб)/i);
          if (match) { price = match[0]; break; }
        }

        document.getElementById('productTitle').textContent = title;
        document.getElementById('productPrice').innerHTML = `${price} <span>(найдено)</span>`;

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

// КНОПКА ПОДТВЕРДИТЬ (ОТПРАВКА НА СЕРВЕР)
document.getElementById('confirmBtn').addEventListener('click', async () => {
  const innerStatus = document.getElementById('innerStatus');
  if (!scrapedData || !selectedImageUrl || !currentFolderId) return;

  innerStatus.textContent = 'Сохранение товара...';

  try {
    const response = await fetch('http://localhost:5000/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: scrapedData.url,
        text: scrapedData.text,
        imageUrl: selectedImageUrl,
        tierListId: Number(currentFolderId) 
      })
    });

    const data = await response.json();
    innerStatus.textContent = '✓ Успешно добавлено!';
    
    await loadSavedListings(currentFolderId);

    setTimeout(() => {
      document.getElementById('previewBlock').style.display = 'none';
      innerStatus.textContent = '';
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