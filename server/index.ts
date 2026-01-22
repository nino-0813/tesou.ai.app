import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// If you run without Vite proxy, you may want CORS. With Vite proxy, this is harmless.
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

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
  // Accept full data URL or raw base64. Default to jpeg if unknown.
  if (input.startsWith('data:')) return input;
  return `data:image/jpeg;base64,${input}`;
}

function bufferToDataUrl(buf: Buffer, mimeType: string): string {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  if (!allowed.has(mimeType)) {
    throw new Error(`Unsupported image mimeType: ${mimeType}. Allowed: jpeg/png/webp/gif`);
  }
  return `data:${mimeType};base64,${buf.toString('base64')}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// JSON: { image: "data:image/..;base64,...", zodiac: "..." }
app.post('/api/palm/analyze', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
    }

    const { image, zodiac } = req.body ?? {};
    if (!image || !zodiac) {
      return res.status(400).json({ error: 'Missing required fields: image, zodiac' });
    }

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
    if (!content) {
      return res.status(502).json({ error: 'No content from model' });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'Model returned non-JSON', raw: content });
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('API /api/palm/analyze error:', err);
    const msg = err?.message ?? 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

// Multipart: form-data { zodiac: "...", image: <file> }
app.post('/api/palm/analyze-multipart', upload.single('image'), async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
    }

    const zodiac = req.body?.zodiac;
    if (!zodiac) {
      return res.status(400).json({ error: 'Missing required field: zodiac' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Missing required file: image' });
    }

    const imageUrl = bufferToDataUrl(req.file.buffer, req.file.mimetype);
    const openai = new OpenAI({ apiKey });

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
    if (!content) {
      return res.status(502).json({ error: 'No content from model' });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'Model returned non-JSON', raw: content });
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('API /api/palm/analyze-multipart error:', err);
    const msg = err?.message ?? 'Unknown error';
    return res.status(500).json({ error: msg });
  }
});

const port = Number(process.env.API_PORT || process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});


