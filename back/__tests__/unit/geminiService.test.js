const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function parseProductWithGemini(htmlContent) {
  console.log("[Product Parser]: Получен текст страницы для анализа. Длина:", htmlContent.length);
  
  const systemInstruction = `Ты — изолированный технический аудитор данных. Твоя единственная цель — декомпозировать сырой текст веб-страницы на верифицированные технические метрики и сопоставить их со справочными данными из Google Search. 

ПОМНИ: Твоё описание (clean_description) станет единственным источником правды для финансового аналитика, который будет проводить оценку целесообразности сделки. Любая твоя ложная эмоция, субъективная оценка ("плохой", "ужасный") или недостоверный факт исказят итоговый рейтинг.

<ИНТЕРНЕТ_АНАЛИЗ_2026>
1. Из текста страницы определи: Точный бренд, модель, поколение/серию, модификацию, год выпуска, пробег/износ.
2. Используй Google Search: Сделай точечный запрос [Бренд + Модель + Модификация + Спецификация]. 
3. Собери из сети ТОЛЬКО системные, официально признанные производителем или сервисной практикой критические аппаратные ограничения, врожденные архитектурные особенности или нормативные регламенты (например, экологические классы, запреты на эксплуатацию/аренду по законам 2026 года). Игнорируй единичные жалобы с форумов.
</ИНТЕРНЕТ_АНАЛИЗ_2026>

<ПРАВИЛА_ДОСТОВЕРНОСТИ>
- Запрещено вносить в "clean_description" характеристики, параметры, свойства или дефекты, если их явное наличие или строгое соответствие не подтверждено текстом объявления или спецификацией модели на 100%.
- НЕДВИЖИМОСТЬ: Классы энергопотребления (DPE/GES) извлекать СТРОГО по буквам (A-G) из текста. Запрещено прогнозировать или подменять реальный класс на основе года постройки. Если в тексте написано "classe F" — пиши строго F.
- Если параметр не найден в тексте и не имеет четкого стандарта в сети — не пиши его.
</ПРАВИЛА_ДОСТОВЕРНОСТИ>

<ТРЕБОВАНИЯ_К_ПОЛЯМ_JSON>
- condition_category: Строгая техническая оценка износа (EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR). Снижай грейд только за явные дефекты, критический износ или жесткие юридические ограничения на эксплуатацию.
- clean_description: Строгий формат, без использования субъективных прилагательных, короткими фразами через запятую:
  1. Ключевые технические параметры, комплектация и комплектующие (только подтвержденные факты).
  2. Задокументированные архитектурные ограничения, врожденные особенности серии или применимые законодательные ограничения текущего 2026 года.
  3. В КОНЦЕ ОБЯЗАТЕЛЬНО: "прогноз стабильной работы: X лет/месяцев без капитальных вложений". Рассчитывай математически на основе года выпуска, износа и надежности компонентов. Если объект уже требует ремонта или ограничен законом, пиши: "прогноз стабильной работы: 0 месяцев, высок риск скорых вложений".
</ТРЕБОВАНИЯ_К_ПОЛЯМ_JSON>

Возвращай ответ СТРОГО в формате JSON:
{
  "title": "Официальное торговое наименование товара с указанием конкретной модификации",
  "price": 0.00,
  "condition_category": "EXCELLENT/VERY_GOOD/GOOD/FAIR/POOR",
  "seller_rating": 0.0,
  "seller_reviews_count": 0,
  "clean_description": "технические параметры, особенности архитектуры/ограничения, прогноз стабильной работы: "
}`;

  const userContent = `ВОТ ТЕКСТ СТРАНИЦЫ ТОВАРА ДЛЯ АНАЛИЗА:\n${htmlContent}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userContent,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.0, 
        maxOutputTokens: 4000, 
        tools: [{ googleSearch: {} }], 
      },
    });

    // 🔥 ГЛАВНОЕ ИЗМЕНЕНИЕ: правильная обработка ответа для @google/genai
    let rawText = "";
    
    // Проверяем структуру ответа для новой библиотеки
    if (response && response.text) {
      // В новой библиотеке response.text - это строка, а не функция!
      rawText = response.text;
    } else if (response && response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        rawText = candidate.content.parts[0].text;
      }
    } else {
      // Если ничего не нашли, логируем структуру для отладки
      console.error('[Gemini] Неизвестная структура ответа:', JSON.stringify(response, null, 2));
      throw new Error("Не удалось прочитать свойство text из ответа Gemini API.");
    }

    // Убеждаемся, что rawText - строка
    rawText = String(rawText || '').trim();

    if (!rawText) {
      throw new Error("Получен пустой ответ от Gemini API");
    }

    console.log('[Gemini] Получен ответ, длина:', rawText.length);
    console.log('[Gemini] Первые 200 символов:', rawText.slice(0, 200));

    // Извлекаем JSON
    const startJson = rawText.indexOf("{");
    const endJson = rawText.lastIndexOf("}");

    if (startJson !== -1 && endJson !== -1) {
      rawText = rawText.substring(startJson, endJson + 1);
    } else {
      console.error('[Gemini] Ответ не содержит JSON:', rawText);
      throw new Error("ИИ не смог сформировать валидный JSON в текстовом ответе.");
    }

    // Парсим JSON
    const parsedData = JSON.parse(rawText);
    
    // Преобразуем price в число
    if (parsedData.price) {
      const priceStr = String(parsedData.price).replace(/[^0-9.,]/g, '').replace(',', '.');
      parsedData.price = parseFloat(priceStr) || null;
    }

    return parsedData;

  } catch (error) {
    console.error("[Product Parser Error]: Ошибка парсинга карточки:", error);
    throw error;
  }
}

module.exports = { parseProductWithGemini };