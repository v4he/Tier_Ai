const express = require("express");
const pool = require("./db");
const { parseProductWithGroq } = require("./services/groqService");
require("dotenv").config();
const cors = require("cors");
const { Gemini } = require("./services/geminiService");

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
  const { url, text, imageUrl, tierListId } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const groqData = await parseProductWithGroq(text);

    const urlObj = new URL(url);
    const sourceSite = urlObj.hostname;

    const result = await pool.query(
      `INSERT INTO listings (title, price, image_url, condition_category, seller_rating, seller_reviews_count, clean_description, url, source_site)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        groqData.title,
        groqData.price,
        imageUrl,
        groqData.condition_category,
        groqData.seller_rating || null,
        groqData.seller_reviews_count || null,
        groqData.clean_description,
        url,
        sourceSite,
      ],
    );

    const addListingToTier = await pool.query(
      `INSERT INTO tier_list_items (tier_list_id, listing_id) VALUES ($1, $2)`,
      [tierListId, result.rows[0].id],
    );

    const finalResult = {
      ...groqData,
      url: url,
      image: imageUrl,
    };

    // console.log("Final Product Object:", finalResult);
    res.json({ result: finalResult });
  } catch (err) {
    console.error("Groq parsing error:", err);
    res.status(500).json({ error: "Failed to parse text with AI" });
  }
});

app.get("/api/listings/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT listings.* FROM listings JOIN tier_list_items ON listings.id = tier_list_items.listing_id WHERE tier_list_items.tier_list_id = $1 ORDER BY tier_list_items.created_at DESC`,
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
  }
});

app.get("/api/tierFolders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tier_lists ORDER BY created_at",
    );
    res.json(result.rows);
  } catch (error) {
    console.log(error);
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
  }
});

app.post("/api/compareData", async (req, res) => {
  try {
    if (req.body.userMessage !== "") {
      const userResult = await pool.query(
        "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
        [req.body.tierListId, "user", req.body.userMessage],
      );

      const result = await pool.query(
        `SELECT listings.* FROM listings JOIN tier_list_items ON listings.id = tier_list_items.listing_id WHERE tier_list_items.tier_list_id = $1`,
        [req.body.tierListId],
      );

      const chatHistoryResult = await pool.query(
        `SELECT * FROM (
     SELECT * FROM chat_messages 
     WHERE session_id = $1 
     ORDER BY created_at DESC 
     LIMIT 40
   ) sub 
   ORDER BY created_at ASC`,
        [req.body.tierListId],
      );

      const geminiVerdict = await Gemini({
        compareList: result.rows,
        frontMessage: req.body.userMessage,
        chatHistoryText: chatHistoryResult.rows,
      });

      const aiMessageText = geminiVerdict?.chat_reply || "AI reponse error";

      const geminiResult = await pool.query(
        "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
        [req.body.tierListId, "assistant", aiMessageText],
      );

      if (geminiVerdict.results.length !== 0) {
  for (const element of geminiVerdict.results) {
    console.log(element);
    console.log("000");

  
    const safePros = JSON.stringify(element.pros);
    const safeCons = JSON.stringify(element.cons);

    const result = await pool.query(
      `UPDATE tier_list_items 
       SET ai_verdict = $1, 
           pros = $2::jsonb, 
           cons = $3::jsonb, 
           grade = $4 
       WHERE listing_id = $5 RETURNING *`,
      [element.ai_verdict, safePros, safeCons, element.grade, element.id]
    );
  }
}
      res.json({ gemini: geminiVerdict });
    } else {
      res.json({ error: "user message error" });
    }
  } catch (error) {
    res.json({ gemini: "oshibka" });
    console.log(error);
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
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
