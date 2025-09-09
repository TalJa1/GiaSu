import axiosClient from './axiosClient';
import { GetUniversitiesOptions, University } from './models';

export async function getUniversities(
  opts: GetUniversitiesOptions = {},
): Promise<University[]> {
  const { skip = 0, limit = 100 } = opts;
  try {
    const res = await axiosClient.get<University[]>('/universities/', {
      params: { skip, limit },
    });
    return res.data;
  } catch (err) {
    console.error('[universityApi] getUniversities error:', err);
    throw err;
  }
}

export default { getUniversities };
