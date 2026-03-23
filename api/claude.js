export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);

    const userMessage = body.messages?.[0]?.content;
    const prompt = typeof userMessage === 'string'
      ? userMessage
      : Array.isArray(userMessage)
        ? userMessage.map(p => p.text || '').join('\n')
        : '';

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
