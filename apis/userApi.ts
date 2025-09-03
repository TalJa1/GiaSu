import axiosClient from './axiosClient';
import { CreateUserRequest, CreateUserResponse } from './models';

export async function createUser(
  payload: CreateUserRequest,
): Promise<CreateUserResponse> {
  if (!payload || !payload.username || !payload.email) {
    throw new Error('username and email are required to create a user');
  }

  try {
    const res = await axiosClient.post<CreateUserResponse>('/users/', payload);
    return res.data;
  } catch (err: any) {
    if (err.response && err.response.data) {
      throw err.response.data;
    }
    throw err;
  }
}
export async function getUserByEmail(
  email: string,
): Promise<CreateUserResponse | null> {
  if (!email) throw new Error('email is required');
  try {
    const res = await axiosClient.get<CreateUserResponse>(
      `/users/email/${email}`,
    );
    return res.data;
  } catch (err: any) {
    // If not found return null, otherwise rethrow
    if (err.response && err.response.status === 404) return null;
    if (err.response && err.response.data) throw err.response.data;
    throw err;
  }
}

export default {
  createUser,
  getUserByEmail,
};
