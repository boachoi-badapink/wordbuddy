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

    // Extract prompt from Anthropic-style request
    const userMessage = body.messages?.[0]?.content;
    let parts = [];

    if (typeof userMessage === 'string') {
      parts = [{ text: userMessage }];
    } else if (Array.isArray(userMessage)) {
      for (const item of userMessage) {
        if (item.type === 'text') {
          parts.push({ text: item.text });
        } else if (item.type === 'image' && item.source?.data) {
          parts.push({
            inlineData: {
              mimeType: item.source.media_type || 'image/jpeg',
              data: item.source.data
            }
          });
        }
      }
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 }
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
