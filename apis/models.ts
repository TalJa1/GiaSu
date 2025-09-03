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


export interface UserPrefInput {
  user_id: number;
  preferred_major: string;
  current_score: number;
  expected_score: number;
}

export interface UserPref extends UserPrefInput {
  id?: number;
  // server may return additional fields (created_at, updated_at, etc.)
  [key: string]: any;
}