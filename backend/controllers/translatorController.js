const axios = require('axios');

exports.translateText = async (req, res) => {
  const { text, to } = req.body;

  if (!text || !to) {
    return res.status(400).json({ error: 'Textul și limba de traducere sunt necesare.' });
  }

  try {
    const url = `${process.env.AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${to}`;

    const response = await axios.post(
      url,
      [{ Text: text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY,
          'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATOR_REGION,
          'Content-Type': 'application/json'
        }
      }
    );

    const translation = response.data?.[0]?.translations?.[0]?.text;
    if (!translation) {
      return res.status(500).json({ error: 'Nu s-a putut obține traducerea.' });
    }

    res.json({ translation });
  } catch (err) {
    console.error('Translation error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Eroare la traducere.' });
  }
};
