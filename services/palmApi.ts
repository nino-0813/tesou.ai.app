import { AnalysisResult, ZodiacSign } from '../types';

export async function analyzePalm(image64: string, zodiac: ZodiacSign): Promise<AnalysisResult> {
  const res = await fetch('/api/palm/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: image64, zodiac }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error ? `: ${j.error}` : '';
    } catch {
      // ignore
    }
    throw new Error(`API error (${res.status})${detail}`);
  }

  return (await res.json()) as AnalysisResult;
}


