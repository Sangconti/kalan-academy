// src/services/educationService.js

import { supabase } from "../lib/supabase";

import {
  cacheClasses,
  getCachedClasses,

  cacheSubjects,
  getCachedSubjects,

  cacheChapters,
  getCachedChapters,

  cacheChapter,
  getCachedChapter,

  cacheLessons,
  getCachedLessons,

  cacheLesson,
  getCachedLesson,

  cacheLessonBlocks,
  getCachedLessonBlocks,

  cacheExercises,
  getCachedExercises,

  cacheQuizzes,
  getCachedQuizzes,

  cacheQuizQuestions,
  getCachedQuizQuestions
} from "../offline/db";


// =====================================================
// NETWORK / SUPABASE AVAILABILITY
// =====================================================

let supabaseAvailable = true;


// =====================================================
// REQUEST DEDUPLICATION
// =====================================================

const pendingRequests = new Map();


// =====================================================
// BROWSER / WEBVIEW NETWORK STATUS
// =====================================================

function isOnline() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.onLine === true;
}


// =====================================================
// SUPABASE AVAILABILITY
// =====================================================

function isSupabaseAvailable() {
  return isOnline() && supabaseAvailable;
}


// =====================================================
// SUPABASE OFFLINE
// =====================================================

function markSupabaseOffline(error) {
  if (supabaseAvailable) {
    console.warn(
      "📴 Supabase inaccessible. Passage temporaire en mode offline.",
      error
    );
  }

  supabaseAvailable = false;
}


// =====================================================
// SUPABASE ONLINE
// =====================================================

function markSupabaseOnline() {
  if (!supabaseAvailable) {
    console.log(
      "🌐 Réseau détecté. Nouvelle tentative Supabase autorisée."
    );
  }

  supabaseAvailable = true;
}


// =====================================================
// NETWORK EVENTS
// =====================================================

if (typeof window !== "undefined") {
  window.addEventListener(
    "online",
    markSupabaseOnline
  );

  window.addEventListener(
    "offline",
    () => {
      console.log(
        "📴 Événement offline détecté."
      );

      supabaseAvailable = false;
    }
  );
}


// =====================================================
// REQUEST HELPER
// =====================================================

function runOnce(key, callback) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = Promise.resolve()
    .then(callback)
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(
    key,
    promise
  );

  return promise;
}


// =====================================================
// CLASSES
// =====================================================

export async function getClasses() {
  return await runOnce(
    "classes",
    async () => {
      let cached = [];

      try {
        cached = await getCachedClasses();
      } catch (error) {
        console.warn(
          "⚠️ Impossible de lire les classes depuis Dexie :",
          error
        );
      }

      if (cached && cached.length > 0) {
        console.log(
          "📦 CLASSES DEPUIS DEXIE :",
          cached.length
        );

        if (isSupabaseAvailable()) {
          refreshClassesInBackground();
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("classes")
          .select("*")
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (error) {
          console.error(
            "❌ Erreur getClasses :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheClasses(
          data || []
        );

        console.log(
          "🌐 CLASSES SUPABASE :",
          data?.length || 0
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getClasses :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH CLASSES
// =====================================================

async function refreshClassesInBackground() {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("classes")
      .select("*")
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheClasses(data);

      console.log(
        "🔄 CLASSES Dexie actualisées en arrière-plan :",
        data.length
      );
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// SUBJECTS
// =====================================================

export async function getSubjects(classId) {
  if (!classId) {
    return [];
  }

  return await runOnce(
    `subjects:${classId}`,
    async () => {
      let cached = [];

      try {
        cached = await getCachedSubjects(
          classId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture subjects Dexie :",
          error
        );
      }

      if (
        cached &&
        cached.length > 0
      ) {
        console.log(
          "📦 MATIÈRES DEPUIS DEXIE :",
          cached.length
        );

        if (isSupabaseAvailable()) {
          refreshSubjectsInBackground(
            classId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("subjects")
          .select("*")
          .eq(
            "class_id",
            classId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (error) {
          console.error(
            "❌ Erreur getSubjects :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheSubjects(
          data || []
        );

        console.log(
          "🌐 MATIÈRES SUPABASE :",
          data?.length || 0
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getSubjects :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH SUBJECTS
// =====================================================

async function refreshSubjectsInBackground(classId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("subjects")
      .select("*")
      .eq(
        "class_id",
        classId
      )
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheSubjects(data);

      console.log(
        "🔄 MATIÈRES Dexie actualisées :",
        data.length
      );
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// CHAPTERS
// =====================================================

export async function getChapters(subjectId) {
  if (!subjectId) {
    return [];
  }

  return await runOnce(
    `chapters:${subjectId}`,
    async () => {
      let cached = [];

      try {
        cached = await getCachedChapters(
          subjectId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture chapitres Dexie :",
          error
        );
      }

      if (
        cached &&
        cached.length > 0
      ) {
        console.log(
          "📦 CHAPITRES DEPUIS DEXIE :",
          cached.length
        );

        if (isSupabaseAvailable()) {
          refreshChaptersInBackground(
            subjectId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("chapters")
          .select("*")
          .eq(
            "subject_id",
            subjectId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (error) {
          console.error(
            "❌ Erreur getChapters :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheChapters(
          data || []
        );

        console.log(
          "🌐 CHAPITRES SUPABASE :",
          data?.length || 0
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getChapters :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH CHAPTERS
// =====================================================

async function refreshChaptersInBackground(subjectId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("chapters")
      .select("*")
      .eq(
        "subject_id",
        subjectId
      )
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheChapters(data);

      console.log(
        "🔄 CHAPITRES Dexie actualisés :",
        data.length
      );
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// ONE CHAPTER
// =====================================================

export async function getChapter(chapterId) {
  if (!chapterId) {
    return null;
  }

  return await runOnce(
    `chapter:${chapterId}`,
    async () => {
      let cached = null;

      try {
        cached = await getCachedChapter(
          chapterId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture chapitre Dexie :",
          error
        );
      }

      if (cached) {
        if (isSupabaseAvailable()) {
          refreshChapterInBackground(
            chapterId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return null;
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("chapters")
          .select(`
            id,
            title,
            description,
            subject_id,
            order_number
          `)
          .eq(
            "id",
            chapterId
          )
          .single();

        if (error) {
          console.error(
            "❌ Erreur getChapter :",
            error
          );

          markSupabaseOffline(error);

          return null;
        }

        if (data) {
          await cacheChapter(data);
        }

        return data;
      } catch (error) {
        console.error(
          "❌ Exception getChapter :",
          error
        );

        markSupabaseOffline(error);

        return null;
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH ONE CHAPTER
// =====================================================

async function refreshChapterInBackground(chapterId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("chapters")
      .select(`
        id,
        title,
        description,
        subject_id,
        order_number
      `)
      .eq(
        "id",
        chapterId
      )
      .single();

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheChapter(data);
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// LESSONS
// =====================================================

export async function getLessons(chapterId) {
  if (!chapterId) {
    return [];
  }

  return await runOnce(
    `lessons:${chapterId}`,
    async () => {
      let cached = [];

      try {
        cached = await getCachedLessons(
          chapterId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture lessons Dexie :",
          error
        );
      }

      if (
        cached &&
        cached.length > 0
      ) {
        if (isSupabaseAvailable()) {
          refreshLessonsInBackground(
            chapterId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("lessons")
          .select("*")
          .eq(
            "chapter_id",
            chapterId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (error) {
          console.error(
            "❌ Erreur getLessons :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheLessons(
          data || []
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getLessons :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH LESSONS
// =====================================================

async function refreshLessonsInBackground(chapterId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("lessons")
      .select("*")
      .eq(
        "chapter_id",
        chapterId
      )
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheLessons(data);
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// ONE LESSON
// =====================================================

export async function getLesson(lessonId) {
  if (!lessonId) {
    return null;
  }

  return await runOnce(
    `lesson:${lessonId}`,
    async () => {
      let cached = null;

      try {
        cached = await getCachedLesson(
          lessonId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture lesson Dexie :",
          error
        );
      }

      if (cached) {
        if (isSupabaseAvailable()) {
          refreshLessonInBackground(
            lessonId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return null;
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("lessons")
          .select("*")
          .eq(
            "id",
            lessonId
          )
          .single();

        if (error) {
          console.error(
            "❌ Erreur getLesson :",
            error
          );

          markSupabaseOffline(error);

          return null;
        }

        if (data) {
          await cacheLesson(data);
        }

        return data;
      } catch (error) {
        console.error(
          "❌ Exception getLesson :",
          error
        );

        markSupabaseOffline(error);

        return null;
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH LESSON
// =====================================================

async function refreshLessonInBackground(lessonId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("lessons")
      .select("*")
      .eq(
        "id",
        lessonId
      )
      .single();

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheLesson(data);
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// LESSON BLOCKS
// =====================================================

export async function getLessonBlocks(lessonId) {
  if (!lessonId) {
    return [];
  }

  return await runOnce(
    `lessonBlocks:${lessonId}`,
    async () => {
      let cached = [];

      try {
        cached = await getCachedLessonBlocks(
          lessonId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture blocks Dexie :",
          error
        );
      }

      if (
        cached &&
        cached.length > 0
      ) {
        if (isSupabaseAvailable()) {
          refreshLessonBlocksInBackground(
            lessonId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("lesson_blocks")
          .select("*")
          .eq(
            "lesson_id",
            lessonId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (error) {
          console.error(
            "❌ Erreur getLessonBlocks :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheLessonBlocks(
          data || []
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getLessonBlocks :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH BLOCKS
// =====================================================

async function refreshLessonBlocksInBackground(lessonId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("lesson_blocks")
      .select("*")
      .eq(
        "lesson_id",
        lessonId
      )
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheLessonBlocks(data);
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// EXERCISES
// =====================================================

export async function getExercises(lessonId) {
  if (!lessonId) {
    return [];
  }

  return await runOnce(
    `exercises:${lessonId}`,
    async () => {
      let cached = [];

      try {
        cached = await getCachedExercises(
          lessonId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture exercises Dexie :",
          error
        );
      }

      if (
        cached &&
        cached.length > 0
      ) {
        if (isSupabaseAvailable()) {
          refreshExercisesInBackground(
            lessonId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("exercises")
          .select("*")
          .eq(
            "lesson_id",
            lessonId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (error) {
          console.error(
            "❌ Erreur getExercises :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheExercises(
          data || []
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getExercises :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH EXERCISES
// =====================================================

async function refreshExercisesInBackground(lessonId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("exercises")
      .select("*")
      .eq(
        "lesson_id",
        lessonId
      )
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheExercises(data);
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// QUIZZES
// =====================================================

export async function getQuizzes(lessonId) {
  if (!lessonId) {
    return [];
  }

  return await runOnce(
    `quizzes:${lessonId}`,
    async () => {
      let cached = [];

      try {
        cached = await getCachedQuizzes(
          lessonId
        );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture quizzes Dexie :",
          error
        );
      }

      if (
        cached &&
        cached.length > 0
      ) {
        if (isSupabaseAvailable()) {
          refreshQuizzesInBackground(
            lessonId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("quizzes")
          .select("*")
          .eq(
            "lesson_id",
            lessonId
          );

        if (error) {
          console.error(
            "❌ Erreur getQuizzes :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheQuizzes(
          data || []
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getQuizzes :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH QUIZZES
// =====================================================

async function refreshQuizzesInBackground(lessonId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("quizzes")
      .select("*")
      .eq(
        "lesson_id",
        lessonId
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheQuizzes(data);
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// QUIZ QUESTIONS
// =====================================================

export async function getQuizQuestions(quizId) {
  if (!quizId) {
    return [];
  }

  return await runOnce(
    `quizQuestions:${quizId}`,
    async () => {
      let cached = [];

      try {
        cached =
          await getCachedQuizQuestions(
            quizId
          );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture questions Dexie :",
          error
        );
      }

      if (
        cached &&
        cached.length > 0
      ) {
        if (isSupabaseAvailable()) {
          refreshQuizQuestionsInBackground(
            quizId
          );
        }

        return cached;
      }

      if (!isSupabaseAvailable()) {
        return [];
      }

      try {
        const {
          data,
          error
        } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq(
            "quiz_id",
            quizId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (error) {
          console.error(
            "❌ Erreur getQuizQuestions :",
            error
          );

          markSupabaseOffline(error);

          return [];
        }

        await cacheQuizQuestions(
          data || []
        );

        return data || [];
      } catch (error) {
        console.error(
          "❌ Exception getQuizQuestions :",
          error
        );

        markSupabaseOffline(error);

        return [];
      }
    }
  );
}


// =====================================================
// BACKGROUND REFRESH QUIZ QUESTIONS
// =====================================================

async function refreshQuizQuestionsInBackground(quizId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq(
        "quiz_id",
        quizId
      )
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (data) {
      await cacheQuizQuestions(data);
    }
  } catch (error) {
    markSupabaseOffline(error);
  }
}


// =====================================================
// COMPLETE QUIZ
// =====================================================

export async function getQuizByLesson(lessonId) {
  if (!lessonId) {
    return null;
  }

  return await runOnce(
    `quizByLesson:${lessonId}`,
    async () => {

      // -------------------------------------------------
      // CACHE FIRST
      // -------------------------------------------------

      let cachedQuiz = null;

      try {
        cachedQuiz =
          await getQuizByLessonOffline(
            lessonId
          );
      } catch (error) {
        console.warn(
          "⚠️ Erreur lecture quiz complet depuis Dexie :",
          error
        );
      }


      // -------------------------------------------------
      // CACHE DISPONIBLE
      // -------------------------------------------------

      if (cachedQuiz) {
        if (isSupabaseAvailable()) {
          refreshQuizByLessonInBackground(
            lessonId
          );
        }

        return cachedQuiz;
      }


      // -------------------------------------------------
      // OFFLINE SANS CACHE
      // -------------------------------------------------

      if (!isSupabaseAvailable()) {
        return null;
      }


      // -------------------------------------------------
      // SUPABASE
      // -------------------------------------------------

      try {
        const {
          data: quizzes,
          error
        } = await supabase
          .from("quizzes")
          .select("*")
          .eq(
            "lesson_id",
            lessonId
          )
          .limit(1);

        if (error) {
          console.error(
            "❌ Erreur getQuizByLesson :",
            error
          );

          markSupabaseOffline(error);

          return null;
        }

        if (
          !quizzes ||
          quizzes.length === 0
        ) {
          return null;
        }

        const quiz = quizzes[0];


        // -------------------------------------------------
        // QUESTIONS
        // -------------------------------------------------

        const {
          data: questions,
          error: questionsError
        } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq(
            "quiz_id",
            quiz.id
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );

        if (questionsError) {
          console.error(
            "❌ Erreur questions quiz :",
            questionsError
          );

          markSupabaseOffline(
            questionsError
          );

          return null;
        }


        // -------------------------------------------------
        // CACHE
        // -------------------------------------------------

        await cacheQuizzes([
          quiz
        ]);

        await cacheQuizQuestions(
          questions || []
        );


        // -------------------------------------------------
        // RESULTAT
        // -------------------------------------------------

        return {
          ...quiz,

          quiz_questions:
            questions || []
        };

      } catch (error) {
        console.error(
          "❌ Exception getQuizByLesson :",
          error
        );

        markSupabaseOffline(
          error
        );

        return null;
      }
    }
  );
}


// =====================================================
// QUIZ OFFLINE
// =====================================================

async function getQuizByLessonOffline(lessonId) {
  let quizzes = [];

  try {
    quizzes =
      await getCachedQuizzes(
        lessonId
      );
  } catch (error) {
    console.warn(
      "⚠️ Impossible de lire les quizzes Dexie :",
      error
    );

    return null;
  }


  if (
    !quizzes ||
    quizzes.length === 0
  ) {
    return null;
  }


  const quiz = quizzes[0];


  let questions = [];

  try {
    questions =
      await getCachedQuizQuestions(
        quiz.id
      );
  } catch (error) {
    console.warn(
      "⚠️ Impossible de lire les questions du quiz depuis Dexie :",
      error
    );

    questions = [];
  }


  return {
    ...quiz,

    quiz_questions:
      questions || []
  };
}


// =====================================================
// BACKGROUND REFRESH COMPLETE QUIZ
// =====================================================

async function refreshQuizByLessonInBackground(lessonId) {
  if (!isSupabaseAvailable()) {
    return;
  }

  try {
    const {
      data: quizzes,
      error
    } = await supabase
      .from("quizzes")
      .select("*")
      .eq(
        "lesson_id",
        lessonId
      )
      .limit(1);

    if (error) {
      markSupabaseOffline(error);
      return;
    }

    if (
      !quizzes ||
      quizzes.length === 0
    ) {
      return;
    }

    const quiz = quizzes[0];


    const {
      data: questions,
      error: questionsError
    } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq(
        "quiz_id",
        quiz.id
      )
      .order(
        "order_number",
        {
          ascending: true
        }
      );

    if (questionsError) {
      markSupabaseOffline(
        questionsError
      );

      return;
    }


    await cacheQuizzes([
      quiz
    ]);

    await cacheQuizQuestions(
      questions || []
    );

  } catch (error) {
    markSupabaseOffline(
      error
    );
  }
}


// =====================================================
// DEBUG
// =====================================================

export async function debugEducationCache() {
  console.log(
    "===================================="
  );

  console.log(
    "📦 KALAN ACADEMY EDUCATION CACHE"
  );

  console.log(
    "===================================="
  );

  try {
    const classes =
      await getCachedClasses();

    console.log(
      "📚 CLASSES :",
      classes
    );


    for (
      const classItem of classes
    ) {
      const subjects =
        await getCachedSubjects(
          classItem.id
        );

      console.log(
        `📘 SUBJECTS ${classItem.name} :`,
        subjects
      );


      for (
        const subject of subjects
      ) {
        const chapters =
          await getCachedChapters(
            subject.id
          );

        console.log(
          `📖 CHAPTERS ${subject.name} :`,
          chapters
        );
      }
    }

  } catch (error) {
    console.error(
      "❌ Erreur debugEducationCache :",
      error
    );
  }
}


// =====================================================
// GLOBAL DEBUG
// =====================================================

if (
  typeof window !== "undefined"
) {

  window.debugEducationCache =
    debugEducationCache;


  window.getEducationNetworkStatus =
    function () {
      return {
        navigatorOnline:
          typeof navigator !== "undefined"
            ? navigator.onLine
            : false,

        supabaseAvailable,

        pendingRequests:
          Array.from(
            pendingRequests.keys()
          )
      };
    };
}