import axiosClient from './axiosClient';
import { CreateResultPayload, UserProgress } from './models';

export async function getUserProgress(
  user_id: number,
): Promise<UserProgress | null> {
  try {
    const response = await axiosClient.get(`/results/progress/${user_id}`);
    const data = response.data;
    if (!data) return null;
    return data as UserProgress;
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

export async function createResult(payload: CreateResultPayload): Promise<any> {
  try {
    const response = await axiosClient.post('/results/', payload);
    return response.data;
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

export default { getUserProgress, createResult };
