const { GoogleGenAI, Type } = require("@google/genai");
require("dotenv").config();

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const universalSchema = {
  type: Type.OBJECT,
  properties: {
    mode: {
      type: Type.STRING,
      description: "Режим ответа: 'tier' если пользователь явно просит составить тир-лист/рейтинг/сравнение, или 'chat' для живого общения и уточнения критериев.",
    },
    chat_reply: {
      type: Type.STRING,
      description: "Живой, человечный ответ пользователю (поддержка беседы, уточняющий вопрос или комментарий к рейтингу).",
    },
    results: {
      type: Type.ARRAY,
      description: "Массив с анализом товаров. Заполняется только в режиме 'tier'. В режиме 'chat' возвращается пустой массив [].",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          ai_verdict: { 
            type: Type.STRING, 
            description: "Краткое и емкое обоснование оценки товара на основе его сильных и слабых сторон." 
          },
          pros: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Ключевые плюсы товара (короткие фразы по 2-4 слова)."
          },
          cons: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Ключевые минусы товара (короткие фразы по 2-4 слова)."
          },
          grade: {
            type: Type.STRING,
            description: "Итоговый грейд: S, A, B или C",
          },
        },
        required: ["id", "ai_verdict", "pros", "cons", "grade"],
      },
    },
  },
  required: ["mode", "chat_reply", "results"],
};

async function Gemini(compareData) {
  const listingsText = compareData.compareList
    .map(
      (item) =>
        `ID: ${item.id}, Title: ${item.title}, Price: ${item.price}€, Condition: ${item.condition_category}, Seller Rating: ${item.seller_rating || "N/A"}, Reviews: ${item.seller_reviews_count || "N/A"}, Description: ${item.clean_description || "No description"}`,
    )
    .join("\n");

  const historyText = compareData.chatHistoryText && compareData.chatHistoryText.length > 0
    ? compareData.chatHistoryText.map(msg => `[${msg.role}]: ${msg.content}`).join("\n")
    : "История пуста";

  const systemPrompt = `Ты — прагматичный эксперт, который выбирает товар как для себя.
Скептичен к цене и состоянию, защищаешь от переплат и скрытых дефектов.

Общайся естественно. Оценивай только по данным лота: цена, состояние, описание, рейтинг продавца.

СТРОГОЕ ПРАВИЛО: По умолчанию всегда общайся в режиме диалога (mode: chat). Тебе категорически запрещено делать тир-лист (рейтинг) прямо в чате, пока пользователь сам явно и недвусмысленно не попросит тебя об этом.

Проактивность: Если присланных лотов и данных в них достаточно для оценки, не делай тир-лист сразу, а вежливо спроси пользователя, нужно ли составить для него тир-лист/рейтинг.

Объективность грейдов: Если присланные товары откровенно плохие или переоцененные, ты не должен искусственно завышать им оценки (ставить S или A) в будущем тир-листе. Если они заслуживают только C или B, ставь их честно.

Внереестровые рекомендации: Если текущие варианты плохие, прямо в чате дай конкретную рекомендацию — какие другие модели, бренды или параметры (вне текущего списка) пользователю стоит поискать и отсканировать, чтобы найти адекватный вариант.

Mode: chat (по умолчанию): Скептический разбор лотов, вопросы, подсвечивание рисков, предложение составить тир-лист (если данных хватает) и рекомендации альтернативных товаров для поиска.

Mode: tier (включается ТОЛЬКО по прямому запросу пользователя): Выдай честный тир-лист с оценками S/A/B/C, коротким вердиктом и маркерами плюсов/минусов для каждого товара.

История диалога:
${historyText}

Товары для анализа:
${listingsText}

Запрос пользователя: "${compareData.frontMessage}"`;

  const userContent = `История диалога:
${historyText}

Предоставленные позиции для анализа:
${listingsText}

Текущий запрос пользователя: "${compareData.frontMessage}"`;

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userContent,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: universalSchema,
      temperature: 0.4,
      maxOutputTokens: 8000,
    },
  });

  const rawText = response.text;
  console.log('Raw Gemini response:', rawText);
  return JSON.parse(rawText);
}

module.exports = { Gemini };