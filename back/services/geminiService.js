
const { GoogleGenAI } = require('@google/genai');

require("dotenv").config();

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



async function callGemini(compareData) {

  const listingsText = compareData.compareList.map(item => 
  `ID: ${item.id}, Title: ${item.title}, Price: ${item.price}€, Condition: ${item.condition_category}, Seller Rating: ${item.seller_rating}, Reviews: ${item.seller_reviews_count}, Description: ${item.clean_description || 'No description'}`
).join('\n');
  
  const prompt = `Ты — эксперт по сравнению товаров.

Пользователь задал вопрос: "${compareData.frontMessage}"

Вот список товаров (каждый товар содержит id, название, цену, состояние, рейтинг продавца, количество отзывов и чистое описание):

${listingsText}

Твоя задача:
1. Если пользователь задал вопрос — ответь на него, используя этот список товаров.
2. Если вопрос пустой или его нет — выбери лучший товар по соотношению цена/качество, учитывая состояние, рейтинг продавца и описание.
3. Для КАЖДОГО товара из списка верни:
   - ai_verdict: почему этот товар хорош (или плох) для запроса пользователя (1-2 предложения).
   - pros: массив строк (3-5 пунктов) с преимуществами товара.
   - cons: массив строк (3-5 пунктов) с недостатками товара.

Верни ТОЛЬКО JSON без лишнего текста, пояснений, markdown или комментариев.

Формат ответа:
{
  "results": [
    {
      "id": <число>,
      "ai_verdict": "строка",
      "pros": ["строка", "строка", ...],
      "cons": ["строка", "строка", ...]
    }
  ]
}

Пример вывода (только для примера, не копируй в реальный ответ):
{
  "results": [
    {
      "id": 101,
      "ai_verdict": "Лучший выбор: цена низкая, состояние отличное, подходит для игр.",
      "pros": ["Цена ниже рынка", "16GB RAM", "SSD 512GB"],
      "cons": ["Нет зарядки", "Царапина на крышке"]
    },
    {
      "id": 102,
      "ai_verdict": "Слишком дорогой для своего состояния, не рекомендую.",
      "pros": ["Большой экран", "Гарантия 1 год"],
      "cons": ["Высокая цена", "Маленький SSD", "Старый процессор"]
    }
  ]
}`;

  const response = await gemini.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    
  });

  const rawText = response.text;
  const parsed = JSON.parse(rawText);


  return parsed;
}



async function compareWithGemini(compareData) {
  return await callGemini(compareData)
}

module.exports = { compareWithGemini }