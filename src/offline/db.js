// src/offline/db.js

import Dexie from "dexie";

export const db = new Dexie("KalanAcademyDB");

// ======================================================
// DATABASE SCHEMA
// ======================================================

/*
  Version 6

  Cette version conserve les données déjà présentes
  et ajoute/structure correctement quizAttempts.

  IMPORTANT :
  Dexie conserve automatiquement les anciennes données
  lors de la migration de version.
*/

db.version(6).stores({

  classes:
    "id, name, order_number, cached_at",

  subjects:
    "id, class_id, name, order_number, cached_at",

  chapters:
    "id, subject_id, title, description, order_number, cached_at",

  lessons:
    "id, chapter_id, subject_id, class_id, title, order_number, video_url, local_video_path, cached_at",

  lessonBlocks:
    "id, lesson_id, type, order_number, cached_at",

  exercises:
    "id, lesson_id, order_number, cached_at",

  quizzes:
    "id, lesson_id, cached_at",

  quizQuestions:
    "id, quiz_id, order_number, cached_at",

  badges:
    "id, name, description, icon, cached_at",

  userProgress:
    "++id, user_id, lesson_id, score, completed, completed_at, synced",

  quizAttempts:
    "++id, user_id, quiz_id, lesson_id, score, total_questions, correct_answers, passed, completed_at, synced",

  syncQueue:
    "++id, table_name, record_id, action, local_record_id, payload, created_at",

  downloads:
    "++id, lesson_id, video_path, size_mb, downloaded_at"
});


// ======================================================
// STORAGE
// ======================================================

export async function getStorageUsedMB() {

  let bytes = 0;

  for (const table of db.tables) {

    const data =
      await table.toArray();

    bytes +=
      JSON.stringify(data).length;
  }

  return Number(
    (bytes / 1024 / 1024).toFixed(2)
  );
}


// ======================================================
// CLASSES
// ======================================================

export async function cacheClasses(list) {

  await db.classes.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );
}


export async function getCachedClasses() {

  const data =
    await db.classes
      .orderBy("order_number")
      .toArray();

  return data;
}


// ======================================================
// SUBJECTS
// ======================================================

export async function cacheSubjects(list) {

  await db.subjects.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );

  console.log(
    "CACHE SUBJECTS OK",
    list?.length || 0
  );
}


export async function getCachedSubjects(classId) {

  const data =
    await db.subjects
      .where("class_id")
      .equals(classId)
      .toArray();

  data.sort(
    (a, b) =>
      (a.order_number || 0) -
      (b.order_number || 0)
  );

  return data;
}


// ======================================================
// CHAPTERS
// ======================================================

export async function cacheChapters(list) {

  await db.chapters.bulkPut(

    (list || []).map(chapter => ({
      ...chapter,
      cached_at:
        new Date().toISOString()
    }))

  );

  console.log(
    "💾 CACHE CHAPTERS OK",
    list?.length || 0
  );
}


export async function getCachedChapters(subjectId) {

  const data =
    await db.chapters
      .where("subject_id")
      .equals(subjectId)
      .toArray();

  data.sort(
    (a, b) =>
      (a.order_number || 0) -
      (b.order_number || 0)
  );

  return data;
}


export async function cacheChapter(chapter) {

  if (!chapter)
    return;

  await db.chapters.put({

    ...chapter,

    cached_at:
      new Date().toISOString()

  });
}


export async function getCachedChapter(id) {

  return await db.chapters.get(id);
}


// ======================================================
// LESSONS
// ======================================================

export async function cacheLessons(list) {

  await db.lessons.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );
}


export async function cacheLesson(lesson) {

  if (!lesson)
    return;

  await db.lessons.put({

    ...lesson,

    cached_at:
      new Date().toISOString()

  });
}


export async function getCachedLessons(chapterId) {

  return await db.lessons
    .where("chapter_id")
    .equals(chapterId)
    .toArray();
}


export async function getCachedLesson(id) {

  return await db.lessons.get(id);
}


// ======================================================
// VIDEO CACHE
// ======================================================

export async function updateLessonVideoPath(
  id,
  path
) {

  await db.lessons.update(
    id,
    {
      local_video_path: path
    }
  );
}


export async function removeLessonLocal(id) {

  await db.lessons.update(

    id,

    {
      local_video_path: null
    }

  );

  await db.downloads
    .where("lesson_id")
    .equals(id)
    .delete();
}


// ======================================================
// LESSON BLOCKS
// ======================================================

export async function cacheLessonBlocks(list) {

  await db.lessonBlocks.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );
}


export async function getCachedLessonBlocks(
  lessonId
) {

  const data =
    await db.lessonBlocks
      .where("lesson_id")
      .equals(lessonId)
      .toArray();

  data.sort(
    (a, b) =>
      (a.order_number || 0) -
      (b.order_number || 0)
  );

  return data;
}


// ======================================================
// EXERCISES
// ======================================================

export async function cacheExercises(list) {

  await db.exercises.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );
}


export async function getCachedExercises(
  lessonId
) {

  return await db.exercises
    .where("lesson_id")
    .equals(lessonId)
    .toArray();
}


// ======================================================
// QUIZZES
// ======================================================

export async function cacheQuizzes(list) {

  await db.quizzes.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );
}


export async function getCachedQuizzes(
  lessonId
) {

  return await db.quizzes
    .where("lesson_id")
    .equals(lessonId)
    .toArray();
}


// ======================================================
// QUIZ QUESTIONS
// ======================================================

export async function cacheQuizQuestions(list) {

  await db.quizQuestions.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );
}


export async function getCachedQuizQuestions(
  quizId
) {

  return await db.quizQuestions
    .where("quiz_id")
    .equals(quizId)
    .sortBy("order_number");
}


// ======================================================
// BADGES
// ======================================================

export async function cacheBadges(list) {

  await db.badges.bulkPut(

    (list || []).map(item => ({
      ...item,
      cached_at:
        new Date().toISOString()
    }))

  );
}


export async function getCachedBadges() {

  return await db.badges.toArray();
}


// ======================================================
// USER PROGRESS
// ======================================================

/*
  Sauvegarde locale.

  On recherche d'abord la progression existante
  pour éviter de créer plusieurs lignes locales
  pour la même leçon.
*/

export async function saveProgress(progress) {

  if (!progress?.user_id)
    return null;

  if (!progress?.lesson_id)
    return null;


  const existing =
    await db.userProgress

      .where("user_id")
      .equals(progress.user_id)

      .filter(
        item =>
          String(item.lesson_id) ===
          String(progress.lesson_id)
      )

      .first();


  const record = {

    ...(existing || {}),

    ...progress,

    synced: false,

    updated_at:
      new Date().toISOString()

  };


  if (existing?.id) {

    record.id =
      existing.id;

  }


  return await db.userProgress.put(
    record
  );
}


export async function getUnsyncedProgress() {

  return await db.userProgress
    .where("synced")
    .equals(0)
    .toArray();
}


export async function markProgressSynced(id) {

  await db.userProgress.update(

    id,

    {
      synced: true
    }

  );
}


export async function getCachedProgress(
  userId,
  lessonId
) {

  return await db.userProgress

    .where("user_id")
    .equals(userId)

    .filter(
      item =>
        String(item.lesson_id) ===
        String(lessonId)
    )

    .first();
}


// ======================================================
// QUIZ ATTEMPTS
// ======================================================

export async function saveQuizAttempt(
  attempt
) {

  if (!attempt?.user_id)
    return null;

  if (!attempt?.quiz_id)
    return null;


  const id =
    await db.quizAttempts.add({

      ...attempt,

      synced: false,

      completed_at:
        attempt.completed_at ||
        new Date().toISOString()

    });


  return id;
}


export async function getUnsyncedQuizAttempts() {

  return await db.quizAttempts
    .where("synced")
    .equals(0)
    .toArray();
}


export async function markQuizAttemptSynced(
  id
) {

  await db.quizAttempts.update(

    id,

    {
      synced: true
    }

  );
}


// ======================================================
// SYNC QUEUE
// ======================================================

export async function addToSyncQueue(item) {

  if (!item)
    return null;


  /*
    Évite les doublons dans la queue.

    On identifie une opération par :
    table + action + local_record_id
  */

  if (
    item.local_record_id !== undefined &&
    item.local_record_id !== null
  ) {

    const existing =
      await db.syncQueue

        .where("table_name")
        .equals(item.table_name)

        .filter(
          row =>
            row.action === item.action &&
            String(row.local_record_id) ===
              String(item.local_record_id)
        )

        .first();


    if (existing) {

      return existing.id;

    }

  }


  return await db.syncQueue.add({

    ...item,

    created_at:
      new Date().toISOString()

  });
}


export async function getSyncQueue() {

  return await db.syncQueue
    .orderBy("created_at")
    .toArray();
}


export async function removeFromSyncQueue(id) {

  await db.syncQueue.delete(id);
}


// ======================================================
// DEBUG
// ======================================================

export async function debugOffline() {

  console.log(
    "CLASSES",
    await db.classes.toArray()
  );

  console.log(
    "SUBJECTS",
    await db.subjects.toArray()
  );

  console.log(
    "CHAPTERS",
    await db.chapters.toArray()
  );

  console.log(
    "LESSONS",
    await db.lessons.toArray()
  );

  console.log(
    "LESSON BLOCKS",
    await db.lessonBlocks.toArray()
  );

  console.log(
    "QUIZZES",
    await db.quizzes.toArray()
  );

  console.log(
    "QUIZ QUESTIONS",
    await db.quizQuestions.toArray()
  );

  console.log(
    "USER PROGRESS",
    await db.userProgress.toArray()
  );

  console.log(
    "QUIZ ATTEMPTS",
    await db.quizAttempts.toArray()
  );

  console.log(
    "SYNC QUEUE",
    await db.syncQueue.toArray()
  );
}


// ======================================================
// GLOBAL DEBUG ACCESS
// ======================================================

if (typeof window !== "undefined") {

  window.kalanDB = db;

}


// ======================================================
// RESET OFFLINE DATABASE
// ======================================================

if (typeof window !== "undefined") {

  window.resetKalanOffline =
    async function () {

      await db.delete();

      console.log(
        "🗑️ Cache Kalan Academy supprimé"
      );

      window.location.reload();

    };

}