import axiosClient from './axiosClient';
import { Quizlet, GetQuizletsOptions } from './models';

export async function getQuizlets(
  options: GetQuizletsOptions = { skip: 0, limit: 100 },
): Promise<{
  items: Quizlet[];
  total?: number;
  skip?: number;
  limit?: number;
}> {
  try {
    const response = await axiosClient.get('/quizlets', {
      params: { skip: options.skip ?? 0, limit: options.limit ?? 100 },
    });
    const data = response.data;
    if (Array.isArray(data)) {
      return {
        items: data as Quizlet[],
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

export async function getAllQuizlets(
  skip = 0,
  limit = 100,
): Promise<Quizlet[]> {
  try {
    const pag = await getQuizlets({ skip, limit });
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

export async function getQuizletsByLesson(
  lessonId: number,
): Promise<Quizlet[]> {
  try {
    const response = await axiosClient.get(`/quizlets/lesson/${lessonId}`);
    const data = response.data;
    if (Array.isArray(data)) return data as Quizlet[];
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
