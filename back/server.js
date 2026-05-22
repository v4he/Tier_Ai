const express = require("express");
const pool = require("./db");
const { parseProductWithGroq } = require("./services/groqService");
require("dotenv").config();
const cors = require('cors');


const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://твой-сайт.com']
}));


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
  const { url, text, imageUrl } = req.body;
  console.log("Received URL:", url);
  console.log("Received Image:", imageUrl);

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const groqData = await parseProductWithGroq(text);
    console.log(groqData);
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
    

    const finalResult = {
      ...groqData,
      url: url,
      image: imageUrl,
    };

    console.log("Final Product Object:", finalResult);
    res.json({ result: finalResult });
  } catch (err) {
    console.error("Groq parsing error:", err);
    res.status(500).json({ error: "Failed to parse text with AI" });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM listings ORDER BY id DESC');
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({error: err.message});
  }
  
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


