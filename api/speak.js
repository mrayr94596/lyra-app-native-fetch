export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

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
    console.error("TTS API Error:", error);
    return res.status(500).json({ error: 'TTS request failed', details: error });
  }

  const audioBuffer = await response.arrayBuffer();
  res.setHeader('Content-Type', 'audio/mpeg');
  res.status(200).send(Buffer.from(audioBuffer));
}
