import axiosClient from './axiosClient';
import { AIGenerateRequest, AIGenerateResponse } from './models';

export async function generateText(
  payload: AIGenerateRequest,
): Promise<AIGenerateResponse> {
  try {
    const res = await axiosClient.post('/ai/generate', payload);
    // Some backends may return the text in different shapes. Try to normalize.
    const data = res?.data ?? {};
    // Common shapes: { output: 'text' } or { output: { text: '...' } } or { raw: {...} }
    if (typeof data === 'string') return { output: data };
    if (data?.output && typeof data.output === 'string')
      return { output: data.output, raw: data };
    if (
      data?.output &&
      typeof data.output === 'object' &&
      typeof data.output.text === 'string'
    )
      return { output: data.output.text, raw: data };
    // try provider-specific fields
    if (data?.choices && Array.isArray(data.choices) && data.choices[0]?.text)
      return { output: data.choices[0].text, raw: data };

    // fallback: try to stringify a likely field
    const possibleText = data?.text || data?.result || data?.message;
    if (typeof possibleText === 'string')
      return { output: possibleText, raw: data };

    return { raw: data };
  } catch (err: any) {
    // normalize error like other apis in the repo
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

export default { generateText };
