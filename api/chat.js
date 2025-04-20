export default async function handler(req, res) {
  console.error("🔥 Lyra chat function invoked");
  
if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages array' });
  }

  try {
   console.log("🧪 About to send to OpenAI:");
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
          ...(Array.isArray(messages) ? messages : [])

        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'OpenAI API call failed', details: errorText });
    }

const raw = await response.text();
console.log("📦 Raw response from OpenAI:", raw);

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error("❌ Failed to parse JSON from OpenAI:", e.message);
  return res.status(500).json({ error: 'Invalid JSON response from OpenAI', raw });
}


if (!data.choices) {
  console.error("⚠️ No choices returned from OpenAI");
}

return res.status(200).json(data);

} catch (error) {
  console.error("❌ Unexpected server error:", error);
  return res.status(500).json({ error: 'Unexpected server error', message: error.message });
}

}