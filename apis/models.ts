export type CreateUserRequest = {
  username: string;
  email: string;
  image_url?: string | null;
};

export type CreateUserResponse = {
  id: number;
  username: string;
  email: string;
  image_url?: string | null;
  created_at?: string;
};
