import axiosClient from './axiosClient';
import {
  AIGenerateRequest,
  AIGenerateResponse,
  RecommendRequest,
  UniversityRecommendation,
} from './models';

export async function generateText(
  payload: AIGenerateRequest,
): Promise<AIGenerateResponse> {
  const MAX_RETRIES = 2;
  let attempt = 0;

  const normalize = (data: any): AIGenerateResponse => {
    if (!data) return { raw: data };
    if (typeof data === 'string') return { output: data, raw: data };
    // try common shapes
    if (data?.output && typeof data.output === 'string')
      return { output: data.output, raw: data, model: data.model };
    if (data?.output && typeof data.output === 'object' && typeof data.output.text === 'string')
      return { output: data.output.text, raw: data, model: data.model };
    if (data?.choices && Array.isArray(data.choices)) {
      // OpenAI-like response
      const first = data.choices[0];
      if (typeof first?.text === 'string') return { output: first.text, raw: data, model: data.model || data.model_name };
      if (typeof first?.message?.content === 'string') return { output: first.message.content, raw: data, model: data.model || data.model_name };
    }
    if (typeof data?.text === 'string') return { output: data.text, raw: data, model: data.model };
    if (typeof data?.result === 'string') return { output: data.result, raw: data, model: data.model };

    return { raw: data };
  };

  while (attempt <= MAX_RETRIES) {
    try {
      // forward any necessary headers (example: Authorization, Content-Type already set in axios client)
      const res = await axiosClient.post('/ai/generate', payload, {
        headers: {
          Accept: 'application/json',
        },
      });

      return normalize(res?.data ?? {});
    } catch (err: any) {
      attempt += 1;
      // retry on network errors or 5xx server errors
  const isNetwork = !!err?.request && !err?.response;
  const respStatus = err?.response?.status;
  const isServerError = respStatus && respStatus >= 500 && respStatus < 600;

      if (attempt <= MAX_RETRIES && (isNetwork || isServerError)) {
        const backoff = 500 * 2 ** (attempt - 1);
        console.warn(`[AIApi] generateText retry #${attempt} after ${backoff}ms`, err?.message || err);
  await new Promise<void>((resolve) => setTimeout(() => resolve(), backoff));
        continue;
      }

      if (err?.response) {
        const status = err.response.status;
        const data = err.response.data;
        throw new Error(`AI API Error ${status}: ${JSON.stringify(data)}`);
      }
      if (err?.request) {
        throw new Error(`AI Network Error: ${err.message || 'no response received'}`);
      }
      throw new Error(err?.message ?? 'Unknown AI error');
    }
  }

  // should not reach here
  return { raw: null };
}

// export default will be attached at the bottom after all helpers are defined

export async function recommendUniversities(
  payload: RecommendRequest,
): Promise<UniversityRecommendation[]> {
  try {
    const res = await axiosClient.post('/ai/recommend', payload);
    const data = res?.data ?? {};

    // If API returns array directly
    if (Array.isArray(data)) return data as UniversityRecommendation[];

    // If API returns structured { output: '...' }
    let maybe = null as any;
    if (data?.output) maybe = data.output;
    else if (typeof data === 'string') maybe = data;
    else if (data?.raw && typeof data.raw === 'string') maybe = data.raw;

    // If the output is already an array in object form
    if (Array.isArray(maybe)) return maybe as UniversityRecommendation[];

    // If the output is a string containing JSON, try to extract JSON
    if (typeof maybe === 'string') {
      const text: string = maybe;

      // 1) Try to extract JSON from fenced code blocks (```json ... ``` or ``` ... ```)
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      let candidate = codeBlockMatch ? codeBlockMatch[1].trim() : text;

      // 2) Try to find a JSON array substring
      const arrMatch = candidate.match(/\[[\s\S]*\]/m);
      if (arrMatch) {
        try {
          const parsed = JSON.parse(arrMatch[0]);
          if (Array.isArray(parsed)) return normalizeRecs(parsed);
        } catch (e) {
          // fallthrough to normalization attempts
        }
      }

      // 3) Try to parse the whole candidate as JSON (with mild normalization)
      const tryParseNormalized = (s: string) => {
        // remove trailing commas before ] or }
        let t = s.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
        // replace smart quotes and single quotes around keys/strings with double quotes
        t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        // naive single-quote -> double-quote replacement for JSON-like text
        t = t.replace(/'(.*?)'/g, '"$1"');
        try {
          const parsed = JSON.parse(t);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          // ignore
        }
        return null;
      };

      const parsedWhole = tryParseNormalized(candidate);
      if (parsedWhole) return normalizeRecs(parsedWhole);

      // 4) As a last fallback, try to parse common provider fields containing text (choices, etc.)
      if (data?.choices && Array.isArray(data.choices) && typeof data.choices[0]?.text === 'string') {
        const text2 = data.choices[0].text;
        const arrMatch2 = text2.match(/\[[\s\S]*\]/m);
        if (arrMatch2) {
          try {
            const parsed = JSON.parse(arrMatch2[0]);
            if (Array.isArray(parsed)) return normalizeRecs(parsed);
          } catch (e) {
            // ignore
          }
        }
      }

      // 5) Markdown/list parsing fallback: convert a markdown bullet/numbered list into recommendations
      const mdParsed = parseMarkdownListToRecs(text);
      if (mdParsed.length) return mdParsed;
    }

    // Last resort: if data contains a 'choices' style
    if (
      data?.choices &&
      Array.isArray(data.choices) &&
      typeof data.choices[0]?.text === 'string'
    ) {
      const text = data.choices[0].text;
      const arrMatch = text.match(/\[[\s\S]*\]/m);
      if (arrMatch) {
        try {
          const parsed = JSON.parse(arrMatch[0]);
          if (Array.isArray(parsed))
            return parsed as UniversityRecommendation[];
        } catch (e) {
          // ignore
        }
      }
    }

    // If nothing matched, return empty array and include raw for debugging
    return [];
  } catch (err: any) {
    if (err?.response) {
      const status = err.response.status;
      const data = err.response.data;
      throw new Error(`API Error ${status}: ${JSON.stringify(data)}`);
    }
    if (err?.request) {
      throw new Error(
        `Network Error: ${err.message || 'no response received'}`,
      );
    }
    throw new Error(err?.message ?? 'Unknown error');
  }
}

function normalizeRecs(arr: any[]): UniversityRecommendation[] {
  return arr
    .filter(Boolean)
    .map((it: any) => {
      if (typeof it === 'string') return { name: it } as UniversityRecommendation;
      const name = it.name || it.school || it.university || (typeof it === 'string' ? it : undefined);
      const reason = it.reason || it.description || it.excerpt || it.details || undefined;
      let score: number | undefined;
      if (typeof it.score === 'number') score = it.score;
      else if (typeof it.score === 'string') {
        const m = it.score.match(/([0-9]*\.?[0-9]+)/);
        if (m) score = Number(m[1]);
      }
      return { name, reason, score } as UniversityRecommendation;
    })
    .filter((r) => r.name);
}

function parseMarkdownListToRecs(text: string): UniversityRecommendation[] {
  const lines = text.split(/\r?\n/);
  const items: string[] = [];
  let cur: string | null = null;
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (cur) {
        items.push(cur.trim());
        cur = null;
      }
      continue;
    }
    const listMatch = line.match(/^(-|\*|\d+\.)\s+(.*)$/);
    if (listMatch) {
      if (cur) items.push(cur.trim());
      cur = listMatch[2];
    } else if (cur) {
      cur += ' ' + line;
    }
  }
  if (cur) items.push(cur.trim());

  const recs: UniversityRecommendation[] = items.map((it) => {
    // try patterns: "Name: reason (score: 0.95)" or "Name - reason (score: 95%)"
    let name = undefined as string | undefined;
    let reason = undefined as string | undefined;
    let score = undefined as number | undefined;

    // extract score if present
    const scoreMatch = it.match(/\(?score[:\s]*([0-9]*\.?[0-9]+)(%?)\)?/i);
    if (scoreMatch) {
      const raw = scoreMatch[1];
      const isPct = scoreMatch[2] === '%';
      const n = Number(raw);
      score = isPct ? n / 100 : n;
      // remove score fragment from string
      it = it.replace(scoreMatch[0], '').trim();
    }

    // split name and reason
    const sepMatch = it.match(/^([^:\-–—]+)[:\-–—]\s*(.*)$/);
    if (sepMatch) {
      name = sepMatch[1].trim();
      reason = sepMatch[2].trim();
    } else {
      // maybe "Name (Reason...)" or "Name — reason"
      const paren = it.match(/^([^()]+)\((.*)\)$/);
      if (paren) {
        name = paren[1].trim();
        reason = paren[2].trim();
      } else {
        // fallback: first sentence is name, rest is reason
        const firstColon = it.indexOf(':');
        if (firstColon > 0) {
          name = it.slice(0, firstColon).trim();
          reason = it.slice(firstColon + 1).trim();
        } else {
          // last resort: entire line as name
          name = it.trim();
        }
      }
    }

    return { name: name ?? '', reason, score } as UniversityRecommendation;
  });

  return recs.filter((r) => r.name && r.name.length > 0);
}

const AIApi = {
  generateText,
  recommendUniversities,
};

export default AIApi;
