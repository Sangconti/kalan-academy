// ============================================================
// KALAN ACADEMY — Types TypeScript
// ============================================================

// ----------------------- AUTH / PROFILES -----------------------
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  class_id: string;
  role: 'student' | 'admin' | 'teacher';
  orange_money_id: string | null;
  is_premium: boolean;
  premium_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile {
  id: string;
  email: string;
  profile: Profile;
}

// ----------------------- CLASSES -----------------------
export interface Class {
  id: string;
  name: string;
  level: number;
  stream: 'general' | 'sciences' | 'lettres' | null;
  description: string | null;
  icon_url: string | null;
  created_at: string;
}

// ----------------------- SUBJECTS -----------------------
export interface Subject {
  id: string;
  class_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  color: string;
  display_order: number;
  created_at: string;
}

// ----------------------- CHAPTERS -----------------------
export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  display_order: number;
  estimated_duration: number | null;
  created_at: string;
}

// ----------------------- LESSONS -----------------------
export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_duration: number | null;
  video_size_mb: number | null;
  thumbnail_url: string | null;
  display_order: number;
  is_premium: boolean;
  created_at: string;
}

// ----------------------- CONTENTS -----------------------
export type ContentType = 'text' | 'example' | 'summary' | 'definition' | 'formula';

export interface Content {
  id: string;
  lesson_id: string;
  type: ContentType;
  title: string | null;
  body: string;
  display_order: number;
  created_at: string;
}

// ----------------------- EXERCISES -----------------------
export type ExerciseLevel = 'easy' | 'medium' | 'hard';

export interface Exercise {
  id: string;
  lesson_id: string;
  level: ExerciseLevel;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  points: number;
  display_order: number;
  created_at: string;
}

// ----------------------- QUIZZES -----------------------
export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  time_limit: number | null;
  passing_score: number;
  is_premium: boolean;
  created_at: string;
}

export interface QuizChoice {
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  choices: QuizChoice[];
  explanation: string | null;
  points: number;
  display_order: number;
  created_at: string;
}

// ----------------------- ENROLLMENTS -----------------------
export interface Enrollment {
  id: string;
  user_id: string;
  class_id: string;
  enrolled_at: string;
  is_active: boolean;
  completed_at: string | null;
}

// ----------------------- USER PROGRESS -----------------------
export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  video_position: number;
  video_completed: boolean;
  exercises_score: number | null;
  quiz_score: number | null;
  quiz_passed: boolean;
  completed_at: string | null;
  updated_at: string;
}

// ----------------------- BADGES -----------------------
export type BadgeConditionType = 
  | 'lessons_completed' 
  | 'exercises_score' 
  | 'quiz_perfect' 
  | 'streak_days' 
  | 'subject_master' 
  | 'class_complete';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  condition_type: BadgeConditionType;
  condition_value: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

// ----------------------- TYPES COMPOSÉS -----------------------
export interface LessonWithProgress extends Lesson {
  progress?: UserProgress | null;
  chapter?: Chapter;
  subject?: Subject;
}

export interface ChapterWithLessons extends Chapter {
  lessons: LessonWithProgress[];
  progress_percentage?: number;
}

export interface SubjectWithChapters extends Subject {
  chapters: ChapterWithChapters[];
  progress_percentage?: number;
}

export interface ClassWithSubjects extends Class {
  subjects: SubjectWithChapters[];
  enrollment?: Enrollment | null;
  progress_percentage?: number;
}

export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestion[];
}

export interface ExerciseWithResult extends Exercise {
  user_answer?: number | null;
  is_correct?: boolean;
}

// ----------------------- OFFLINE / SYNC -----------------------
export interface SyncQueueItem {
  id?: number;
  table: string;
  action: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DownloadStatus {
  lesson_id: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  total_bytes: number;
}