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


let syncing = false;
let educationSyncing = false;


// ======================================================
// UTILITAIRES
// ======================================================

function isOnline() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine === true;
}


function now() {
  return new Date().toISOString();
}


// ======================================================
// SYNCHRONISATION UTILISATEUR
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


    await queueUnsyncedProgress();

    await queueUnsyncedQuizAttempts();


    const queue =
      await getSyncQueue();


    console.log(
      `📦 ${queue.length} opération(s) en attente`
    );


    let success = 0;
    let errors = 0;


    for (const item of queue) {

      try {

        if (!isOnline()) {
          console.log(
            "📴 Connexion perdue pendant la synchronisation"
          );

          errors++;

          break;
        }


        const result =
          await processQueueItem(item);


        if (result) {

          await removeFromSyncQueue(
            item.id
          );

          success++;

        } else {

          errors++;

        }

      } catch (error) {

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
      success: errors === 0,
      operations: success,
      errors
    };

  } catch (error) {

    console.error(
      "❌ Erreur synchronisation utilisateur :",
      error
    );

    return {
      success: false,
      errors: 1,
      error
    };

  } finally {

    syncing = false;

  }
}


// ======================================================
// QUEUE PROGRESSIONS
// ======================================================

async function queueUnsyncedProgress() {

  const list =
    await getUnsyncedProgress();


  if (!list.length) {
    return;
  }


  const existingQueue =
    await getSyncQueue();


  const existingKeys =
    new Set(
      existingQueue.map(item =>
        `${item.table_name}:${item.action}:${item.local_record_id}`
      )
    );


  console.log(
    `📊 ${list.length} progression(s) locale(s) à synchroniser`
  );


  for (const progress of list) {

    const key =
      `user_progress:upsert:${progress.id}`;


    if (existingKeys.has(key)) {
      continue;
    }


    await addToSyncQueue({

      table_name: "user_progress",

      record_id: progress.id,

      action: "upsert",

      local_record_id: progress.id,

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


    existingKeys.add(key);
  }
}


// ======================================================
// QUEUE QUIZ ATTEMPTS
// ======================================================

async function queueUnsyncedQuizAttempts() {

  const list =
    await getUnsyncedQuizAttempts();


  if (!list.length) {
    return;
  }


  const existingQueue =
    await getSyncQueue();


  const existingKeys =
    new Set(
      existingQueue.map(item =>
        `${item.table_name}:${item.action}:${item.local_record_id}`
      )
    );


  console.log(
    `📝 ${list.length} tentative(s) quiz à synchroniser`
  );


  for (const attempt of list) {

    const key =
      `quiz_attempts:insert:${attempt.id}`;


    if (existingKeys.has(key)) {
      continue;
    }


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


    existingKeys.add(key);
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


  // ====================================================
  // XP
  // ====================================================

  if (
    table_name === "profiles" &&
    action === "xp"
  ) {

    return await syncXP(payload);
  }


  // ====================================================
  // USER PROGRESS
  // ====================================================

  if (
    table_name === "user_progress" &&
    action === "upsert"
  ) {

    const { error } =
      await supabase
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


  // ====================================================
  // QUIZ ATTEMPT
  // ====================================================

  if (
    table_name === "quiz_attempts" &&
    action === "insert"
  ) {

    const { error } =
      await supabase
        .from("quiz_attempts")
        .insert(payload);


    if (error) {

      if (error.code === "23505") {

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


  // ====================================================
  // USER BADGES
  // ====================================================

  if (
    table_name === "user_badges" &&
    action === "insert"
  ) {

    const { error } =
      await supabase
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


  // ====================================================
  // INSERT
  // ====================================================

  if (action === "insert") {

    const { error } =
      await supabase
        .from(table_name)
        .insert(payload);


    if (error) {

      if (error.code === "23505") {

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


  // ====================================================
  // UPDATE
  // ====================================================

  if (action === "update") {

    if (!payload?.id) {

      console.error(
        `❌ UPDATE ${table_name} sans id`
      );

      return false;
    }


    const { error } =
      await supabase
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


  // ====================================================
  // DELETE
  // ====================================================

  if (action === "delete") {

    if (!payload?.id) {

      console.error(
        `❌ DELETE ${table_name} sans id`
      );

      return false;
    }


    const { error } =
      await supabase
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


  if (!userId || amount <= 0) {
    return true;
  }


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


  const { error: updateError } =
    await supabase
      .from("profiles")
      .update({
        xp: newXP,
        level: newLevel
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
        xp: newXP,
        level: newLevel
      })
    );

  } catch {
    // Rien à faire
  }


  console.log(
    `☁️ XP synchronisé : +${amount} → ${newXP} XP`
  );

  return true;
}


// ======================================================
// REMPLACEMENT CACHE PÉDAGOGIQUE
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


  const addCacheDate =
    rows =>
      (rows || []).map(item => ({
        ...item,
        cached_at: cachedAt
      }));


  const classesRows =
    addCacheDate(classes);

  const subjectsRows =
    addCacheDate(subjects);

  const chaptersRows =
    addCacheDate(chapters);

  const lessonsRows =
    addCacheDate(lessons);

  const blocksRows =
    addCacheDate(blocks);

  const quizzesRows =
    addCacheDate(quizzes);

  const questionsRows =
    addCacheDate(questions);

  const badgesRows =
    addCacheDate(badges);


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
// SYNCHRONISATION CONTENU
// ======================================================

export async function syncEducationContent() {

  if (educationSyncing) {

    return {
      success: true,
      skipped: true
    };
  }


  if (!isOnline()) {

    return {
      success: false,
      offline: true
    };
  }


  educationSyncing = true;


  try {

    console.log(
      "📚 SYNCHRONISATION CONTENU"
    );


    const {
      data: classes,
      error: classesError
    } = await supabase
      .from("classes")
      .select("*")
      .order("order_number");

    if (classesError) {
      throw classesError;
    }


    const {
      data: subjects,
      error: subjectsError
    } = await supabase
      .from("subjects")
      .select("*")
      .order("order_number");

    if (subjectsError) {
      throw subjectsError;
    }


    const {
      data: chapters,
      error: chaptersError
    } = await supabase
      .from("chapters")
      .select("*")
      .order("order_number");

    if (chaptersError) {
      throw chaptersError;
    }


    const {
      data: lessons,
      error: lessonsError
    } = await supabase
      .from("lessons")
      .select("*")
      .order("order_number");

    if (lessonsError) {
      throw lessonsError;
    }


    const {
      data: blocks,
      error: blocksError
    } = await supabase
      .from("lesson_blocks")
      .select("*")
      .order("order_number");

    if (blocksError) {
      throw blocksError;
    }


    const {
      data: quizzes,
      error: quizzesError
    } = await supabase
      .from("quizzes")
      .select("*");

    if (quizzesError) {
      throw quizzesError;
    }


    const {
      data: questions,
      error: questionsError
    } = await supabase
      .from("quiz_questions")
      .select("*")
      .order("order_number");

    if (questionsError) {
      throw questionsError;
    }


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

      badgesLoaded = true;

    } else {

      console.warn(
        "⚠️ Badges non synchronisés :",
        badgesError
      );
    }


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    const collections = [
      ["classes", classes],
      ["subjects", subjects],
      ["chapters", chapters],
      ["lessons", lessons],
      ["lesson_blocks", blocks],
      ["quizzes", quizzes],
      ["quiz_questions", questions]
    ];


    for (const [name, data] of collections) {

      if (!Array.isArray(data)) {

        throw new Error(
          `Réponse ${name} invalide`
        );
      }
    }


    // -------------------------------------------------
    // IMPORTANT
    // -------------------------------------------------
    //
    // Aucun clear avant cette étape.
    // Si Supabase échoue, l'ancien cache reste intact.
    //

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


    console.log(
      "✅ CONTENU OFFLINE SYNCHRONISÉ"
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

  } catch (error) {

    console.error(
      "❌ ERREUR SYNCHRO EDUCATION :",
      error
    );


    return {
      success: false,
      error
    };

  } finally {

    educationSyncing = false;
  }
}


// ======================================================
// TÉLÉCHARGEMENT LEÇON
// ======================================================

export async function downloadLessonContent(
  lessonId
) {

  if (!lessonId || !isOnline()) {
    return null;
  }


  try {

    const {
      data: lesson,
      error: lessonError
    } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();


    if (lessonError) {
      throw lessonError;
    }


    const {
      data: blocks,
      error: blocksError
    } = await supabase
      .from("lesson_blocks")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order_number");


    if (blocksError) {
      throw blocksError;
    }


    const {
      data: quizzes,
      error: quizzesError
    } = await supabase
      .from("quizzes")
      .select("*")
      .eq("lesson_id", lessonId);


    if (quizzesError) {
      throw quizzesError;
    }


    let questions = [];


    if (quizzes?.length) {

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


      if (questionsError) {
        throw questionsError;
      }


      questions =
        quizQuestions || [];
    }


    return {
      lesson,
      blocks: blocks || [],
      quizzes: quizzes || [],
      questions
    };

  } catch (error) {

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


  window.__kalanAutoSyncEnabled = true;


  window.addEventListener(
    "online",
    async () => {

      console.log(
        "🌐 Connexion rétablie..."
      );


      await syncPendingData();

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
// DEBUG
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