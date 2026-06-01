
const { GoogleGenAI, Type  } = require('@google/genai');

require("dotenv").config();

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const jsonSchema = {
    type: Type.OBJECT,
    properties: {
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            ai_verdict: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "ai_verdict", "pros", "cons"]
        }
      }
    },
    required: ["results"]
  };




async function tierGemini(compareData) {
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
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: jsonSchema 
  }
});

  const rawText = response.text;
  const parsed = JSON.parse(rawText);


  return parsed;
}




async function chatGemini(compareData){
  console.log(compareData)

  const listingsText = compareData.compareList.map(item => 
  `ID: ${item.id}, Title: ${item.title}, Price: ${item.price}€, Condition: ${item.condition_category}, Seller Rating: ${item.seller_rating}, Reviews: ${item.seller_reviews_count}, Description: ${item.clean_description || 'No description'}`
).join('\n');



  const prompt = `Ты — ассистент по товарам. У тебя есть список товаров и история диалога с пользователем.

Вот список товаров (каждый товар содержит id, название, цену и описание):
${listingsText}

Вот последние сообщения в чате (пользователь → assistant):
${compareData.chatHistoryText}

Пользователь спрашивает: "${compareData.frontMessage}"

Ответь на вопрос пользователя, используя информацию о товарах из списка и контекст диалога.
- Если вопрос связан с конкретным товаром — ответь, опираясь на его данные.
- Если вопрос общий — ответь, используя информацию из всех товаров.
- Если нужной информации нет в списке товаров — честно скажи, что не знаешь.
- Не выдумывай характеристики, которых нет в описании товаров.
- Отвечай кратко, по делу, на том же языке, что и вопрос.`


const response = await gemini.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
})




  return response.text;
}






async function Gemini(compareData, mode) {
  if(mode === 'tier'){
    return await tierGemini(compareData)
  }
  else if(mode === 'chat'){
     return await chatGemini(compareData)
  }
}

module.exports = { Gemini }