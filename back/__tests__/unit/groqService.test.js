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
condition_category (одно из: EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR — на основе текста о состоянии)
seller_rating (число от 0 до 5, если в тексте страницы есть оценка продавца или средний рейтинг товара — извлеки как число с одной десятой, например 4.5, иначе не включай)
seller_reviews_count (целое число, количество отзывов о продавце или товаре, если указано — например «127 отзывов», «89 avis» — иначе не включай)
clean_description (свободный текст на языке объявления, содержащий ТОЛЬКО конкретные факты, которые влияют на ценность товара: что делает его лучше, что делает его хуже, любые характеристики, особенности, комплектацию, дефекты, а также детали, которые могут быть важны покупателю — не добавляй общих фраз, только факты из страницы)

Верни ТОЛЬКО JSON. Если какое-то поле не найдено — не включай его в JSON. Не выдумывай ничего от себя.` },
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