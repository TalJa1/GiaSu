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
  lesson_id: number;
  is_finished?: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface PaginatedTracking {
  items: TrackingEntry[];
  total?: number;
  skip?: number;
  limit?: number;
}

export type AIGenerateRequest = {
  prompt: string;
  [key: string]: any;
};

export type AIGenerateResponse = {
  output?: string;
  raw?: any;
};

export type UniversityRecommendation = {
  name: string;
  reason?: string;
  score?: number | null;
  [key: string]: any;
};

export type RecommendRequest = {
  major: string;
  interests?: string;
  location?: string;
  limit?: number;
  [key: string]: any;
};

export type Score = {
  id?: number;
  university_id?: number;
  year?: number;
  min_score?: number | null;
  avg_score?: number | null;
  max_score?: number | null;
  [key: string]: any;
};

export type University = {
  id: number;
  name: string;
  location?: string;
  type?: string;
  description?: string;
  // new: scores array with historical/yearly score metadata
  scores?: Score[];
  [key: string]: any;
};

export type GetUniversitiesOptions = {
  skip?: number;
  limit?: number;
};

export type Lesson = {
  id: number;
  title?: string;
  description?: string;
  content?: string;
  subject?: string;
  content_url?: string;
  created_by?: number;
  created_at?: string;
  [key: string]: any;
};

export type GetLessonsOptions = {
  skip?: number;
  limit?: number;
};

export type Quizlet = {
  id?: number;
  lesson_id?: number;
  question?: string;
  answer?: string;
  created_at?: string;
  [key: string]: any;
};

export type GetQuizletsOptions = {
  skip?: number;
  limit?: number;
};

export type TestQuestion = {
  id: number;
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_options?: string[];
  points?: number;
  question_type?: string;
};

export type TestItem = {
  id: number;
  title: string;
  description?: string;
  created_by?: number;
  created_at?: string;
  supports_multiple_answers?: boolean;
  questions?: TestQuestion[];
};