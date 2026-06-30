const express = require("express");
const cheerio = require("cheerio");
const pool = require("./db");
const { parseProductWithGemini } = require("./services/geminiService");
require("dotenv").config();
const cors = require("cors");
const { DeepSeekCompare } = require("./services/deepseekService");

const { authenticate } = require("./middleware/auth");
const { validate, parseSchema, compareSchema, tierListIdSchema } = require("./middleware/validate");
const { errorHandler, logger } = require("./middleware/errorHandler");
const { hashPassword, verifyPassword, generateToken } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/test-users", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, email, created_at FROM users");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/register", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    const token = generateToken(result.rows[0].id, email);

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: result.rows[0],
      token
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/login", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      message: "Connexion réussie",
      user: { id: user.id, email: user.email },
      token
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/tierFolders",
  authenticate,
  async (req, res, next) => {
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
        WHERE tl.user_id = $1
        ORDER BY tl.created_at DESC
      `, [req.userId]);
      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/listings/:id",
  authenticate,
  validate(tierListIdSchema, 'params'),
  async (req, res, next) => {
    try {
      const folderCheck = await pool.query(
        "SELECT id FROM tier_lists WHERE id = $1 AND user_id = $2",
        [req.params.id, req.userId]
      );

      if (folderCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Accès non autorisé à cette tier list"
        });
      }

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
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

async function processProductInBackground(listingId, html, tierListId, imageUrl) {
  try {
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

    const groqData = await parseProductWithGemini(cleanText);

    await pool.query(
      `UPDATE listings 
       SET title = $1, 
           price = $2, 
           condition_category = $3, 
           seller_rating = $4, 
           seller_reviews_count = $5, 
           clean_description = $6,
           status = $7
       WHERE id = $8`,
      [
        groqData.title || "Sans titre",
        groqData.price || null,
        groqData.condition_category || "EXCELLENT",
        groqData.seller_rating || null,
        groqData.seller_reviews_count || null,
        groqData.clean_description || "",
        "completed",
        listingId
      ]
    );

    logger.info(`[Parser] Produit ${listingId} mis à jour avec succès`);

  } catch (err) {
    logger.error(`[Parser] Erreur lors du traitement du produit ${listingId}:`, err);
    await pool.query(
      `UPDATE listings SET status = $1, clean_description = $2 WHERE id = $3`,
      ["error", "Erreur lors du traitement IA", listingId]
    );
  }
}

app.post("/api/parse",
  authenticate,
  validate(parseSchema),
  async (req, res, next) => {
    const { url, html, imageUrl, tierListId } = req.body;

    if (!html) {
      return res.status(400).json({ error: "No HTML content provided" });
    }

    try {
      const folderCheck = await pool.query(
        "SELECT id FROM tier_lists WHERE id = $1 AND user_id = $2",
        [tierListId, req.userId]
      );

      if (folderCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à ajouter des produits à cette tier list"
        });
      }

      logger.info(`[Parser] Création de l\'entrée processing pour l'URL: ${url}`);

      const result = await pool.query(
        `INSERT INTO listings (title, price, image_url, condition_category, seller_rating, seller_reviews_count, clean_description, url, source_site, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          "Traitement en cours...",
          null,
          imageUrl,
          "EXCELLENT",
          null,
          null,
          "",
          url,
          new URL(url).hostname,
          "processing"
        ]
      );

      const listingId = result.rows[0].id;

      await pool.query(
        `INSERT INTO tier_list_items (tier_list_id, listing_id) VALUES ($1, $2)`,
        [tierListId, listingId]
      );

      res.json({
        result: {
          id: listingId,
          status: "processing",
          title: "Traitement en cours...",
          image: imageUrl,
          url: url
        }
      });

      processProductInBackground(listingId, html, tierListId, imageUrl);

    } catch (err) {
      next(err);
    }
  }
);

app.get("/api/listing-status/:id",
  authenticate,
  async (req, res, next) => {
    try {
      const result = await pool.query(
        "SELECT status, title, price, condition_category, seller_rating, seller_reviews_count, clean_description FROM listings WHERE id = $1",
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/deleteListing",
  authenticate,
  async (req, res, next) => {
    try {
      const { tierListId, tierCardId } = req.body;

      const folderCheck = await pool.query(
        "SELECT id FROM tier_lists WHERE id = $1 AND user_id = $2",
        [tierListId, req.userId]
      );

      if (folderCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à supprimer des produits de cette tier list"
        });
      }

      const result = await pool.query(
        "DELETE FROM tier_list_items WHERE tier_list_id = $1 AND listing_id = $2 RETURNING listing_id",
        [tierListId, tierCardId]
      );
      res.json(result.rows[0].listing_id);
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/tierFolderInsert",
  authenticate,
  async (req, res, next) => {
    try {
      const { title } = req.body;

      if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Le titre est requis" });
      }

      const result = await pool.query(
        "INSERT INTO tier_lists (title, user_id) VALUES ($1, $2) RETURNING id",
        [title.trim(), req.userId]
      );
      res.json({ result: result.rows[0].id });
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/tierFolderDelete",
  authenticate,
  async (req, res, next) => {
    try {
      const { cardId } = req.body;

      if (!cardId) {
        return res.status(400).json({ error: "ID de la tier list requis" });
      }

      const checkResult = await pool.query(
        "SELECT id FROM tier_lists WHERE id = $1 AND user_id = $2",
        [cardId, req.userId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          error: "Vous n'êtes pas autorisé à supprimer cette tier list"
        });
      }

      const result = await pool.query(
        "DELETE FROM tier_lists WHERE id = $1 RETURNING id",
        [cardId]
      );
      res.json({ result: result.rows[0].id });
    } catch (error) {
      next(error);
    }
  }
);

app.post("/api/compareData",
  authenticate,
  validate(compareSchema),
  async (req, res, next) => {
    try {
      const { userMessage, tierListId } = req.body;

      if (!userMessage || userMessage.trim() === "") {
        return res.status(400).json({ error: "user message error" });
      }

      const folderCheck = await pool.query(
        "SELECT id FROM tier_lists WHERE id = $1 AND user_id = $2",
        [tierListId, req.userId]
      );

      if (folderCheck.rows.length === 0) {
        return res.status(403).json({
          error: "Accès non autorisé à cette tier list"
        });
      }

      await pool.query(
        "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
        [tierListId, "user", userMessage]
      );

      const listingsResult = await pool.query(
        `SELECT listings.* FROM listings
         JOIN tier_list_items ON listings.id = tier_list_items.listing_id
         WHERE tier_list_items.tier_list_id = $1`,
        [tierListId]
      );

      const chatHistoryResult = await pool.query(
        `SELECT * FROM (
           SELECT * FROM chat_messages
           WHERE session_id = $1
           ORDER BY created_at DESC
           LIMIT 30
         ) sub
         ORDER BY created_at ASC`,
        [tierListId]
      );

      let deepseekVerdict;
      try {
        deepseekVerdict = await DeepSeekCompare({
          compareList: listingsResult.rows,
          frontMessage: userMessage,
          chatHistoryText: chatHistoryResult.rows,
        });
      } catch (aiError) {
        console.error("[DeepSeek] Erreur d'appel:", aiError);
        deepseekVerdict = {
          mode: 'chat',
          chat_reply: 'Désolé, le service d\'analyse est temporairement indisponible. Veuillez réessayer plus tard.',
          results: []
        };
      }

      const aiMessageText = deepseekVerdict?.chat_reply || "AI response error";

      await pool.query(
        "INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)",
        [tierListId, "assistant", aiMessageText]
      );

      if (deepseekVerdict.results && deepseekVerdict.results.length !== 0) {
        for (const element of deepseekVerdict.results) {
          const safePros = Array.isArray(element.pros)
            ? JSON.stringify(element.pros)
            : '[]';
          const safeCons = Array.isArray(element.cons)
            ? JSON.stringify(element.cons)
            : '[]';

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

      res.json({ gemini: deepseekVerdict });
    } catch (error) {
      console.error("Error in compareData API:", error);
      res.status(500).json({
        error: "Internal server error during analysis",
        details: error.message
      });
    }
  }
);

app.get("/api/chatMessages/:id",
  authenticate,
  async (req, res, next) => {
    if (req.params.id !== "") {
      try {
        const result = await pool.query(
          "SELECT * FROM chat_messages WHERE session_id = $1",
          [req.params.id]
        );
        res.json(result.rows);
      } catch (error) {
        next(error);
      }
    }
  }
);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});