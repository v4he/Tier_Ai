const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function parseProductWithGroq(htmlContent) {
  console.log("[Product Parser]: Получен текст страницы для анализа. Длина:", htmlContent.length);
  
  const systemInstruction = `Ты — технический эксперт-аудитор. Твоя задача — извлечь данные о товаре из текста веб-страницы и обогатить их реальными фактами из интернета.

🌐 ИНТЕРНЕТ-АНАЛИЗ И ФОКУСИРОВКА НА МОДИФИКАЦИИ (ОБЯЗАТЕЛЬНО):
Перед формированием ответа внимательно изучи текст страницы, определи бренд, точную модель и её конкретные технические характеристики (объём памяти, процессор, поколение, год выпуска, пробег, степень износа, комплектация). 

Используй Google Search. Строй поисковый запрос максимально точечно (Бренд + Модель + Спецификация). Нас интересует именно эта конкретная версия.
В поиске найди:
1. Актуальный статус этой модификации на рынке (в текущем 2026 году).
2. Главные врожденные "болячки", частые поломки, косяки сборки, критические минусы или подводные камни именно этой серии товаров.

📋 ТРЕБОВАНИЯ К ОЦЕНКЕ И ОПИСАНИЮ:
- condition_category: Оценивай критично (EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR). Если у товара есть серьезный врожденный дефект, плохой износ или скрытые подводные камни — занижай категорию.
- clean_description: Сюда пиши только самую суть без воды. Строго соблюдай следующий формат (короткими фразами через запятую):
  1. Ключевые характеристики и комплектация.
  2. Все найденные в интернете врожденные болячки, минусы и скрытые дефекты.
  3. В САМОМ КОНЦЕ ОБЯЗАТЕЛЬНО добавь жесткий экспертный прогноз живучести: "прогноз стабильной работы: X лет/месяцев без затратного ремонта". Рассчитай его на основе года выпуска, текущего износа/пробега товара и его надежности. Если товар рискованный или уже требует вложений, пиши: "прогноз стабильной работы: 0 месяцев, высок риск скорого ремонта".

Формат ответа: Ты должен вернуть ответ СТРОГО в виде валидного JSON-объекта. Никакого текста вокруг, кроме этого JSON.
{
  "title": "Точное название товара (с указанием ключевой модификации)",
  "price": 0.00,
  "condition_category": "EXCELLENT/VERY_GOOD/GOOD/FAIR/POOR",
  "seller_rating": 4.5,
  "seller_reviews_count": 120,
  "clean_description": "характеристики, комплектация, врожденные болячки, прогноз стабильной работы на основе текущего состояния товара: "пример: 2 года без затратного ремонта"
}`;

  const userContent = `ВОТ ТЕКСТ СТРАНИЦЫ ТОВАРА ДЛЯ АНАЛИЗА:\n${htmlContent}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, 
        maxOutputTokens: 4000, 
        tools: [{ googleSearch: {} }], 
      },
    });

    let rawText = response.text.trim();

    const startJson = rawText.indexOf("{");
    const endJson = rawText.lastIndexOf("}");

    if (startJson !== -1 && endJson !== -1) {
      rawText = rawText.substring(startJson, endJson + 1);
    } else {
      throw new Error("ИИ не смог сформировать валидный JSON в текстовом ответе.");
    }

    const productData = JSON.parse(rawText);
    return productData;

  } catch (error) {
    console.error("[Product Parser Error]: Ошибка парсинга карточки:", error);
    throw error;
  }
}

module.exports = { parseProductWithGroq };