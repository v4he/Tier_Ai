const express = require("express");
const cheerio = require("cheerio");
const pool = require("./db");
const { parseProductWithGroq } = require("./services/groqService");
require("dotenv").config();
const cors = require("cors");
// ПОДКЛЮЧАЕМ НАШ СЕРВИС DEEPSEEK ВМЕСТО GEMINI
const { DeepSeekCompare } = require("./services/geminiService");

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/test-users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/parse", async (req, res) => {
  const { url, html, imageUrl, tierListId } = req.body;

  if (!html) {
    return res.status(400).json({ error: "No HTML content provided" });
  }

  try {
    console.log("[Парсер] Начинаем парсить URL:", url);
    const $ = cheerio.load(html);

    $(
      'script, style, noscript, iframe, svg, header, footer, nav, aside, form, button, ' +
      '.cookie, #cookie, [class*="cookie"], [class*="footer"], .footer, #footer, [class*="nav"]'
    ).remove();

    let cleanText = $.text();

    cleanText = cleanText
      .replace(/[\t\r]/g, " ")
      .replace(/ +/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();

    const globalCutMarkers = [
      "ces annonces peuvent vous", "voir plus d’annonces", "annonces google", 
      "publicité", "similar listings", "recommended for you", "похожие объявления",
      "vous pourriez aussi aimer", "produits similaires"
    ];

    for (let marker of globalCutMarkers) {
      const cutIndex = cleanText.toLowerCase().indexOf(marker);
      if (cutIndex !== -1 && cutIndex > 400) { 
        cleanText = cleanText.substring(0, cutIndex);
        break; 
      }
    }

    console.log(`[Парсер]: Очистка завершена. Текст сокращен с ${html.length} до ${cleanText.length} символов.`);

    // Здесь для первичного разбора карточки остается Groq/Gemini — это идеально
    const groqData = await parseProductWithGroq(cleanText);
    console.log("Ответ от Groq/Gemini:", groqData);

    const urlObj = new URL(url);
    const sourceSite = urlObj.hostname;

    const result = await pool.query(
      `INSERT INTO listings (title, price, image_url, condition_category, seller_rating, seller_reviews_count, clean_description, url, source_site)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        groqData.title || "Без названия",
        groqData.price || null,
        imageUrl,
        groqData.condition_category || "EXCELLENT",
        groqData.seller_rating || null,
        groqData.seller_reviews_count || null,
        groqData.clean_description || "",
        url,
        sourceSite,
      ],
    );

    await pool.query(
      `INSERT INTO tier_list_items (tier_list_id, listing_id) VALUES ($1, $2)`,
      [tierListId, result.rows[0].id],
    );

    const finalResult = {
      ...groqData,
      url: url,
      image: imageUrl,
    };

    res.json({ result: finalResult });
  } catch (err) {
    console.error("Parsing error в роуте:", err);
    res.status(500).json({ error: "Failed to parse text with AI" });
  }
});

app.get("/api/listings/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT listings.*, 
              tier_list_items.ai_verdict, 
              tier_list_items.pros, 
              tier_list_items.cons, 
              tier_list_items.grade 
       FROM listings 
       JOIN tier_list_items ON listings.id = tier_list_items.listing_id 
       WHERE tier_list_items.tier_list_id = $1 
       ORDER BY tier_list_items.created_at DESC`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/deleteListing", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tier_list_items WHERE tier_list_id = $1 AND listing_id = $2 RETURNING listing_id",
      [req.body.tierListId, req.body.tierCardId],
    );

    res.json(result.rows[0].listing_id);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Delete error" });
  }
});

app.get("/api/tierFolders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tl.*, 
        (
          SELECT l.image_url 
          FROM tier_list_items tli
          JOIN listings l ON l.id = tli.listing_id
          WHERE tli.tier_list_id = tl.id
          ORDER BY tli.created_at DESC
          LIMIT 1
        ) AS cover_image
      FROM tier_lists tl
      ORDER BY tl.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/tierFolderInsert", async (req, res) => {
  try {
    const result = await pool.query(
      "INSERT INTO tier_lists (title, user_id) VALUES ($1, $2) RETURNING id",
      [req.body.title, req.body.userId],
    );

    res.json({ result: result.rows[0].id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Insert error" });
  }
});

app.post("/api/tierFolderDelete", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tier_lists WHERE id = $1 RETURNING id",
      [req.body.cardId],
    );

    res.json({ result: result.rows[0].id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Delete error" });
  }
});


app.post("/api/compareData", async (req, res) => {
  try {
    const { userMessage, tierListId } = req.body;

    if (!userMessage || userMessage.trim() === "") {
      return res.status(400).json({ error: "user message error" });
    }

    await pool.query(
      "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
      [tierListId, "user", userMessage],
    );

    const listingsResult = await pool.query(
      `SELECT listings.* FROM listings 
       JOIN tier_list_items ON listings.id = tier_list_items.listing_id 
       WHERE tier_list_items.tier_list_id = $1`,
      [tierListId],
    );

    const chatHistoryResult = await pool.query(
      `SELECT * FROM (
         SELECT * FROM chat_messages 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT 30
       ) sub 
       ORDER BY created_at ASC`,
      [tierListId],
    );

    // ВЫЗЫВАЕМ СЕРВИС DEEPSEEK ВМЕСТО GEMINI
    const deepseekVerdict = await DeepSeekCompare({
      compareList: listingsResult.rows,
      frontMessage: userMessage,
      chatHistoryText: chatHistoryResult.rows, 
    });

    const aiMessageText = deepseekVerdict?.chat_reply || "AI response error";

    await pool.query(
      "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
      [tierListId, "assistant", aiMessageText],
    );

    if (deepseekVerdict.results && deepseekVerdict.results.length !== 0) {
      for (const element of deepseekVerdict.results) {
        const safePros = JSON.stringify(element.pros);
        const safeCons = JSON.stringify(element.cons);

        await pool.query(
          `UPDATE tier_list_items 
           SET ai_verdict = $1, 
               pros = $2::jsonb, 
               cons = $3::jsonb, 
               grade = $4 
           WHERE listing_id = $5 AND tier_list_id = $6 RETURNING *`,
          [element.ai_verdict, safePros, safeCons, element.grade, element.id, tierListId]
        );
      }
    }

    // Возвращаем результат. На фронтенде можешь ловить свойство "deepseek" вместо "gemini"
    res.json({ gemini: deepseekVerdict });

  } catch (error) {
    console.error("Error in compareData API (DeepSeek):", error);
    res.status(500).json({ error: "Internal server error during analysis" });
  }
});

app.get("/api/chatMessages/:id", async (req, res) => {
  if (req.params.id !== "") {
    try {
      const result = await pool.query(
        "SELECT * FROM chat_messages WHERE session_id = $1",
        [req.params.id],
      );
      res.json(result.rows);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Database error" });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});