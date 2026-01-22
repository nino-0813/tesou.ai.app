import OpenAI from 'openai';
import { AnalysisResult, ZodiacSign } from '../types';

export async function analyzePalm(image64: string, zodiac: ZodiacSign): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not set. Please set OPENAI_API_KEY in your .env.local file.');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // ブラウザで使用する場合
  });

  const systemInstruction = `あなたはプロの占い師および西洋占星術師です。
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

  try {
    // データURLからBase64部分を抽出（プレフィックスがあってもなくても対応）
    const base64Data = image64.includes('base64,') 
      ? image64.split('base64,')[1] 
      : image64;

    // 常にJPEGとして送信（App側でJPEGに変換済み、またはここで強制指定）
    const imageUrl = `data:image/jpeg;base64,${base64Data}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // または "gpt-4-vision-preview"
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `私の星座は${zodiac}です。この手相を鑑定してください。`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    return result as AnalysisResult;
  } catch (error) {
    console.error("OpenAI Analysis Error:", error);
    throw error;
  }
}

