import axiosClient from './axiosClient';
import { UserPrefInput, UserPref } from './models';

export async function createUserPref(
  payload: UserPrefInput,
): Promise<UserPref> {
  try {
    const response = await axiosClient.post('/prefs/', payload);
    return response.data as UserPref;
  } catch (err: any) {
    // Normalize error for callers
    if (err?.response) {
      // API returned an error status
      const status = err.response.status;
      const data = err.response.data;
      throw new Error(`API Error ${status}: ${JSON.stringify(data)}`);
    }

    if (err?.request) {
      // Request made but no response
      throw new Error(
        `Network Error: ${err.message || 'no response received'}`,
      );
    }

    // Something else happened
    throw new Error(err?.message ?? 'Unknown error');
  }
};
