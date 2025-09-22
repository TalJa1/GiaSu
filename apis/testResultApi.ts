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

export async function getResultHistory(user_id: number): Promise<any[] | null> {
  try {
    const response = await axiosClient.get(`/results/user/${user_id}`);
    const data = response.data;
    if (!data) return null;
    // Ensure we return an array when the API returns items inside an object
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return null;
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

export async function getUserMeanScore(
  user_id: number,
): Promise<{
  user_id: number;
  mean_score: number | null;
  count: number;
} | null> {
  try {
    const response = await axiosClient.get(`results/user/result/${user_id}/mean`);
    const data = response.data;
    if (!data) return null;

    const mean_score =
      data?.mean_score !== undefined && data?.mean_score !== null
        ? Number(data.mean_score)
        : null;
    const count = data?.count != null ? Number(data.count) : 0;

    return {
      user_id: Number(data.user_id ?? user_id),
      mean_score,
      count,
    };
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

export default {
  getUserProgress,
  createResult,
  getResultHistory,
  getUserMeanScore,
};
