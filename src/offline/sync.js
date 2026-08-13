// src/offline/sync.js

import { supabase } from "../lib/supabase";

import {

  db,

  getSyncQueue,
  removeFromSyncQueue,

  getUnsyncedProgress,
  markProgressSynced,

  getUnsyncedQuizAttempts,
  markQuizAttemptSynced,

  addToSyncQueue

} from "./db";


// ======================================================
// ÉTAT
// ======================================================

let syncing = false;

let educationSyncing = false;


// ======================================================
// UTILITAIRES
// ======================================================

function isOnline() {

  if (
    typeof navigator === "undefined"
  ) {

    return true;

  }

  return navigator.onLine === true;

}


function now() {

  return new Date().toISOString();

}


// ======================================================
// SYNCHRONISATION DONNÉES UTILISATEUR
// ======================================================

export async function syncPendingData() {

  if (syncing) {

    console.log(
      "⏳ Synchronisation utilisateur déjà en cours"
    );

    return {
      success: true,
      skipped: true
    };

  }


  if (!isOnline()) {

    console.log(
      "📴 Pas de connexion → synchronisation utilisateur ignorée"
    );

    return {
      success: false,
      offline: true
    };

  }


  syncing = true;


  try {

    console.log(
      "🔄 Synchronisation des données utilisateur..."
    );


    // --------------------------------------
    // 1. PROGRESSIONS
    // --------------------------------------

    await queueUnsyncedProgress();


    // --------------------------------------
    // 2. TENTATIVES QUIZ
    // --------------------------------------

    await queueUnsyncedQuizAttempts();


    // --------------------------------------
    // 3. QUEUE
    // --------------------------------------

    const queue =
      await getSyncQueue();


    console.log(
      `📦 ${queue.length} opération(s) en attente`
    );


    let success = 0;

    let errors = 0;


    for (const item of queue) {

      try {

        const result =
          await processQueueItem(item);


        if (result) {

          await removeFromSyncQueue(
            item.id
          );

          success++;

        }

        else {

          errors++;

        }

      }

      catch (error) {

        errors++;

        console.error(
          "❌ Erreur synchronisation opération :",
          item,
          error
        );

      }

    }


    console.log(
      "===================================="
    );

    console.log(
      "✅ SYNCHRONISATION UTILISATEUR TERMINÉE"
    );

    console.log(
      "Réussies :",
      success
    );

    console.log(
      "Erreurs :",
      errors
    );

    console.log(
      "===================================="
    );


    return {

      success:
        errors === 0,

      operations:
        success,

      errors

    };

  }

  catch (error) {

    console.error(
      "❌ Erreur synchronisation utilisateur :",
      error
    );

    return {

      success: false,

      errors: 1,

      error

    };

  }

  finally {

    syncing = false;

  }

}


// ======================================================
// QUEUE PROGRESSIONS
// ======================================================

async function queueUnsyncedProgress() {

  const list =
    await getUnsyncedProgress();


  if (!list.length)
    return;


  console.log(
    `📊 ${list.length} progression(s) locale(s) à synchroniser`
  );


  for (const progress of list) {

    await addToSyncQueue({

      table_name:
        "user_progress",

      record_id:
        progress.id,

      action:
        "upsert",

      local_record_id:
        progress.id,

      payload: {

        user_id:
          progress.user_id,

        lesson_id:
          progress.lesson_id,

        completed:
          Boolean(progress.completed),

        score:
          Number(progress.score) || 0,

        completed_at:
          progress.completed_at || null

      }

    });

  }

}


// ======================================================
// QUEUE QUIZ ATTEMPTS
// ======================================================

async function queueUnsyncedQuizAttempts() {

  const list =
    await getUnsyncedQuizAttempts();


  if (!list.length)
    return;


  console.log(
    `📝 ${list.length} tentative(s) quiz à synchroniser`
  );


  for (const attempt of list) {

    await addToSyncQueue({

      table_name:
        "quiz_attempts",

      record_id:
        attempt.id,

      action:
        "insert",

      local_record_id:
        attempt.id,

      payload: {

        user_id:
          attempt.user_id,

        quiz_id:
          attempt.quiz_id,

        lesson_id:
          attempt.lesson_id || null,

        score:
          Number(attempt.score) || 0,

        total_questions:
          Number(attempt.total_questions) || 0,

        correct_answers:
          Number(attempt.correct_answers) || 0,

        passed:
          Boolean(attempt.passed),

        answers:
          attempt.answers || {},

        attempt_number:
          Number(attempt.attempt_number) || 1,

        completed_at:
          attempt.completed_at || now()

      }

    });

  }

}


// ======================================================
// TRAITEMENT QUEUE
// ======================================================

async function processQueueItem(item) {

  const {

    table_name,

    action,

    payload,

    local_record_id

  } = item;


  // ======================================
  // XP
  // ======================================

  if (
    table_name === "profiles" &&
    action === "xp"
  ) {

    return await syncXP(payload);

  }


  // ======================================
  // USER PROGRESS
  // ======================================

  if (
    table_name === "user_progress" &&
    action === "upsert"
  ) {

    const {
      error
    } = await supabase
      .from("user_progress")
      .upsert(
        payload,
        {
          onConflict:
            "user_id,lesson_id"
        }
      );


    if (error) {

      console.error(
        "❌ Erreur user_progress :",
        error
      );

      return false;

    }


    if (
      local_record_id !== undefined &&
      local_record_id !== null
    ) {

      await markProgressSynced(
        local_record_id
      );

    }


    console.log(
      "☁️ Progression synchronisée"
    );


    return true;

  }


  // ======================================
  // QUIZ ATTEMPT
  // ======================================

  if (
    table_name === "quiz_attempts" &&
    action === "insert"
  ) {

    const {
      error
    } = await supabase
      .from("quiz_attempts")
      .insert(payload);


    if (error) {

      if (
        error.code === "23505"
      ) {

        console.warn(
          "⚠️ Tentative quiz déjà présente"
        );


        if (
          local_record_id !== undefined &&
          local_record_id !== null
        ) {

          await markQuizAttemptSynced(
            local_record_id
          );

        }


        return true;

      }


      console.error(
        "❌ Erreur quiz_attempts :",
        error
      );

      return false;

    }


    if (
      local_record_id !== undefined &&
      local_record_id !== null
    ) {

      await markQuizAttemptSynced(
        local_record_id
      );

    }


    console.log(
      "☁️ Tentative quiz synchronisée"
    );


    return true;

  }


  // ======================================
  // USER BADGES
  // ======================================

  if (
    table_name === "user_badges" &&
    action === "insert"
  ) {

    const {
      error
    } = await supabase
      .from("user_badges")
      .upsert(
        payload,
        {
          onConflict:
            "user_id,badge_id"
        }
      );


    if (error) {

      console.error(
        "❌ Erreur user_badges :",
        error
      );

      return false;

    }


    console.log(
      "🏆 Badge synchronisé :",
      payload?.badge_id
    );


    return true;

  }


  // ======================================
  // INSERT
  // ======================================

  if (
    action === "insert"
  ) {

    const {
      error
    } = await supabase
      .from(table_name)
      .insert(payload);


    if (error) {

      if (
        error.code === "23505"
      ) {

        console.warn(
          `⚠️ ${table_name} déjà présent`
        );

        return true;

      }


      console.error(
        `❌ INSERT ${table_name}`,
        error
      );

      return false;

    }


    return true;

  }


  // ======================================
  // UPDATE
  // ======================================

  if (
    action === "update"
  ) {

    if (!payload?.id) {

      console.error(
        `❌ UPDATE ${table_name} sans id`
      );

      return false;

    }


    const {
      error
    } = await supabase
      .from(table_name)
      .update(payload)
      .eq(
        "id",
        payload.id
      );


    if (error) {

      console.error(
        `❌ UPDATE ${table_name}`,
        error
      );

      return false;

    }


    return true;

  }


  // ======================================
  // DELETE
  // ======================================

  if (
    action === "delete"
  ) {

    if (!payload?.id) {

      console.error(
        `❌ DELETE ${table_name} sans id`
      );

      return false;

    }


    const {
      error
    } = await supabase
      .from(table_name)
      .delete()
      .eq(
        "id",
        payload.id
      );


    if (error) {

      console.error(
        `❌ DELETE ${table_name}`,
        error
      );

      return false;

    }


    return true;

  }


  console.warn(
    "⚠️ Action inconnue :",
    item
  );


  return false;

}


// ======================================================
// XP
// ======================================================

async function syncXP(payload) {

  const userId =
    payload?.user_id;


  const amount =
    Number(payload?.amount) || 0;


  if (!userId || amount <= 0)
    return true;


  const {

    data: profile,

    error: getError

  } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();


  if (getError) {

    console.error(
      "❌ Impossible de récupérer le profil XP :",
      getError
    );

    return false;

  }


  const currentXP =
    Number(profile?.xp) || 0;


  const newXP =
    currentXP + amount;


  const newLevel =
    Math.floor(
      newXP / 500
    ) + 1;


  const {
    error: updateError
  } = await supabase
    .from("profiles")
    .update({

      xp:
        newXP,

      level:
        newLevel

    })
    .eq(
      "id",
      userId
    );


  if (updateError) {

    console.error(
      "❌ Erreur synchronisation XP :",
      updateError
    );

    return false;

  }


  try {

    localStorage.setItem(

      `kalan_xp_cache_${userId}`,

      JSON.stringify({

        xp:
          newXP,

        level:
          newLevel

      })

    );

  }

  catch {

    // Rien à faire

  }


  console.log(
    `☁️ XP synchronisé : +${amount} → ${newXP} XP`
  );


  return true;

}


// ======================================================
// REMPLACEMENT ATOMIQUE DU CACHE PÉDAGOGIQUE
// ======================================================

async function replaceEducationCache({

  classes,

  subjects,

  chapters,

  lessons,

  blocks,

  quizzes,

  questions,

  badges,

  badgesLoaded

}) {

  const cachedAt =
    now();


  const classesRows =
    (classes || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  const subjectsRows =
    (subjects || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  const chaptersRows =
    (chapters || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  const lessonsRows =
    (lessons || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  const blocksRows =
    (blocks || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  const quizzesRows =
    (quizzes || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  const questionsRows =
    (questions || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  const badgesRows =
    (badges || []).map(item => ({
      ...item,
      cached_at: cachedAt
    }));


  /*
    IMPORTANT :

    Toutes les tables pédagogiques sont remplacées
    dans UNE transaction Dexie.

    Si la transaction échoue :
    l'ancien cache reste intact.
  */

  await db.transaction(

    "rw",

    db.classes,
    db.subjects,
    db.chapters,
    db.lessons,
    db.lessonBlocks,
    db.quizzes,
    db.quizQuestions,
    db.badges,

    async () => {

      await db.classes.clear();

      await db.subjects.clear();

      await db.chapters.clear();

      await db.lessons.clear();

      await db.lessonBlocks.clear();

      await db.quizzes.clear();

      await db.quizQuestions.clear();


      if (badgesLoaded) {

        await db.badges.clear();

      }


      if (classesRows.length) {

        await db.classes.bulkPut(
          classesRows
        );

      }


      if (subjectsRows.length) {

        await db.subjects.bulkPut(
          subjectsRows
        );

      }


      if (chaptersRows.length) {

        await db.chapters.bulkPut(
          chaptersRows
        );

      }


      if (lessonsRows.length) {

        await db.lessons.bulkPut(
          lessonsRows
        );

      }


      if (blocksRows.length) {

        await db.lessonBlocks.bulkPut(
          blocksRows
        );

      }


      if (quizzesRows.length) {

        await db.quizzes.bulkPut(
          quizzesRows
        );

      }


      if (questionsRows.length) {

        await db.quizQuestions.bulkPut(
          questionsRows
        );

      }


      if (
        badgesLoaded &&
        badgesRows.length
      ) {

        await db.badges.bulkPut(
          badgesRows
        );

      }

    }

  );

}


// ======================================================
// SYNCHRONISATION CONTENU PÉDAGOGIQUE
// ======================================================

export async function syncEducationContent() {

  if (educationSyncing) {

    console.log(
      "⏳ Synchronisation pédagogique déjà en cours"
    );

    return {

      success: true,

      skipped: true

    };

  }


  if (!isOnline()) {

    console.log(
      "📴 Hors ligne → aucun appel Supabase pour le contenu"
    );

    return {

      success: false,

      offline: true

    };

  }


  educationSyncing = true;


  try {

    console.log(
      "================================="
    );

    console.log(
      "📚 SYNCHRONISATION CONTENU"
    );

    console.log(
      "================================="
    );


    // ==================================
    // CLASSES
    // ==================================

    const {
      data: classes,
      error: classesError
    } = await supabase
      .from("classes")
      .select("*")
      .order("order_number");


    if (classesError)
      throw classesError;


    console.log(
      "CLASSES :",
      classes?.length || 0
    );


    // ==================================
    // SUBJECTS
    // ==================================

    const {
      data: subjects,
      error: subjectsError
    } = await supabase
      .from("subjects")
      .select("*")
      .order("order_number");


    if (subjectsError)
      throw subjectsError;


    console.log(
      "SUBJECTS :",
      subjects?.length || 0
    );


    // ==================================
    // CHAPTERS
    // ==================================

    const {
      data: chapters,
      error: chaptersError
    } = await supabase
      .from("chapters")
      .select("*")
      .order("order_number");


    if (chaptersError)
      throw chaptersError;


    console.log(
      "CHAPTERS :",
      chapters?.length || 0
    );


    // ==================================
    // LESSONS
    // ==================================

    const {
      data: lessons,
      error: lessonsError
    } = await supabase
      .from("lessons")
      .select("*")
      .order("order_number");


    if (lessonsError)
      throw lessonsError;


    console.log(
      "LESSONS :",
      lessons?.length || 0
    );


    // ==================================
    // BLOCKS
    // ==================================

    const {
      data: blocks,
      error: blocksError
    } = await supabase
      .from("lesson_blocks")
      .select("*")
      .order("order_number");


    if (blocksError)
      throw blocksError;


    console.log(
      "LESSON BLOCKS :",
      blocks?.length || 0
    );


    // ==================================
    // QUIZZES
    // ==================================

    const {
      data: quizzes,
      error: quizzesError
    } = await supabase
      .from("quizzes")
      .select("*");


    if (quizzesError)
      throw quizzesError;


    console.log(
      "QUIZZES :",
      quizzes?.length || 0
    );


    // ==================================
    // QUESTIONS
    // ==================================

    const {
      data: questions,
      error: questionsError
    } = await supabase
      .from("quiz_questions")
      .select("*")
      .order("order_number");


    if (questionsError)
      throw questionsError;


    console.log(
      "QUIZ QUESTIONS :",
      questions?.length || 0
    );


    // ==================================
    // BADGES
    // ==================================

    let badges = [];

    let badgesLoaded = false;


    const {
      data: badgeData,
      error: badgesError
    } = await supabase
      .from("badges")
      .select("*");


    if (!badgesError) {

      badges =
        badgeData || [];

      badgesLoaded =
        true;

    }

    else {

      console.warn(
        "⚠️ Badges non synchronisés :",
        badgesError
      );

    }


    // ==================================
    // VALIDATION
    // ==================================

    if (!Array.isArray(classes))
      throw new Error(
        "Réponse classes invalide"
      );


    if (!Array.isArray(subjects))
      throw new Error(
        "Réponse subjects invalide"
      );


    if (!Array.isArray(chapters))
      throw new Error(
        "Réponse chapters invalide"
      );


    if (!Array.isArray(lessons))
      throw new Error(
        "Réponse lessons invalide"
      );


    if (!Array.isArray(blocks))
      throw new Error(
        "Réponse lesson_blocks invalide"
      );


    if (!Array.isArray(quizzes))
      throw new Error(
        "Réponse quizzes invalide"
      );


    if (!Array.isArray(questions))
      throw new Error(
        "Réponse quiz_questions invalide"
      );


    // ==================================
    // REMPLACEMENT CACHE
    // ==================================

    console.log(
      "💾 Remplacement du cache offline..."
    );


    await replaceEducationCache({

      classes,

      subjects,

      chapters,

      lessons,

      blocks,

      quizzes,

      questions,

      badges,

      badgesLoaded

    });


    // ==================================
    // DIAGNOSTIC RELATIONS
    // ==================================

    console.log(
      "================================="
    );

    console.log(
      "📊 DIAGNOSTIC CACHE"
    );

    console.log(
      "================================="
    );


    for (const subject of subjects) {

      const count =
        chapters.filter(
          chapter =>
            String(chapter.subject_id) ===
            String(subject.id)
        ).length;


      console.log(
        `📘 ${subject.name} → ${count} chapitre(s)`
      );

    }


    // ==================================
    // RÉSULTAT
    // ==================================

    console.log(
      "================================="
    );

    console.log(
      "✅ CONTENU OFFLINE SYNCHRONISÉ"
    );

    console.log(
      "================================="
    );


    return {

      success: true,

      classes:
        classes.length,

      subjects:
        subjects.length,

      chapters:
        chapters.length,

      lessons:
        lessons.length,

      blocks:
        blocks.length,

      quizzes:
        quizzes.length,

      questions:
        questions.length,

      badges:
        badges.length

    };

  }

  catch (error) {

    /*
      IMPORTANT :

      Aucun clear() n'a été effectué avant que toutes
      les données Supabase soient récupérées.

      Donc si Internet tombe ici, le cache précédent
      reste intact.
    */

    console.error(
      "❌ ERREUR SYNCHRO EDUCATION :",
      error
    );


    return {

      success: false,

      error

    };

  }

  finally {

    educationSyncing = false;

  }

}


// ======================================================
// TÉLÉCHARGEMENT D'UNE LEÇON
// ======================================================

export async function downloadLessonContent(
  lessonId
) {

  if (!lessonId)
    return null;


  if (!isOnline()) {

    console.log(
      "📴 Offline → téléchargement impossible"
    );

    return null;

  }


  try {

    // ----------------------------------
    // LEÇON
    // ----------------------------------

    const {
      data: lesson,
      error: lessonError
    } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();


    if (lessonError)
      throw lessonError;


    // ----------------------------------
    // BLOCKS
    // ----------------------------------

    const {
      data: blocks,
      error: blocksError
    } = await supabase
      .from("lesson_blocks")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order_number");


    if (blocksError)
      throw blocksError;


    // ----------------------------------
    // QUIZZES
    // ----------------------------------

    const {
      data: quizzes,
      error: quizzesError
    } = await supabase
      .from("quizzes")
      .select("*")
      .eq("lesson_id", lessonId);


    if (quizzesError)
      throw quizzesError;


    // ----------------------------------
    // QUESTIONS
    // ----------------------------------

    let questions = [];


    if (
      quizzes &&
      quizzes.length > 0
    ) {

      const quizIds =
        quizzes.map(
          quiz => quiz.id
        );


      const {
        data: quizQuestions,
        error: questionsError
      } = await supabase
        .from("quiz_questions")
        .select("*")
        .in(
          "quiz_id",
          quizIds
        )
        .order("order_number");


      if (questionsError)
        throw questionsError;


      questions =
        quizQuestions || [];

    }


    return {

      lesson,

      blocks:
        blocks || [],

      quizzes:
        quizzes || [],

      questions

    };

  }

  catch (error) {

    console.error(
      "❌ Erreur téléchargement leçon :",
      error
    );

    return null;

  }

}


// ======================================================
// AUTO SYNC
// ======================================================

export function enableAutoSync() {

  if (
    typeof window === "undefined"
  ) {

    return;

  }


  if (
    window.__kalanAutoSyncEnabled
  ) {

    return;

  }


  window.__kalanAutoSyncEnabled =
    true;


  window.addEventListener(
    "online",
    async () => {

      console.log(
        "🌐 Connexion rétablie..."
      );


      // --------------------------------
      // DONNÉES UTILISATEUR
      // --------------------------------

      await syncPendingData();


      // --------------------------------
      // CONTENU PÉDAGOGIQUE
      // --------------------------------

      await syncEducationContent();


      console.log(
        "🔄 Synchronisation complète terminée"
      );

    }
  );


  console.log(
    "✅ Auto-sync Kalan Academy activé"
  );

}


// ======================================================
// GLOBAL DEBUG
// ======================================================

if (
  typeof window !== "undefined"
) {

  window.syncKalanData =
    syncPendingData;

  window.syncKalanContent =
    syncEducationContent;

  window.enableKalanAutoSync =
    enableAutoSync;

}