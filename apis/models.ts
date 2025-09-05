export type CreateUserRequest = {
  username: string;
  email: string;
  image_url?: string | null;
  role: string;
};

export type CreateUserResponse = {
  id: number;
  username: string;
  email: string;
  image_url?: string | null;
  created_at?: string;
  role: string;
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

export interface TrackingEntry {
  id: number;
  user_id: number;
  lesson_id?: number;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

export interface PaginatedTracking {
  items: TrackingEntry[];
  total?: number;
  skip?: number;
  limit?: number;
}