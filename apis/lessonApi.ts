import axiosClient from './axiosClient';
import { PaginatedTracking } from './models';

export async function getTrackingByUser(
  userId: number,
  skip = 0,
  limit = 100,
): Promise<PaginatedTracking> {
  try {
    const path = `/lessons/tracking/user/${userId}`;
    const response = await axiosClient.get(path, {
      params: { skip, limit },
    });
    const data = response.data;
    if (Array.isArray(data)) {
      return { items: data, total: data.length, skip, limit };
    }
    return {
      items: data.items ?? data.results ?? [],
      total: data.total ?? data.count ?? undefined,
      skip: data.skip ?? skip,
      limit: data.limit ?? limit,
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
