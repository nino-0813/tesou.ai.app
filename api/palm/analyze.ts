import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

function buildSystemInstruction(zodiac: string) {
  return `あなたはプロの占い師および西洋占星術師です。
提供された手相写真と、ユーザーの星座 (${zodiac}) を組み合わせて、精密な鑑定を行ってください。

回答は必ず日本語で行い、以下のJSON形式で返却してください。

【期待するJSON構造】
{
  "title": "鑑定のキャッチコピー",
  "summary": "全体的な鑑定の要約",
  "radarData": {
    "leadership": 1-10の数値,
    "communication": 1-10の数値,
    "logical": 1-10の数値,
    "creative": 1-10の数値,
    "empathy": 1-10の数値
  },
  "categories": {
    "nature": { "label": "本質", "text": "詳細テキスト" },
    "love": { "label": "恋愛", "text": "詳細テキスト" },
    "money": { "label": "金運", "text": "詳細テキスト" },
    "relation": { "label": "対人", "text": "詳細テキスト" },
    "life": { "label": "運気・生活", "text": "詳細テキスト" }
  },
  "detectedLines": {
    "lifeLine": "生命線の状態解説",
    "headLine": "知能線の状態解説",
    "heartLine": "感情線の状態解説"
  }
}`;
}

function normalizeDataUrl(input: string): string {
  if (input.startsWith('data:')) return input;
  // Accept raw base64 as jpeg fallback
  return `data:image/jpeg;base64,${input}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });

    const { image, zodiac } = (req.body ?? {}) as { image?: string; zodiac?: string };
    if (!image || !zodiac) return res.status(400).json({ error: 'Missing required fields: image, zodiac' });

    const openai = new OpenAI({ apiKey });
    const imageUrl = normalizeDataUrl(String(image));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      messages: [
        { role: 'system', content: buildSystemInstruction(String(zodiac)) },
        {
          role: 'user',
          content: [
            { type: 'text', text: `私の星座は${zodiac}です。この手相を鑑定してください。` },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'No content from model' });

    try {
      return res.status(200).json(JSON.parse(content));
    } catch {
      return res.status(502).json({ error: 'Model returned non-JSON', raw: content });
    }
  } catch (err: any) {
    console.error('Vercel /api/palm/analyze error:', err);
    return res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
}


