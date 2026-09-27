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

  Cette version conserve la structure actuelle mais permet
  de repartir proprement avec le nouveau système de cache.

  IMPORTANT :
  - Les données pédagogiques sont remplacées lors d'une
    synchronisation complète réussie.
  - Les données utilisateur sont conservées.
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


// ======================================================
// STORAGE
// ======================================================

/*
 * IMPORTANT :
 *
 * Cette fonction mesure la taille approximative de
 * l'ensemble des données Dexie.
 *
 * Elle est conservée pour compatibilité avec le reste
 * de l'application.
 *
 * L'ancienne version parcourait les tables une par une :
 *
 *   table 1 → attente
 *   table 2 → attente
 *   table 3 → attente
 *   ...
 *
 * Nous effectuons maintenant les lectures en parallèle.
 *
 * NOTE :
 * Ce calcul reste une estimation basée sur JSON.stringify().
 * Il ne représente pas exactement la taille physique
 * réelle du stockage IndexedDB.
 */

export async function getStorageUsedMB() {

  let bytes = 0;


  const results =
    await Promise.all(

      db.tables.map(
        async table => {

          try {

            const data =
              await table.toArray();


            return JSON.stringify(data).length;

          } catch (error) {

            console.warn(
              `⚠️ Impossible de mesurer ${table.name}`,
              error
            );


            return 0;

          }

        }
      )

    );


  for (const tableBytes of results) {

    bytes += tableBytes;

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

export async function cacheSubjects(list) {

  const rows =
    (list || []).map(item => ({
      ...item,
      cached_at: now()
    }));

  if (rows.length > 0) {

    await db.subjects.bulkPut(rows);
  }
}


export async function getCachedSubjects(classId) {

  if (!classId)
    return [];

  const data =
    await db.subjects
      .where("class_id")
      .equals(classId)
      .toArray();

  data.sort(
    (a, b) =>
      (Number(a.order_number) || 0) -
      (Number(b.order_number) || 0)
  );

  return data;
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

  if (!subjectId)
    return [];

  const data =
    await db.chapters
      .where("subject_id")
      .equals(subjectId)
      .toArray();

  data.sort(
    (a, b) =>
      (Number(a.order_number) || 0) -
      (Number(b.order_number) || 0)
  );

  return data;
}


export async function cacheChapter(chapter) {

  if (!chapter?.id)
    return;

  await db.chapters.put({
    ...chapter,
    cached_at: now()
  });
}


export async function getCachedChapter(id) {

  if (!id)
    return null;

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

  if (!lesson?.id)
    return;

  await db.lessons.put({
    ...lesson,
    cached_at: now()
  });
}


export async function getCachedLessons(chapterId) {

  if (!chapterId)
    return [];

  const data =
    await db.lessons
      .where("chapter_id")
      .equals(chapterId)
      .toArray();

  data.sort(
    (a, b) =>
      (Number(a.order_number) || 0) -
      (Number(b.order_number) || 0)
  );

  return data;
}


export async function getCachedLesson(id) {

  if (!id)
    return null;

  return await db.lessons.get(id);
}


// ======================================================
// VIDEO CACHE
// ======================================================

export async function updateLessonVideoPath(
  id,
  path
) {

  if (!id)
    return;

  await db.lessons.update(
    id,
    {
      local_video_path:
        path || null
    }
  );
}


export async function removeLessonLocal(id) {

  if (!id)
    return;

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

  if (!lessonId)
    return [];

  const data =
    await db.lessonBlocks
      .where("lesson_id")
      .equals(lessonId)
      .toArray();

  data.sort(
    (a, b) =>
      (Number(a.order_number) || 0) -
      (Number(b.order_number) || 0)
  );

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

  if (!lessonId)
    return [];

  const data =
    await db.exercises
      .where("lesson_id")
      .equals(lessonId)
      .toArray();

  data.sort(
    (a, b) =>
      (Number(a.order_number) || 0) -
      (Number(b.order_number) || 0)
  );

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

  if (!lessonId)
    return [];

  const data =
    await db.quizzes
      .where("lesson_id")
      .equals(lessonId)
      .toArray();

  return data;
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

  if (!quizId)
    return [];

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
//
// RÈGLES MÉTIER :
//
// 1. Le meilleur score est conservé.
//
// 2. Une fois completed=true,
//    completed reste true.
//
// 3. Un score inférieur ne peut donc
//    jamais faire régresser une leçon.
//
// Exemple :
//
//   85 → 50 → 70 → 95
//
// devient :
//
//   score     = 95
//   completed = true
//
// ======================================================

export async function saveProgress(progress) {

  if (!progress?.user_id)
    return null;

  if (!progress?.lesson_id)
    return null;


  /*
   * ====================================
   * RECHERCHE DE LA PROGRESSION EXISTANTE
   * ====================================
   */

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


  /*
   * ====================================
   * MEILLEUR SCORE
   * ====================================
   */

  const existingScore =
    Math.max(
      0,
      Number(existing?.score) || 0
    );

  const incomingScore =
    Math.max(
      0,
      Number(progress.score) || 0
    );

  const bestScore =
    Math.max(
      existingScore,
      incomingScore
    );


  /*
   * ====================================
   * ÉTAT TERMINÉ
   * ====================================
   */

  const completed =
    existing?.completed === true ||
    progress.completed === true ||
    bestScore >= 80;


  /*
   * ====================================
   * DATE DE TERMINAISON
   * ====================================
   */

  let completedAt = null;

  if (completed) {

    completedAt =
      existing?.completed_at ||
      progress.completed_at ||
      now();
  }


  /*
   * ====================================
   * ENREGISTREMENT FINAL
   * ====================================
   */

  const record = {

    ...(existing || {}),

    ...progress,

    score:
      bestScore,

    completed,

    completed_at:
      completedAt,

    synced:
      false,

    updated_at:
      now()
  };


  /*
   * On conserve toujours l'identifiant
   * local existant.
   */

  if (existing?.id) {

    record.id =
      existing.id;
  }


  const savedId =
    await db.userProgress.put(
      record
    );


  console.log(
    "💾 Progression locale enregistrée :",
    {
      userId:
        progress.user_id,

      lessonId:
        progress.lesson_id,

      score:
        bestScore,

      completed
    }
  );


  return savedId;
}


// ======================================================
// PROGRESSIONS NON SYNCHRONISÉES
// ======================================================

export async function getUnsyncedProgress() {
  const allProgress = await db.userProgress.toArray();

  return allProgress.filter(
    (item) =>
      item?.synced === false ||
      item?.synced === 0 ||
      item?.synced === undefined
  );
}


// ======================================================
// MARQUER UNE PROGRESSION SYNCHRONISÉE
// ======================================================

export async function markProgressSynced(id) {

  if (
    id === undefined ||
    id === null
  )

    return;


  await db.userProgress.update(
    id,
    {
      synced: true
    }
  );
}


// ======================================================
// RÉCUPÉRER UNE PROGRESSION
// ======================================================

export async function getCachedProgress(
  userId,
  lessonId
) {

  if (!userId || !lessonId)
    return null;


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
// RÉCUPÉRER TOUTES LES PROGRESSIONS D'UN UTILISATEUR
// ======================================================
//
// Utilisé notamment par le Dashboard étudiant.
//
// IMPORTANT :
// - lecture uniquement
// - aucune modification de la progression
// - aucune modification de la synchronisation
// - retourne uniquement les données de l'utilisateur demandé
//
// L'index user_id permet d'éviter de parcourir inutilement
// les progressions des autres utilisateurs.
// ======================================================

export async function getCachedUserProgress(
  userId
) {

  if (!userId)
    return [];

  return await db.userProgress
    .where("user_id")
    .equals(userId)
    .toArray();
}


// ======================================================
// RÉINITIALISATION LOCALE DE LA PROGRESSION
// ======================================================
//
// Ces fonctions permettent de détecter une réinitialisation
// effectuée côté serveur et d'invalider uniquement les
// données locales de l'utilisateur concerné.
//
// IMPORTANT :
// - contenu pédagogique conservé
// - téléchargements conservés
// - autres utilisateurs conservés
// - progression/quiz/queue de cet utilisateur supprimés
// ======================================================


// ======================================
// CLÉ VERSION RESET
// ======================================

function getProgressResetVersionKey(userId) {

  if (!userId)
    return null;

  return `kalan_progress_reset_version_${userId}`;
}


// ======================================
// RÉCUPÉRER LA VERSION LOCALE
// ======================================

export function getLocalProgressResetVersion(
  userId
) {

  if (!userId)
    return 0;

  try {

    const key =
      getProgressResetVersionKey(
        userId
      );

    const value =
      localStorage.getItem(key);

    if (value === null)
      return 0;

    const version =
      Number(value);

    return Number.isFinite(version)
      ? version
      : 0;

  }
  catch {

    return 0;
  }
}


// ======================================
// ENREGISTRER LA VERSION LOCALE
// ======================================

export function setLocalProgressResetVersion(
  userId,
  version
) {

  if (!userId)
    return;

  try {

    const key =
      getProgressResetVersionKey(
        userId
      );

    const safeVersion =
      Math.max(
        0,
        Number(version) || 0
      );

    localStorage.setItem(
      key,
      String(safeVersion)
    );

  }
  catch {

    // Ignorer les erreurs localStorage
  }
}


// ======================================
// SUPPRIMER LA VERSION LOCALE
// ======================================

export function clearLocalProgressResetVersion(
  userId
) {

  if (!userId)
    return;

  try {

    const key =
      getProgressResetVersionKey(
        userId
      );

    localStorage.removeItem(key);

  }
  catch {

    // Ignorer
  }
}


// ======================================
// SUPPRESSION LOCALE PROGRESSION
// ======================================
//
// Supprime uniquement les données appartenant
// à l'utilisateur indiqué.
// ======================================

export async function clearLocalUserProgress(
  userId
) {

  if (!userId)
    return;


  // --------------------------------------
  // PROGRESSIONS
  // --------------------------------------

  await db.userProgress
    .where("user_id")
    .equals(userId)
    .delete();


  // --------------------------------------
  // TENTATIVES DE QUIZ
  // --------------------------------------

  await db.quizAttempts
    .where("user_id")
    .equals(userId)
    .delete();


  // --------------------------------------
  // QUEUE DE SYNCHRONISATION
  // --------------------------------------

  const queueItems =
    await db.syncQueue.toArray();


  const userQueueIds =
    queueItems
      .filter(item => {

        const payload =
          item?.payload;

        return (
          payload?.user_id &&
          String(payload.user_id) ===
          String(userId)
        );

      })
      .map(item => item.id);


  if (userQueueIds.length > 0) {

    await db.syncQueue.bulkDelete(
      userQueueIds
    );
  }


  // --------------------------------------
  // CACHE XP
  // --------------------------------------

  try {

    localStorage.removeItem(
      `kalan_xp_cache_${userId}`
    );

  }
  catch {

    // Ignorer
  }


  console.log(
    "🧹 Progression locale supprimée :",
    userId
  );
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


  return await db.quizAttempts.add({

    ...attempt,

    synced:
      false,

    completed_at:
      attempt.completed_at ||
      now()
  });
}


// ======================================================
// TENTATIVES DE QUIZ NON SYNCHRONISÉES
// ======================================================

export async function getUnsyncedQuizAttempts() {
  const allAttempts = await db.quizAttempts.toArray();

  return allAttempts.filter(
    (item) =>
      item?.synced === false ||
      item?.synced === 0 ||
      item?.synced === undefined
  );
}


// ======================================================
// RÉCUPÉRER TOUTES LES TENTATIVES D'UN UTILISATEUR
// ======================================================
//
// Utilisé notamment par le Dashboard étudiant.
//
// IMPORTANT :
// - lecture uniquement
// - aucune modification des tentatives
// - aucune modification de la synchronisation
// - retourne uniquement les tentatives de l'utilisateur demandé
// ======================================================

export async function getCachedQuizAttempts(
  userId
) {

  if (!userId)
    return [];

  return await db.quizAttempts
    .where("user_id")
    .equals(userId)
    .toArray();
}


// ======================================================
// MARQUER UNE TENTATIVE SYNCHRONISÉE
// ======================================================

export async function markQuizAttemptSynced(
  id
) {

  if (
    id === undefined ||
    id === null
  )

    return;


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
//
// Une seule opération active par :
//
//   table_name
//   action
//   local_record_id
//
// IMPORTANT :
// Si une opération existe déjà,
// on met maintenant son payload à jour.
//
// Cela évite qu'une ancienne valeur,
// par exemple score=50, reste dans la queue
// alors qu'une nouvelle valeur score=95
// vient d'être enregistrée.
//

export async function addToSyncQueue(item) {

  if (!item)
    return null;


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

      /*
       * On met à jour l'opération existante
       * au lieu de simplement retourner son id.
       *
       * Cela permet de conserver la dernière
       * progression locale disponible.
       */

      await db.syncQueue.update(
        existing.id,
        {

          ...item,

          id:
            existing.id,

          created_at:
            existing.created_at ||
            item.created_at ||
            now()
        }
      );


      console.log(
        "🔄 Opération de synchronisation mise à jour :",
        {
          table:
            item.table_name,

          action:
            item.action,

          localRecordId:
            item.local_record_id
        }
      );


      return existing.id;
    }
  }


  return await db.syncQueue.add({

    ...item,

    created_at:
      item.created_at ||
      now()
  });
}


// ======================================================
// RÉCUPÉRER LA QUEUE
// ======================================================

export async function getSyncQueue() {

  return await db.syncQueue
    .orderBy("created_at")
    .toArray();
}


// ======================================================
// SUPPRIMER UNE OPÉRATION DE LA QUEUE
// ======================================================

export async function removeFromSyncQueue(id) {

  if (
    id === undefined ||
    id === null
  )

    return;


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

if (
  typeof window !==
  "undefined"
) {

  window.kalanDB =
    db;
}


// ======================================================
// RESET OFFLINE DATABASE
// ======================================================

if (
  typeof window !==
  "undefined"
) {

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