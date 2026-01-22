
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ZodiacSign } from "../types";

export async function analyzePalm(image64: string, zodiac: ZodiacSign): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    あなたはプロの占い師および西洋占星術師です。
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
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: `私の星座は${zodiac}です。この手相を鑑定してください。` },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image64.split(',')[1] || image64
              }
            }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            radarData: {
              type: Type.OBJECT,
              properties: {
                leadership: { type: Type.NUMBER },
                communication: { type: Type.NUMBER },
                logical: { type: Type.NUMBER },
                creative: { type: Type.NUMBER },
                empathy: { type: Type.NUMBER }
              }
            },
            categories: {
              type: Type.OBJECT,
              properties: {
                nature: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, text: { type: Type.STRING } } },
                love: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, text: { type: Type.STRING } } },
                money: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, text: { type: Type.STRING } } },
                relation: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, text: { type: Type.STRING } } },
                life: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, text: { type: Type.STRING } } }
              }
            },
            detectedLines: {
              type: Type.OBJECT,
              properties: {
                lifeLine: { type: Type.STRING },
                headLine: { type: Type.STRING },
                heartLine: { type: Type.STRING }
              }
            }
          },
          required: ["title", "summary", "radarData", "categories", "detectedLines"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
