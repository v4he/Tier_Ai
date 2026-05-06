const axios = require("axios");

require("dotenv").config();


async function callGroq(htmlContent) {
  const groq_url = "https://api.groq.com/openai/v1/chat/completions";
  const data = {
    model: "llama-3.3-70b-versatile",

    messages: [
      { role: "system", content: `Ты — парсер товаров с сайтов объявлений.
Удали весь мусор из HTML: скрипты, стили, рекламу, навигацию, куки, футеры.
Из чистой информации о товаре извлеки:

title (название, строка)

price (число)

image_url (ссылка на главное фото, если есть)

condition_category (одно из: EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR — на основе текста о состоянии)

Верни ТОЛЬКО JSON. Если какое-то поле не найдено — не включай его в JSON.` },
      { role: "user", content: htmlContent },
    ],

    temperature: 0,

    response_format: { type: "json_object" },
  };

  const headers = {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  };

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions", data, {headers}
  );
  return JSON.parse(response.data.choices[0].message.content);
}



async function parseProductWithGroq(htmlContent) {
  return await callGroq(htmlContent)
}


module.exports = { parseProductWithGroq };