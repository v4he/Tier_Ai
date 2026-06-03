const { GoogleGenAI, Type } = require("@google/genai");
require("dotenv").config();

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const universalSchema = {
  type: Type.OBJECT,
  properties: {
    mode: {
      type: Type.STRING,
      description:
        "Режим ответа: 'tier' если пользователь просит сравнить/оценить/создать тир-лист, или 'chat' если это обычный вопрос или беседа.",
    },
    chat_reply: {
      type: Type.STRING,
      description:
        "Текстовый ответ или вводная вежливая фраза для пользователя (например, 'Вот ваш тир-лист:' или ответ на вопрос).",
    },
    results: {
      type: Type.ARRAY,
      description:
        "Массив с анализом каждого товара. Заполняется только если mode === 'tier'. Если mode === 'chat', возвращается пустой массив.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          ai_verdict: { type: Type.STRING },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          grade: {
              type: Type.STRING,
              description: "Оценка товара: S, A, B или C",
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
        `ID: ${item.id}, Title: ${item.title}, Price: ${item.price}€, Condition: ${item.condition_category}, Seller Rating: ${item.seller_rating}, Reviews: ${item.seller_reviews_count}, Description: ${item.clean_description || "No description"}`,
    )
    .join("\n");

  const prompt = `Ты — интеллектуальный ассистент по анализу и сравнению товаров. Перед тобой список товаров и история диалога.

Вот список товаров для контекста:
${listingsText}

Вот история последних сообщений в чате (для понимания контекста):
${compareData.chatHistoryText || "История пуста"}

Текущее сообщение пользователя: "${compareData.frontMessage}"

Твоя задача — проанализировать сообщение пользователя и строго определить его намерение:

КЕЙС 1: Если пользователь просит СРАВНИТЬ товары, ОЦЕНИТЬ их, ВЫБРАТЬ лучший или СОЗДАТЬ ТИР-ЛИСТ:
1. Установи "mode": "tier"
2. В поле "chat_reply" обязательно напиши короткую вводную фразу на языке пользователя (например: "Вот ваш тир-лист и подробное сравнение товаров:", "Я проанализировал доступные варианты, вот готовый тир-лист:" или подобное).
3. В массив "results" для КАЖДОГО товара из предоставленного списка подготовь структурированный анализ (id, ai_verdict, pros, cons).

КЕЙС 2: Если пользователь задает ОБЩИЙ ВОПРОС о товарах (например: "У какого ноута больше память?", "Почему первый такой дорогой?") или просто приветствует/общается:
1. Установи "mode": "chat"
2. Сформируй краткий, точный и вежливый ответ на вопрос в поле "chat_reply", опираясь на реальные характеристики товаров. Не придумывай того, чего нет в описании.
3. Массив "results" сделай пустым [].

Верни ТОЛЬКО JSON, строго соответствующий заданной схеме. Без markdown-разметки, без лишнего текста вокруг.`;

  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: universalSchema,
      temperature: 0.2,
      maxOutputTokens: 1500,
    },
  });

  const rawText = response.text;

  return JSON.parse(rawText);
}

module.exports = { Gemini };
