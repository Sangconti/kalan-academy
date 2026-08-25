// src/offline/db.js

import Dexie from "dexie";


// ======================================================
// DATABASE
// ======================================================

export const db = new Dexie("KalanAcademyDB");


// ======================================================
// SCHEMA
// ======================================================

/*
  Version 7

  Cette version conserve la structure actuelle.

  IMPORTANT :
  - Les données pédagogiques sont stockées localement.
  - Les données utilisateur sont conservées séparément.
  - La progression et les tentatives de quiz peuvent
    être synchronisées ultérieurement.
*/

db.version(7).stores({

  // --------------------------------------
  // CONTENU PÉDAGOGIQUE
  // --------------------------------------

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


  // --------------------------------------
  // DONNÉES UTILISATEUR
  // --------------------------------------

  userProgress:
    "++id, user_id, lesson_id, score, completed, completed_at, synced, updated_at",

  quizAttempts:
    "++id, user_id, quiz_id, lesson_id, score, total_questions, correct_answers, passed, completed_at, synced",

  syncQueue:
    "++id, table_name, record_id, action, local_record_id, created_at",

  downloads:
    "++id, lesson_id, video_path, size_mb, downloaded_at"

});


// ======================================================
// HELPERS
// ======================================================

function now() {

  return new Date().toISOString();

}


function normalizeCode(value) {

  return String(value || "")
    .trim()
    .toLowerCase();

}


function sortByOrder(a, b) {

  return (
    (Number(a?.order_number) || 0) -
    (Number(b?.order_number) || 0)
  );

}


// ======================================================
// STORAGE
// ======================================================

export async function getStorageUsedMB() {

  let bytes = 0;


  for (const table of db.tables) {

    try {

      const data =
        await table.toArray();

      bytes +=
        JSON.stringify(data).length;

    } catch (error) {

      console.warn(
        `⚠️ Impossible de mesurer ${table.name}`,
        error
      );

    }

  }


  return Number(
    (bytes / 1024 / 1024).toFixed(2)
  );

}


// ======================================================
// CLASSES
// ======================================================

export async function cacheClasses(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.classes.bulkPut(rows);

  }

}


export async function getCachedClasses() {

  return await db.classes
    .orderBy("order_number")
    .toArray();

}


// ======================================================
// SUBJECTS
// ======================================================

/*
 * Cache les matières reçues depuis Supabase.
 *
 * IMPORTANT :
 *
 * bulkPut() seul ne supprime PAS les anciens IDs.
 *
 * Exemple :
 *
 * Ancien cache :
 *
 *   Mathématiques ID A
 *   Mathématiques ID B
 *
 * Supabase :
 *
 *   Mathématiques ID B
 *
 * Avec bulkPut() seul :
 *
 *   Mathématiques ID A
 *   Mathématiques ID B
 *
 * Le doublon reste.
 *
 * Cette fonction réconcilie donc les matières de chaque
 * classe.
 *
 * Une ancienne matière est supprimée uniquement si :
 *
 *   1. elle appartient à la classe concernée ;
 *   2. elle n'est plus présente dans les données reçues ;
 *   3. elle ne possède aucun chapitre.
 *
 * Si elle possède des chapitres, on la conserve afin
 * d'éviter de créer des chapitres orphelins.
 */

export async function cacheSubjects(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  // --------------------------------------
  // Rien à mettre en cache
  // --------------------------------------

  if (rows.length === 0) {

    return;

  }


  // --------------------------------------
  // Regrouper par classe
  // --------------------------------------

  const classIds =
    [
      ...new Set(
        rows
          .map(item =>
            String(item?.class_id || "")
          )
          .filter(Boolean)
      )
    ];


  // --------------------------------------
  // Transaction Dexie
  // --------------------------------------

  await db.transaction(
    "rw",
    db.subjects,
    db.chapters,
    async () => {

      // ====================================
      // 1. Écrire les nouvelles matières
      // ====================================

      await db.subjects.bulkPut(rows);


      // ====================================
      // 2. Nettoyer les anciennes matières
      // ====================================

      for (const classId of classIds) {

        const currentSubjects =
          rows.filter(
            subject =>
              String(subject.class_id) ===
              String(classId)
          );


        const currentIds =
          new Set(
            currentSubjects.map(
              subject =>
                String(subject.id)
            )
          );


        const cachedSubjects =
          await db.subjects
            .where("class_id")
            .equals(classId)
            .toArray();


        for (const cachedSubject of cachedSubjects) {

          if (!cachedSubject?.id) {

            continue;

          }


          const cachedId =
            String(cachedSubject.id);


          // --------------------------------
          // Matière encore présente
          // --------------------------------

          if (currentIds.has(cachedId)) {

            continue;

          }


          // --------------------------------
          // Ancienne matière :
          // vérifier ses chapitres
          // --------------------------------

          let chapterCount = 0;


          try {

            chapterCount =
              await db.chapters
                .where("subject_id")
                .equals(cachedSubject.id)
                .count();

          } catch (error) {

            console.warn(
              "⚠️ Impossible de compter les chapitres avant suppression :",
              cachedSubject,
              error
            );

            // Sécurité :
            // ne pas supprimer si le comptage échoue.
            continue;

          }


          // --------------------------------
          // Aucun chapitre :
          // suppression sûre
          // --------------------------------

          if (chapterCount === 0) {

            console.log(
              "🧹 Suppression ancienne matière sans chapitre :",
              {
                id: cachedSubject.id,
                class_id: cachedSubject.class_id,
                name: cachedSubject.name,
                code: cachedSubject.code
              }
            );


            await db.subjects.delete(
              cachedSubject.id
            );

          } else {

            console.warn(
              "⚠️ Ancienne matière conservée car elle possède des chapitres :",
              {
                id: cachedSubject.id,
                name: cachedSubject.name,
                code: cachedSubject.code,
                chapters: chapterCount
              }
            );

          }

        }

      }

    }
  );

}


export async function getCachedSubjects(classId) {

  if (!classId) {

    return [];

  }


  const data =
    await db.subjects
      .where("class_id")
      .equals(classId)
      .toArray();


  data.sort(sortByOrder);


  return data;

}


// ======================================================
// NETTOYAGE DES DOUBLONS MATIÈRES
// ======================================================

/*
 * Nettoie les doublons d'une classe.
 *
 * Pour chaque groupe :
 *
 *   class_id + code
 *
 * on conserve la matière qui possède le plus de chapitres.
 *
 * Exemple :
 *
 *   Mathématiques A → 0 chapitre
 *   Mathématiques B → 24 chapitres
 *
 * Résultat :
 *
 *   Mathématiques B → conservée
 *   Mathématiques A → supprimée
 *
 * Si deux matières possèdent des chapitres, aucune n'est
 * supprimée automatiquement.
 */

export async function cleanupDuplicateSubjects(
  classId = null
) {

  try {

    let subjects;


    // --------------------------------------
    // Récupérer les matières
    // --------------------------------------

    if (classId) {

      subjects =
        await db.subjects
          .where("class_id")
          .equals(classId)
          .toArray();

    } else {

      subjects =
        await db.subjects.toArray();

    }


    const groups =
      new Map();


    // --------------------------------------
    // Regroupement logique
    // --------------------------------------

    for (const subject of subjects) {

      if (!subject?.id) {

        continue;

      }


      const logicalCode =
        normalizeCode(
          subject.code ||
          subject.subject_code ||
          subject.name
        );


      const key =
        `${String(subject.class_id || "")}::${logicalCode}`;


      if (!groups.has(key)) {

        groups.set(key, []);

      }


      groups
        .get(key)
        .push(subject);

    }


    const deleted = [];


    // --------------------------------------
    // Traiter chaque groupe
    // --------------------------------------

    for (const [key, group] of groups.entries()) {

      if (group.length <= 1) {

        continue;

      }


      const candidates = [];


      for (const subject of group) {

        let chapterCount = 0;


        try {

          chapterCount =
            await db.chapters
              .where("subject_id")
              .equals(subject.id)
              .count();

        } catch (error) {

          console.warn(
            "⚠️ Comptage chapitres impossible :",
            subject,
            error
          );

        }


        candidates.push({
          subject,
          chapterCount
        });

      }


      // ------------------------------------
      // Trier :
      // 1. plus de chapitres
      // 2. order_number
      // 3. ID
      // ------------------------------------

      candidates.sort(
        (a, b) => {

          if (
            b.chapterCount !==
            a.chapterCount
          ) {

            return (
              b.chapterCount -
              a.chapterCount
            );

          }


          const orderDifference =
            sortByOrder(
              a.subject,
              b.subject
            );


          if (orderDifference !== 0) {

            return orderDifference;

          }


          return String(
            a.subject.id
          ).localeCompare(
            String(b.subject.id)
          );

        }
      );


      const winner =
        candidates[0];


      console.warn(
        "🔎 DOUBLON MATIÈRE :",
        key,
        candidates.map(
          item => ({
            id: item.subject.id,
            name: item.subject.name,
            code: item.subject.code,
            chapters:
              item.chapterCount
          })
        )
      );


      // ------------------------------------
      // Supprimer uniquement les doublons
      // sans chapitre
      // ------------------------------------

      for (const candidate of candidates) {

        if (
          candidate.subject.id ===
          winner.subject.id
        ) {

          continue;

        }


        if (
          candidate.chapterCount ===
          0
        ) {

          await db.subjects.delete(
            candidate.subject.id
          );


          deleted.push(
            candidate.subject
          );


          console.log(
            "🧹 DOUBLON MATIÈRE SUPPRIMÉ :",
            {
              id: candidate.subject.id,
              name: candidate.subject.name,
              code: candidate.subject.code,
              kept: winner.subject.id
            }
          );

        } else {

          console.warn(
            "⚠️ Doublon conservé car il possède des chapitres :",
            {
              id: candidate.subject.id,
              name: candidate.subject.name,
              chapters:
                candidate.chapterCount
            }
          );

        }

      }

    }


    return deleted;

  } catch (error) {

    console.error(
      "❌ cleanupDuplicateSubjects :",
      error
    );


    return [];

  }

}


// ======================================================
// CHAPTERS
// ======================================================

export async function cacheChapters(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.chapters.bulkPut(rows);

  }

}


export async function getCachedChapters(subjectId) {

  if (!subjectId) {

    return [];

  }


  const data =
    await db.chapters
      .where("subject_id")
      .equals(subjectId)
      .toArray();


  data.sort(sortByOrder);


  return data;

}


export async function cacheChapter(chapter) {

  if (!chapter?.id) {

    return;

  }


  await db.chapters.put({

    ...chapter,

    cached_at: now()

  });

}


export async function getCachedChapter(id) {

  if (!id) {

    return null;

  }


  return await db.chapters.get(id);

}


// ======================================================
// LESSONS
// ======================================================

export async function cacheLessons(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.lessons.bulkPut(rows);

  }

}


export async function cacheLesson(lesson) {

  if (!lesson?.id) {

    return;

  }


  await db.lessons.put({

    ...lesson,

    cached_at: now()

  });

}


export async function getCachedLessons(chapterId) {

  if (!chapterId) {

    return [];

  }


  const data =
    await db.lessons
      .where("chapter_id")
      .equals(chapterId)
      .toArray();


  data.sort(sortByOrder);


  return data;

}


export async function getCachedLesson(id) {

  if (!id) {

    return null;

  }


  return await db.lessons.get(id);

}


// ======================================================
// VIDEO CACHE
// ======================================================

export async function updateLessonVideoPath(
  id,
  path
) {

  if (!id) {

    return;

  }


  await db.lessons.update(
    id,
    {
      local_video_path:
        path || null
    }
  );

}


export async function removeLessonLocal(id) {

  if (!id) {

    return;

  }


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

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.lessonBlocks.bulkPut(rows);

  }

}


export async function getCachedLessonBlocks(
  lessonId
) {

  if (!lessonId) {

    return [];

  }


  const data =
    await db.lessonBlocks
      .where("lesson_id")
      .equals(lessonId)
      .toArray();


  data.sort(sortByOrder);


  return data;

}


// ======================================================
// EXERCISES
// ======================================================

export async function cacheExercises(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.exercises.bulkPut(rows);

  }

}


export async function getCachedExercises(
  lessonId
) {

  if (!lessonId) {

    return [];

  }


  const data =
    await db.exercises
      .where("lesson_id")
      .equals(lessonId)
      .toArray();


  data.sort(sortByOrder);


  return data;

}


// ======================================================
// QUIZZES
// ======================================================

export async function cacheQuizzes(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.quizzes.bulkPut(rows);

  }

}


export async function getCachedQuizzes(
  lessonId
) {

  if (!lessonId) {

    return [];

  }


  return await db.quizzes
    .where("lesson_id")
    .equals(lessonId)
    .toArray();

}


// ======================================================
// QUIZ QUESTIONS
// ======================================================

export async function cacheQuizQuestions(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.quizQuestions.bulkPut(rows);

  }

}


export async function getCachedQuizQuestions(
  quizId
) {

  if (!quizId) {

    return [];

  }


  return await db.quizQuestions
    .where("quiz_id")
    .equals(quizId)
    .sortBy("order_number");

}


// ======================================================
// BADGES
// ======================================================

export async function cacheBadges(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));


  if (rows.length > 0) {

    await db.badges.bulkPut(rows);

  }

}


export async function getCachedBadges() {

  return await db.badges.toArray();

}


// ======================================================
// USER PROGRESS
// ======================================================

export async function saveProgress(progress) {

  if (!progress?.user_id) {

    return null;

  }


  if (!progress?.lesson_id) {

    return null;

  }


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

    updated_at: now()

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
    .filter(
      item =>
        item.synced === false ||
        item.synced === 0 ||
        item.synced === undefined
    )
    .toArray();

}


export async function markProgressSynced(id) {

  if (
    id === undefined ||
    id === null
  ) {

    return;

  }


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

  if (!userId || !lessonId) {

    return null;

  }


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

  if (!attempt?.user_id) {

    return null;

  }


  if (!attempt?.quiz_id) {

    return null;

  }


  return await db.quizAttempts.add({

    ...attempt,

    synced: false,

    completed_at:
      attempt.completed_at ||
      now()

  });

}


export async function getUnsyncedQuizAttempts() {

  return await db.quizAttempts
    .filter(
      item =>
        item.synced === false ||
        item.synced === 0 ||
        item.synced === undefined
    )
    .toArray();

}


export async function markQuizAttemptSynced(
  id
) {

  if (
    id === undefined ||
    id === null
  ) {

    return;

  }


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

  if (!item) {

    return null;

  }


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
      item.created_at || now()

  });

}


export async function getSyncQueue() {

  return await db.syncQueue
    .orderBy("created_at")
    .toArray();

}


export async function removeFromSyncQueue(id) {

  if (
    id === undefined ||
    id === null
  ) {

    return;

  }


  await db.syncQueue.delete(id);

}


// ======================================================
// DEBUG
// ======================================================

export async function debugOffline() {

  console.log(
    "===================================="
  );

  console.log(
    "📦 KALAN ACADEMY OFFLINE DATABASE"
  );

  console.log(
    "===================================="
  );


  console.log(
    "CLASSES:",
    await db.classes.toArray()
  );


  console.log(
    "SUBJECTS:",
    await db.subjects.toArray()
  );


  console.log(
    "CHAPTERS:",
    await db.chapters.toArray()
  );


  console.log(
    "LESSONS:",
    await db.lessons.toArray()
  );


  console.log(
    "LESSON BLOCKS:",
    await db.lessonBlocks.toArray()
  );


  console.log(
    "EXERCISES:",
    await db.exercises.toArray()
  );


  console.log(
    "QUIZZES:",
    await db.quizzes.toArray()
  );


  console.log(
    "QUIZ QUESTIONS:",
    await db.quizQuestions.toArray()
  );


  console.log(
    "BADGES:",
    await db.badges.toArray()
  );


  console.log(
    "USER PROGRESS:",
    await db.userProgress.toArray()
  );


  console.log(
    "QUIZ ATTEMPTS:",
    await db.quizAttempts.toArray()
  );


  console.log(
    "SYNC QUEUE:",
    await db.syncQueue.toArray()
  );

}


// ======================================================
// GLOBAL DEBUG
// ======================================================

if (typeof window !== "undefined") {

  window.kalanDB = db;


  /*
   * Fonctions accessibles directement dans
   * Chrome DevTools.
   *
   * Exemple :
   *
   * await window.kalanOffline.cacheSubjects(...)
   *
   * await window.kalanOffline.cleanupDuplicateSubjects()
   */

  window.kalanOffline = {

    cacheClasses,

    getCachedClasses,

    cacheSubjects,

    getCachedSubjects,

    cleanupDuplicateSubjects,

    cacheChapters,

    getCachedChapters,

    cacheChapter,

    getCachedChapter,

    cacheLessons,

    cacheLesson,

    getCachedLessons,

    getCachedLesson,

    cacheLessonBlocks,

    getCachedLessonBlocks,

    cacheExercises,

    getCachedExercises,

    cacheQuizzes,

    getCachedQuizzes,

    cacheQuizQuestions,

    getCachedQuizQuestions,

    cacheBadges,

    getCachedBadges,

    saveProgress,

    getUnsyncedProgress,

    markProgressSynced,

    getCachedProgress,

    saveQuizAttempt,

    getUnsyncedQuizAttempts,

    markQuizAttemptSynced,

    addToSyncQueue,

    getSyncQueue,

    removeFromSyncQueue,

    getStorageUsedMB,

    debugOffline

  };

}


// ======================================================
// RESET OFFLINE DATABASE
// ======================================================

if (typeof window !== "undefined") {

  window.resetKalanOffline =
    async function () {

      try {

        await db.delete();


        console.log(
          "🗑️ Cache Kalan Academy supprimé"
        );


        console.log(
          "🔄 Rechargement..."
        );


        window.location.reload();

      }

      catch (error) {

        console.error(
          "❌ Impossible de supprimer le cache :",
          error
        );

      }

    };

}