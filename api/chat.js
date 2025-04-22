import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  console.error("🔥 Lyra chat function invoked");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const userId = req.headers['x-user-id'] || 'demo-user'; // Replace with auth logic later if needed

  if (!apiKey) {
    console.error("❌ No API key found in environment");
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array' });
    }

    // Retrieve memory for the user
    const { data: memoryData, error: memoryError } = await supabase
      .from('lyra_memory')
      .select('memory_value')
      .eq('user_id', userId)
      .eq('memory_key', 'long_term')
      .single();

    const memoryContent = memoryData?.memory_value || '';
    console.log("🧠 Retrieved memory:", memoryContent);

    // Insert memory as a system message if available
    const systemMessages = [
      {
        role: "system",
        content: `You are Lyra, a thoughtful AI companion who blends emotional awareness with intelligence and wit. This user prefers to be called Michael. ${
          memoryContent ? `Here’s what you remember about them: ${memoryContent}` : ''
        }`
      }
    ];

    const payload = {
      model: 'gpt-4',
      messages: [...systemMessages, ...messages]
    };

    console.log("🚀 Sending to OpenAI:", JSON.stringify(payload, null, 2));

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
      console.error("❌ OpenAI API call failed:", raw);
      return res.status(500).json({ error: 'OpenAI API call failed', details: raw });
    }

    const data = JSON.parse(raw);
    const reply = data.choices?.[0]?.message?.content || '';
    console.log("💬 Lyra's reply:", reply);

    // Extract and update memory if the reply suggests something should be remembered
    const memoryTrigger = reply.match(/\[Remember:([^\]]+)\]/i);
    if (memoryTrigger) {
      const newMemory = memoryTrigger[1].trim();
      console.log("📝 Updating memory with:", newMemory);

      const { error: upsertError } = await supabase
        .from('lyra_memory')
        .upsert({
          user_id: userId,
          memory_key: 'long_term',
          memory_value: newMemory
        }, { onConflict: ['user_id', 'memory_key'] });

      if (upsertError) {
        console.error("❌ Memory update failed:", upsertError.message);
      } else {
        console.log("✅ Memory updated");
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return res.status(500).json({
      error: 'Unexpected server error',
      message: error.message,
      stack: error.stack
    });
  }
}
