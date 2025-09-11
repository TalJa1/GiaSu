import axiosClient from './axiosClient';
import { TestItem } from './models';

export async function getTests(): Promise<TestItem[]> {
  try {
    const response = await axiosClient.get('/api/v1/tests/');
    const data = response.data;
    if (!data) return [];
    if (Array.isArray(data)) return data as TestItem[];
    return data.items ?? data.results ?? [];
  } catch (err: any) {
    if (err?.response) {
      throw new Error(
        `API Error ${err.response.status}: ${JSON.stringify(
          err.response.data,
        )}`,
      );
    }
    if (err?.request) {
      throw new Error(`Network Error: ${err.message || 'no response'}`);
    }
    throw new Error(err?.message ?? 'Unknown error');
  }
}

export default { getTests };
