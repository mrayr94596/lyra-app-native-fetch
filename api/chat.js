export default async function handler(req, res) {
  console.error("🔥 Lyra chat function invoked");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // ✅ Log type and contents of req.body
    console.log("📥 Raw req.body type:", typeof req.body);
    console.log("📥 Raw req.body value:", JSON.stringify(req.body));

    // ✅ Try extracting messages safely
    let messages;
    try {
      messages = req.body?.messages;
    } catch (parseError) {
      console.error("⚠️ Failed to access req.body.messages:", parseError.message);
      return res.status(400).json({ error: 'Invalid request body format' });
    }

    console.log("📥 Extracted messages:", messages);

    // ✅ Validate messages
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    // ✅ Prepare and send request to OpenAI
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
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🛑 OpenAI call failed:", errorText);
      return res.status(500).json({ error: 'OpenAI API call failed
