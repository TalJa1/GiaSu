import axiosClient from './axiosClient';
import {
  PaginatedTracking,
  TrackingEntry,
  Lesson,
  GetLessonsOptions,
} from './models';

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

export async function getLessonsCount(): Promise<number> {
  try {
    const response = await axiosClient.get('/lessons/count');
    const data = response.data;
    if (data && typeof data.count === 'number') return data.count;
    if (typeof data === 'number') return data;
    throw new Error('Unexpected response shape for lessons count');
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

export async function getTrackingEntriesByUser(
  userId: number,
  skip = 0,
  limit = 100,
): Promise<TrackingEntry[]> {
  try {
    const data = await getTrackingByUser(userId, skip, limit);
    return data.items ?? [];
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

export async function getLessons(
  options: GetLessonsOptions = { skip: 0, limit: 100 },
): Promise<{ items: Lesson[]; total?: number; skip?: number; limit?: number }> {
  try {
    const response = await axiosClient.get('/lessons', {
      params: { skip: options.skip ?? 0, limit: options.limit ?? 100 },
    });
    const data = response.data;
    if (Array.isArray(data)) {
      return {
        items: data as Lesson[],
        total: data.length,
        skip: options.skip,
        limit: options.limit,
      };
    }
    return {
      items: data.items ?? data.results ?? [],
      total: data.total ?? data.count ?? undefined,
      skip: data.skip ?? options.skip,
      limit: data.limit ?? options.limit,
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

export async function getAllLessons(skip = 0, limit = 100): Promise<Lesson[]> {
  try {
    const pag = await getLessons({ skip, limit });
    return pag.items ?? [];
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
