// Ruta de noticias: obtiene los titulares deportivos desde la API de GNews
const router = require('express').Router();

router.get('/', async (req, res) => {
  try {
    const url = `https://gnews.io/api/v4/top-headlines?category=sports&lang=es&max=12&apikey=${process.env.NEWS_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GNews status ${response.status}`);
    const data = await response.json();
    res.render('noticias/index', { articles: data.articles || [] });
  } catch (err) {
    console.error('GNews API error:', err.message);
    res.render('noticias/index', { articles: [] });
  }
});

module.exports = router;
