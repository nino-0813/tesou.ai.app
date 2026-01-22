
export enum ZodiacSign {
  Aries = '牡羊座',
  Taurus = '牡牛座',
  Gemini = '双子座',
  Cancer = '蟹座',
  Leo = '獅子座',
  Virgo = '乙女座',
  Libra = '天秤座',
  Scorpio = '蠍座',
  Sagittarius = '射手座',
  Capricorn = '山羊座',
  Aquarius = '水瓶座',
  Pisces = '魚座'
}

export interface AnalysisResult {
  title: string;
  summary: string;
  radarData: {
    leadership: number;
    communication: number;
    logical: number;
    creative: number;
    empathy: number;
  };
  categories: {
    nature: { label: string; text: string };
    love: { label: string; text: string };
    money: { label: string; text: string };
    relation: { label: string; text: string };
    life: { label: string; text: string };
  };
  detectedLines: {
    lifeLine: string;
    headLine: string;
    heartLine: string;
  };
}

export type AppState = 'landing' | 'capture' | 'zodiac' | 'loading' | 'result';
