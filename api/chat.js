export default async function handler(req, res) {
  console.error("🔥 Lyra chat function invoked");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("❌ No API key found in environment");
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log("📥 Raw req.body type:", typeof req.body);
    console.log("📥 Raw req.body value:", JSON.stringify(req.body));

    // Try accessing messages
    let messages;
    try {
      messages = req.body?.messages;
    } catch (e) {
      console.error("❌ Failed to parse or access req.body.messages:", e.message);
      return res.status(400).json({ error: 'Invalid request body format' });
    }

    console.log("📩 Extracted messages:", messages);

    if (!Array.isArray(messages)) {
      console.error("❌ Messages is not a valid array:", messages);
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    const payload = {
      model: 'gpt-4',
      messages: [
        {
          role: "system",
          content: "You are Lyra, a thoughtful AI companion who blends emotional awareness with intelligence and wit."
        },
        ...messages
      ]
    };

    console.log("🚀 Sending payload to OpenAI:", JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("❌ OpenAI API call failed. Status:", response.status);
      console.error("📦 OpenAI error body:", raw);
      return res.status(500).json({ error: 'OpenAI API call failed', details: raw });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Failed to parse OpenAI response:", e.message);
      return res.status(500).json({ error: 'Invalid JSON from OpenAI', raw });
    }

    console.log("✅ OpenAI response parsed successfully:", JSON.stringify(data, null, 2));

    if (!data.choices) {
      console.warn("⚠️ No choices returned from OpenAI");
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("❌ Unexpected error in API route:", error);
    return res.status(500).json({
      error: 'Unexpected server error',
      message: error.message,
      stack: error.stack
    });
  }
}
