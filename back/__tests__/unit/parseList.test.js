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

// ──────────────────────────────────────────────────────────────
// БЕЗОПАСНАЯ ФУНКЦИЯ РАСКРЫТИЯ КОНТЕНТА
// ──────────────────────────────────────────────────────────────
function safeExpandContent() {
  const result = {
    expandedCount: 0,
    hiddenTexts: [],
    hiddenHtml: [],
    safeClicks: 0,
    skippedActions: 0
  };

  // ⛔️ ЧЕРНЫЙ СПИСОК (кнопки действий, которые НЕЛЬЗЯ нажимать)
  const actionKeywords = [
    'message', 'send', 'contact', 'email', 'mail', 'envoyer',
    'buy', 'acheter', 'purchase', 'order', 'commander',
    'finance', 'credit', 'loan', 'pret', 'financement',
    'submit', 'valider', 'payer', 'pay', 'payment',
    'inscription', 'register', 'signup', 'login', 'connexion',
    'cookie', 'consent', 'accept', 'refuser', 'reject',
    'signaler', 'report', 'alert', 'warning'
  ];

  // ✅ БЕЛЫЙ СПИСОК (кнопки для раскрытия контента)
  const expandSelectors = [
    'button[aria-expanded="false"]',
    'button[data-toggle="collapse"]',
    'button[data-toggle="tab"]',
    'button[data-target*="collapse"]',
    'button[data-target*="expand"]',
    'button[class*="expand"]',
    'button[class*="accordion"]',
    'button[class*="plus"]',
    'button[class*="more"]',
    'button[class*="show"]',
    'button[class*="voir"]',
    'button[class*="caracteristique"]',
    'button[class*="detail"]',
    'button[role="tab"]',
    'button[class*="tab"]',
    'summary',
    'details summary',
    '[aria-expanded="false"]',
    '[data-toggle="collapse"]',
    '[role="tab"]',
    '[class*="accordion"]',
    '[class*="expandable"]'
  ];

  // Функция проверки безопасности клика
  function isSafeToClick(element) {
    // Получаем весь текст элемента (включая вложенные)
    const allText = element.innerText?.toLowerCase() || '';
    const allHtml = element.innerHTML?.toLowerCase() || '';
    const combinedText = allText + ' ' + allHtml;

    // Проверяем длину текста (слишком короткие кнопки - обычно иконки)
    if (allText.trim().length < 2) {
      // Проверяем, может это кнопка с иконкой (у нее есть aria-label)
      const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
      if (ariaLabel && actionKeywords.some(word => ariaLabel.includes(word))) {
        result.skippedActions++;
        return false;
      }
      // Если нет текста и нет aria-label, пропускаем (неизвестно что делает)
      return false;
    }

    // ⛔️ Проверка черного списка
    if (actionKeywords.some(word => combinedText.includes(word))) {
      result.skippedActions++;
      return false;
    }

    // ✅ Проверка, что это элемент для раскрытия
    const hasExpandAttr = element.hasAttribute('aria-expanded') || 
                          element.hasAttribute('data-toggle') ||
                          element.tagName === 'SUMMARY';

    const hasExpandClass = /expand|accordion|collapse|tab|detail|caractéristique|équipement/.test(element.className);

    const hasExpandText = /voir|afficher|caractéristique|équipement|detail|plus|tout|complément|show|more/.test(combinedText);

    // Если элемент уже раскрыт, все равно считаем его безопасным
    const isAlreadyExpanded = element.getAttribute('aria-expanded') === 'true' ||
                             (element.tagName === 'DETAILS' && element.hasAttribute('open'));

    // Возвращаем true если соответствует хотя бы двум критериям
    let safeScore = 0;
    if (hasExpandAttr) safeScore++;
    if (hasExpandClass) safeScore++;
    if (hasExpandText) safeScore++;
    if (isAlreadyExpanded) safeScore++;

    return safeScore >= 1; // Хотя бы один признак раскрытия
  }

  // Собираем все потенциальные элементы для раскрытия
  const allElements = document.querySelectorAll(expandSelectors.join(', '));
  console.log(`[SafeExpand] Найдено ${allElements.length} потенциальных элементов`);

  // Проходим по всем элементам
  allElements.forEach((el, index) => {
    try {
      // Проверяем видимость
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Проверяем, что элемент находится в DOM
      if (!document.contains(el)) return;

      // Проверяем безопасность
      if (!isSafeToClick(el)) {
        return;
      }

      // Проверяем, раскрыт ли уже
      const isExpanded = el.getAttribute('aria-expanded') === 'true' ||
                        (el.tagName === 'DETAILS' && el.hasAttribute('open'));

      // Кликаем только если не раскрыт
      if (!isExpanded) {
        el.click();
        result.expandedCount++;
        result.safeClicks++;
        console.log(`[SafeExpand] Клик #${result.safeClicks}: "${el.innerText?.slice(0, 30)}"`);
      } else {
        console.log(`[SafeExpand] Уже раскрыто: "${el.innerText?.slice(0, 30)}"`);
      }

    } catch (e) {
      // Игнорируем ошибки
    }
  });

  // Ждем обновления DOM (синхронное ожидание)
  const startTime = Date.now();
  while (Date.now() - startTime < 300) {
    // Просто ждем
  }

  // Собираем скрытый контент (который теперь раскрыт)
  const hiddenSelectors = [
    '[class*="collapse"]',
    '[class*="expand"]',
    '[id*="collapse"]',
    '[id*="expand"]',
    'details',
    '[aria-hidden="false"]',
    '[style*="display: block"]',
    '[style*="display:block"]',
    '[class*="hidden"]:not([style*="display: none"])',
    '[class*="tab-pane"]',
    '[role="tabpanel"]'
  ];

  document.querySelectorAll(hiddenSelectors.join(', ')).forEach(el => {
    const text = el.innerText?.trim();
    if (text && text.length > 50) {
      // Проверяем, что это не дубликат
      if (!result.hiddenTexts.some(existing => existing.includes(text.slice(0, 50)))) {
        result.hiddenTexts.push(text);
        result.hiddenHtml.push(el.outerHTML);
      }
    }
  });

  console.log(`[SafeExpand] Результат: раскрыто ${result.expandedCount} блоков, найдено ${result.hiddenTexts.length} секций, пропущено действий: ${result.skippedActions}`);
  
  return result;
}

// ──────────────────────────────────────────────────────────────
// КНОПКА СКАНИРОВАНИЯ (обновленная)
// ──────────────────────────────────────────────────────────────
document.getElementById("scanBtn").addEventListener("click", async () => {
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

    // ── ШАГ 1: БЕЗОПАСНОЕ РАСКРЫТИЕ КОНТЕНТА ──────────────────
    toastEl.textContent = "Раскрываем скрытые данные...";

    const expandResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: safeExpandContent
    });

    const expandData = expandResult[0]?.result || { hiddenTexts: [], expandedCount: 0 };
    console.log(`[Scan] Раскрыто блоков: ${expandData.expandedCount}`);

    // ── ШАГ 2: СБОР ВСЕХ ДАННЫХ ──────────────────────────────
    toastEl.textContent = "Собираем данные...";

    const scrapeResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (hiddenTextsFromExpand) => {
        // ── Метод 1: JSON-LD ──────────────────────────────────
        const jsonLdData = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
          try {
            jsonLdData.push(JSON.parse(el.textContent));
          } catch (e) {}
        });

        // ── Сбор изображений ───────────────────────────────────
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
          } catch (e) { return; }

          const lowerSrc = absoluteUrl.toLowerCase();
          if (trashWords.some(word => lowerSrc.includes(word))) return;
          if (c.area < 150 * 150) return;

          validUrls.push({ url: absoluteUrl, area: c.area });
        });

        validUrls.sort((a, b) => b.area - a.area);
        let uniqueUrls = [...new Set(validUrls.map(v => v.url))];

        // ── Очистка HTML от мусора ─────────────────────────────
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = document.documentElement.outerHTML;
        
        // Удаляем опасные элементы
        const removeSelectors = [
          'script', 'style', 'noscript', 'iframe', 'svg',
          'header', 'footer', 'nav', 'aside', 'form',
          'button[type="submit"]', 'input[type="submit"]',
          '[class*="cookie"]', '#cookie', '[class*="consent"]',
          '[class*="advertisement"]', '[class*="publicite"]'
        ];
        
        removeSelectors.forEach(selector => {
          tempDiv.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Удаляем элементы с действиями
        tempDiv.querySelectorAll('button, a, [role="button"]').forEach(el => {
          const text = (el.innerText || '').toLowerCase();
          const actionWords = ['envoyer', 'message', 'buy', 'acheter', 'payer', 'finance', 'credit', 'loan'];
          if (actionWords.some(word => text.includes(word))) {
            el.remove();
          }
        });

        const cleanHtml = tempDiv.innerHTML;

        return {
          url: window.location.href,
          html: cleanHtml,
          jsonLd: jsonLdData,
          hiddenContent: hiddenTextsFromExpand.join('\n'),
          imageCandidates: uniqueUrls.slice(0, 9),
          titleFallback: document.title,
          expandedCount: hiddenTextsFromExpand.length
        };
      },
      args: [expandData.hiddenTexts]
    });

    if (chrome.runtime.lastError || !scrapeResult || !scrapeResult[0]) {
      toastEl.textContent = "Ошибка чтения страницы";
      return;
    }

    scrapedData = scrapeResult[0].result;
    const { imageCandidates, titleFallback, expandedCount } = scrapedData;

    console.log(`[Scan] Собрано данных: HTML ${scrapedData.html.length} симв., скрытых блоков ${expandedCount}`);

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

  } catch (err) {
    console.error("[Scan] Ошибка:", err);
    toastEl.textContent = 'Ошибка: ' + err.message;
  }
});

// ──────────────────────────────────────────────────────────────
// КНОПКА ПОДТВЕРДИТЬ
// ──────────────────────────────────────────────────────────────
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
        jsonLd: scrapedData.jsonLd,
        hiddenContent: scrapedData.hiddenContent,
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
      scrapedData = null;
      selectedImageUrl = null;
    }, 1000);

  } catch (err) {
    innerStatus.textContent = 'Ошибка отправки: ' + err.message;
  }
});

// ──────────────────────────────────────────────────────────────
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ
// ──────────────────────────────────────────────────────────────
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