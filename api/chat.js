export default async function handler(req, res) {
  console.error("🔥 Lyra chat function invoked");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // ✅ Inline JSON body parser
  const parseJsonBody = async (req) => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Failed to parse JSON body: ' + err.message));
        }
      });
      req.on('error', reject);
    });
  };

  try {
    const body = await parseJsonBody(req);
    console.log("📥 Parsed body:", body);

    const messages = body?.messages;
    console.log("📥 Extracted messages:", messages);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    console.log("🧪 Sending to OpenAI:");
    console.log("Model: gpt-4");
    console.log("Messages:", JSON.stringify(messages, null, 2));

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
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🛑 OpenAI call failed:", errorText);
      return res.status(500).json({ error: 'OpenAI API call failed', details: errorText });
    }

    const raw = await response.text();
    console.log("📦 Raw response from OpenAI:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Failed to parse OpenAI JSON:", e.message);
      return res.status(500).json({ error: 'Invalid JSON from OpenAI', raw });
    }

    if (!data.choices) {
      console.error("⚠️ No choices returned from OpenAI");
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("❌ Unexpected server error:", error);
    return res.status(500).json({
      error: 'Unexpected server error',
      message: error.message,
      stack: error.stack
    });
  }
}
