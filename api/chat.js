import { parseJsonBody } from './utils/parseBody.js';

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
    const body = await parseJsonBody(req);
    console.log("📥 Parsed body:", body);

    const messages = body?.messages;
    console.log("📥 Extracted messages:", messages);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }
