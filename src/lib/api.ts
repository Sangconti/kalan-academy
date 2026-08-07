// ============================================================
// KALAN ACADEMY — Couche API Supabase
// src/lib/api.ts
// ============================================================

import { supabase } from './supabase';
import type {
  Profile, Class, Subject, Chapter, Lesson, Content,
  Exercise, Quiz, QuizQuestion, Enrollment, UserProgress,
  Badge, UserBadge,
  ClassWithSubjects, SubjectWithChapters, ChapterWithLessons,
  LessonWithProgress, QuizWithQuestions
} from '../types';

// ===================== AUTH & PROFILES =====================

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
    id,
    full_name,
    avatar_url,
    role,
    class_id,
    orange_money_id,
    is_premium
    `)
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ===================== CLASSES =====================

export const getClasses = async (): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('level', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getClassById = async (classId: string): Promise<Class | null> => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();
  if (error) throw error;
  return data;
};

// ===================== SUBJECTS =====================

export const getSubjectsByClass = async (classId: string): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('class_id', classId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
};

// ===================== CHAPTERS =====================

export const getChaptersBySubject = async (subjectId: string): Promise<Chapter[]> => {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('subject_id', subjectId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
};

// ===================== LESSONS =====================

export const getLessonsByChapter = async (chapterId: string): Promise<Lesson[]> => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getLessonById = async (lessonId: string): Promise<Lesson | null> => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();
  if (error) throw error;
  return data;
};

// ===================== CONTENTS =====================

export const getContentsByLesson = async (lessonId: string): Promise<Content[]> => {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
};

// ===================== EXERCISES =====================

export const getExercisesByLesson = async (lessonId: string): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getExercisesByLessonAndLevel = async (
  lessonId: string,
  level: 'easy' | 'medium' | 'hard'
): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('level', level)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data || [];
};

// ===================== QUIZZES =====================

export const getQuizByLesson = async (lessonId: string): Promise<QuizWithQuestions | null> => {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .single();
  if (quizError && quizError.code !== 'PGRST116') throw quizError;
  if (!quiz) return null;

  const { data: questions, error: qError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('display_order', { ascending: true });
  if (qError) throw qError;

  return { ...quiz, questions: questions || [] };
};

// ===================== ENROLLMENTS =====================

export const getUserEnrollments = async (userId: string): Promise<Enrollment[]> => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw error;
  return data || [];
};

export const enrollInClass = async (userId: string, classId: string): Promise<Enrollment> => {
  const { data, error } = await supabase
    .from('enrollments')
    .upsert({ user_id: userId, class_id: classId, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ===================== USER PROGRESS =====================

export const getUserProgress = async (userId: string): Promise<UserProgress[]> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

export const getUserProgressForLesson = async (
  userId: string,
  lessonId: string
): Promise<UserProgress | null> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const upsertProgress = async (progress: Partial<UserProgress> & { user_id: string; lesson_id: string }) => {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(progress, { onConflict: 'user_id,lesson_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const markLessonCompleted = async (userId: string, lessonId: string) => {
  return upsertProgress({
    user_id: userId,
    lesson_id: lessonId,
    video_completed: true,
    completed_at: new Date().toISOString()
  });
};

export const updateVideoPosition = async (userId: string, lessonId: string, position: number) => {
  return upsertProgress({
    user_id: userId,
    lesson_id: lessonId,
    video_position: position
  });
};

export const saveQuizResult = async (
  userId: string,
  lessonId: string,
  score: number,
  passed: boolean
) => {
  return upsertProgress({
    user_id: userId,
    lesson_id: lessonId,
    quiz_score: score,
    quiz_passed: passed
  });
};

// ===================== BADGES =====================

export const getAllBadges = async (): Promise<Badge[]> => {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('condition_value', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getUserBadges = async (userId: string): Promise<UserBadge[]> => {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*, badge:badges(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

// ===================== REQUÊTES COMPLEXES =====================

/**
 * Récupère la hiérarchie complète : Classe → Matières → Chapitres → Leçons
 * avec la progression de l'utilisateur
 */
export const getClassHierarchy = async (
  classId: string,
  userId?: string
): Promise<ClassWithSubjects | null> => {
  // 1. Récupère la classe
  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();
  if (classError) throw classError;
  if (!cls) return null;

  // 2. Récupère les matières
  const { data: subjects, error: subjError } = await supabase
    .from('subjects')
    .select('*')
    .eq('class_id', classId)
    .order('display_order');
  if (subjError) throw subjError;

  // 3. Pour chaque matière, récupère les chapitres
  const subjectsWithChapters: SubjectWithChapters[] = [];
  for (const subject of subjects || []) {
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subject.id)
      .order('display_order');

    const chaptersWithLessons: ChapterWithLessons[] = [];
    for (const chapter of chapters || []) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('chapter_id', chapter.id)
        .order('display_order');

      const lessonsWithProgress: LessonWithProgress[] = [];
      for (const lesson of lessons || []) {
        let progress = null;
        if (userId) {
          const { data: prog } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lesson.id)
            .single();
          progress = prog;
        }
        lessonsWithProgress.push({ ...lesson, progress });
      }

      const completedCount = lessonsWithProgress.filter(l => l.progress?.video_completed).length;
      chaptersWithLessons.push({
        ...chapter,
        lessons: lessonsWithProgress,
        progress_percentage: lessonsWithProgress.length > 0
          ? Math.round((completedCount / lessonsWithProgress.length) * 100)
          : 0
      });
    }

    const totalLessons = chaptersWithLessons.reduce((acc, c) => acc + c.lessons.length, 0);
    const totalCompleted = chaptersWithLessons.reduce(
      (acc, c) => acc + c.lessons.filter(l => l.progress?.video_completed).length, 0
    );

    subjectsWithChapters.push({
      ...subject,
      chapters: chaptersWithLessons,
      progress_percentage: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0
    });
  }

  // 4. Récupère l'enrollment si userId fourni
  let enrollment = null;
  if (userId) {
    const { data: enr } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('class_id', classId)
      .single();
    enrollment = enr;
  }

  const totalLessonsAll = subjectsWithChapters.reduce(
    (acc, s) => acc + s.chapters.reduce((a, c) => a + c.lessons.length, 0), 0
  );
  const totalCompletedAll = subjectsWithChapters.reduce(
    (acc, s) => acc + s.chapters.reduce((a, c) => a + c.lessons.filter(l => l.progress?.video_completed).length, 0), 0
  );

  return {
    ...cls,
    subjects: subjectsWithChapters,
    enrollment,
    progress_percentage: totalLessonsAll > 0 ? Math.round((totalCompletedAll / totalLessonsAll) * 100) : 0
  };
};

/**
 * Récupère une leçon complète avec contenus, exercices et quiz
 */
export const getFullLesson = async (
  lessonId: string,
  userId?: string
): Promise<{
  lesson: Lesson;
  contents: Content[];
  exercises: Exercise[];
  quiz: QuizWithQuestions | null;
  progress: UserProgress | null;
}> => {
  const [lesson, contents, exercises, quiz, progress] = await Promise.all([
    getLessonById(lessonId),
    getContentsByLesson(lessonId),
    getExercisesByLesson(lessonId),
    getQuizByLesson(lessonId),
    userId ? getUserProgressForLesson(userId, lessonId) : Promise.resolve(null)
  ]);

  if (!lesson) throw new Error('Leçon non trouvée');

  return { lesson, contents, exercises, quiz, progress };
};

/**
 * Récupère les statistiques globales de l'utilisateur
 */
export const getUserStats = async (userId: string) => {
  const { data: progress, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  const allProgress = progress || [];
  const completedLessons = allProgress.filter(p => p.video_completed).length;
  const totalQuizScore = allProgress.reduce((acc, p) => acc + (p.quiz_score || 0), 0);
  const quizzesPassed = allProgress.filter(p => p.quiz_passed).length;

  return {
    totalLessonsWatched: completedLessons,
    totalQuizScore,
    quizzesPassed,
    averageQuizScore: allProgress.length > 0
      ? Math.round(totalQuizScore / allProgress.length)
      : 0
  };
};