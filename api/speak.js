// /api/speak.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("❌ Missing OpenAI API key");
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or invalid text input' });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        voice: "nova",
        input: text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("🔊 TTS API Error:", error);
      return res.status(500).json({ error: 'TTS request failed', details: error });
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store'); // prevent caching
    res.status(200).send(buffer);
  } catch (err) {
    console.error("❌ Unexpected TTS error:", err);
    res.status(500).json({ error: 'Unexpected error during TTS request', message: err.message });
  }
}
