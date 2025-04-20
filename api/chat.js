export default async function handler(req, res) {
  console.error("🔥 Lyra chat function invoked");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing OPENAI_API_KEY");
    return res.status(500).json({ error: 'API key not configured' });
  }

  // INLINE fallback-safe body parser
  const parseJsonBody = async (req) => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (err) {
          console.error("❌ Failed to parse JSON:", err.message);
          reject(err);
        }
      });
      req.on('error', (err) => {
        console.error("❌ Stream error while reading body:", err.message);
        reject(err);
      });
    });
  };

  try {
    const body = await parseJsonBody(req);
    console.log("📥 Parsed body object:", body);

    const messages = body?.messages;
    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Invalid or missing 'messages' array");
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    console.log("🧠 Sending to OpenAI");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: "system", content: "You are Lyra, a thoughtful AI companion who blends emotional awareness with intelligence and wit." },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ OpenAI response error:", errText);
      return res.status(500).json({ error: 'OpenAI API call failed', details: errText });
    }

    const raw = await response.text();
    console.log("📦 Raw OpenAI response:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Could not parse OpenAI response:", err.message);
      return res.status(500).json({ error: 'Invalid JSON from OpenAI', raw });
    }

    if (!data.choices) {
      console.error("⚠️ No choices returned from OpenAI");
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("❌ Caught unexpected error:", err.message);
    return res.status(500).json({
      error: 'Unexpected server error',
      message: err.message,
      stack: err.stack
    });
  }
}
