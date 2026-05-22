let scrapedData = null;
let selectedImageUrl = null;

document.getElementById('parseBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const previewBlock = document.getElementById('previewBlock');
  const imagePicker = document.getElementById('imagePicker');
  
  statusDiv.textContent = 'Scanning page...';
  previewBlock.style.display = 'none';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => {
        const isGoodImage = (img) => {
          if (!img || (!img.src && !img.getAttribute('data-old-hires') && !img.getAttribute('data-a-dynamic-image') && !img.getAttribute('data-src')) ) return false;
          
          const width = img.naturalWidth || img.clientWidth || 0;
          const height = img.naturalHeight || img.clientHeight || 0;
          if (width > 0 && height > 0 && (width < 150 || height < 150)) return false;
          
          const src = (img.src || '').toLowerCase();
          const trashWords = ['avatar', 'logo', 'icon', 'sprite', 'bg', 'banner', 'loader', 'theme'];
          if (trashWords.some(word => src.includes(word))) return false;
          
          return true;
        };

        let metaImages = [];
        const ogImg = document.querySelector('meta[property="og:image"]');
        const twitterImg = document.querySelector('meta[name="twitter:image"]');
        if (ogImg && ogImg.content) metaImages.push(ogImg.content);
        if (twitterImg && twitterImg.content) metaImages.push(twitterImg.content);

        const allImgElements = Array.from(document.querySelectorAll('img'));
        const validImages = allImgElements.filter(isGoodImage);

        validImages.sort((a, b) => {
          const areaA = (a.naturalWidth || a.clientWidth || 300) * (a.naturalHeight || a.clientHeight || 300);
          const areaB = (b.naturalWidth || b.clientWidth || 300) * (b.naturalHeight || b.clientHeight || 300);
          return areaB - areaA;
        });

        let sortedSrcs = validImages.map(img => {
          const lazyAttributes = ['data-old-hires', 'data-a-dynamic-image', 'data-lazy-src', 'data-src', 'data-original'];
          for (let attr of lazyAttributes) {
            let attrValue = img.getAttribute(attr);
            if (attrValue) {
              if (attr === 'data-a-dynamic-image') {
                try {
                  const urls = Object.keys(JSON.parse(attrValue));
                  if (urls.length > 0) return urls[0];
                } catch (e) {}
              }
              return attrValue;
            }
          }
          return img.src;
        }).filter(src => src);

        let finalCandidates = [...new Set([...metaImages, ...sortedSrcs])];
        const topCandidates = finalCandidates.slice(0, 6);

        return {
          url: window.location.href,
          text: document.body.innerText,
          imageCandidates: topCandidates
        };
      }
    },
    async (results) => {
      if (chrome.runtime.lastError || !results || !results[0]) {
        statusDiv.textContent = 'Error: Cannot read page content';
        return;
      }

      scrapedData = results[0].result;
      const { imageCandidates } = scrapedData;

      if (!imageCandidates || imageCandidates.length === 0) {
        statusDiv.textContent = 'Text parsed. Product images not found.';
        selectedImageUrl = null;
      } else {
        statusDiv.textContent = 'Page parsed! Please select a product image.';
        selectedImageUrl = imageCandidates[0];
      }

      imagePicker.innerHTML = '';
      imageCandidates.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.classList.add('picker-img');
        if (index === 0) img.classList.add('selected');
        
        img.addEventListener('click', (e) => {
          document.querySelectorAll('.picker-img').forEach(el => el.classList.remove('selected'));
          e.target.classList.add('selected');
          selectedImageUrl = e.target.src;
        });
        
        imagePicker.appendChild(img);
      });

      previewBlock.style.display = 'block';
    }
  );
});






document.getElementById('confirmBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  if (!scrapedData) return;

  statusDiv.textContent = 'Sending to AI server...';

  try {
    const response = await fetch('http://localhost:5000/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: scrapedData.url,
        text: scrapedData.text,
        imageUrl: selectedImageUrl
      })
    });

    const data = await response.json();
    if (data && data.result) {
      statusDiv.textContent = 'Success! Product added to Dashboard.';
      document.getElementById('previewBlock').style.display = 'none';
    } else {
      statusDiv.textContent = 'Error: Server returned no data';
    }
  } catch (err) {
    statusDiv.textContent = 'Network error: ' + err.message;
  }
});