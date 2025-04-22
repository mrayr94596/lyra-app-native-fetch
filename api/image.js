// api/image.js

export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ DALL·E API error:", data);
      return res.status(500).json({ error: data.error?.message || 'Image generation failed' });
    }

    const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.image_url;
    if (!imageUrl) {
      console.error("⚠️ No image URL returned from DALL·E:", data);
      return res.status(500).json({ error: 'No image URL returned' });
    }

    return res.status(200).json({ imageUrl });

  } catch (err) {
    console.error("❌ Unexpected image error:", err);
    return res.status(500).json({ error: 'Unexpected error', message: err.message });
  }
}
