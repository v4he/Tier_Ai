const express = require('express');
const pool = require('./db');
const { parseProductWithGroq } = require('./services/groqService');
const { fetchHtml } = require('./services/fetchHtml')
require('dotenv').config();

const app = express();
app.use(express.json());

app.get('/test-users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/parse', async (req, res) => {
  const url = req.body.url;
  console.log('Downloading:', url);

  const html = await fetchHtml(url);
  const result = await parseProductWithGroq(html);
  console.log('groq result:', result);

  res.json({ result});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});