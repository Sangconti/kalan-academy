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

  cacheClasses,
  cacheSubjects,
  cacheChapters,
  cacheLessons,
  cacheLessonBlocks,
  cacheQuizzes,
  cacheQuizQuestions,
  cacheBadges,

  addToSyncQueue

} from "./db";


// ======================================
// ÉTAT SYNCHRONISATION
// ======================================

let syncing = false;


// ======================================
// SYNCHRONISATION GÉNÉRALE
// ======================================

export async function syncPendingData() {

  if (syncing) {

    console.log(
      "⏳ Synchronisation déjà en cours"
    );

    return;

  }


  syncing = true;


  try {

    console.log(
      "🔄 Synchronisation des données utilisateur..."
    );


    /*
      ----------------------------------
      1. AJOUTER LES DONNÉES LOCALES
      NON SYNCHRONISÉES À LA QUEUE
      ----------------------------------
    */

    await queueUnsyncedProgress();

    await queueUnsyncedQuizAttempts();


    /*
      ----------------------------------
      2. TRAITER LA QUEUE
      ----------------------------------
    */

    const queue =
      await getSyncQueue();


    console.log(
      `📦 ${queue.length} opération(s) en attente`
    );


    let success = 0;

    let errors = 0;


    for (
      const item of queue
    ) {

      try {

        const result =
          await processQueueItem(
            item
          );


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
          "Erreur synchronisation opération :",
          item,
          error
        );

      }

    }


    console.log(
      "===================================="
    );

    console.log(
      "✅ SYNCHRONISATION TERMINÉE"
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

      success,

      errors

    };

  }

  finally {

    syncing = false;

  }

}


// ======================================
// AJOUT PROGRESSIONS NON SYNCHRONISÉES
// ======================================

async function queueUnsyncedProgress() {

  const list =
    await getUnsyncedProgress();


  for (
    const progress of list
  ) {

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


// ======================================
// AJOUT QUIZ NON SYNCHRONISÉS
// ======================================

async function queueUnsyncedQuizAttempts() {

  const list =
    await getUnsyncedQuizAttempts();


  for (
    const attempt of list
  ) {

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

        score:
          Number(attempt.score) || 0,

        answers:
          attempt.answers || {},

        attempt_number:
          attempt.attempt_number || 1

      }

    });

  }

}


// ======================================
// TRAITEMENT D'UNE OPÉRATION
// ======================================

async function processQueueItem(item) {

  const {
    table_name,
    action,
    payload,
    local_record_id
  } = item;

  /*
  ======================================
  XP
  ======================================
  */

  if (
    table_name === "profiles" &&
    action === "xp"
  ) {

    return await syncXP(payload);
  }

  /*
  ======================================
  PROGRESSION
  ======================================
  */

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
      local_record_id !==
      undefined
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

  /*
  ======================================
  QUIZ ATTEMPT
  ======================================
  */

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

      /*
      Si cette tentative existe déjà
      côté serveur, elle est considérée
      comme synchronisée.
      */

      if (
        error.code === "23505"
      ) {

        console.warn(
          "⚠️ Tentative quiz déjà présente dans Supabase :",
          payload
        );

        if (
          local_record_id !==
          undefined
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
      local_record_id !==
      undefined
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

  /*
  ======================================
  USER BADGES
  ======================================

  IMPORTANT :
  user_badges possède une contrainte
  unique :

    user_id + badge_id

  On utilise donc UPSERT et non INSERT.

  Ainsi :
  - badge absent → création
  - badge déjà présent → aucune erreur
  - queue offline → supprimée correctement
  */

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
        "❌ Erreur synchronisation user_badges :",
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

  /*
  ======================================
  INSERT GÉNÉRIQUE
  ======================================
  */

  if (
    action === "insert"
  ) {

    const {
      error
    } = await supabase
      .from(table_name)
      .insert(payload);

    if (error) {

      /*
      Une opération déjà présente
      côté serveur est considérée
      comme réussie.
      */

      if (
        error.code === "23505"
      ) {

        console.warn(
          `⚠️ ${table_name} déjà présent dans Supabase`
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

  /*
  ======================================
  UPDATE GÉNÉRIQUE
  ======================================
  */

  if (
    action === "update"
  ) {

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

  /*
  ======================================
  DELETE GÉNÉRIQUE
  ======================================
  */

  if (
    action === "delete"
  ) {

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

  /*
  ======================================
  ACTION INCONNUE
  ======================================
  */

  console.warn(
    "⚠️ Action inconnue :",
    item
  );

  return false;
}


// ======================================
// SYNCHRONISATION XP
// ======================================

async function syncXP(
  payload
) {

  const userId =
    payload?.user_id;


  const amount =
    Number(payload?.amount) || 0;


  if (!userId || amount <= 0)
    return true;


  /*
    On récupère le XP actuel
    directement depuis Supabase.

    Puis on ajoute le montant
    en attente.

    Cela permet de traiter plusieurs
    opérations XP offline l'une après
    l'autre.
  */

  const {

    data: profile,

    error: getError

  } = await supabase

    .from("profiles")

    .select(
      "xp, level"
    )

    .eq(
      "id",
      userId
    )

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


  /*
    Mise à jour cache XP.
  */

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

    // Ignorer

  }


  console.log(
    `☁️ XP synchronisé : +${amount} → ${newXP} XP`
  );


  return true;

}


// ======================================
// SYNCHRONISATION CONTENU PÉDAGOGIQUE
// ======================================

export async function syncEducationContent() {

  try {

    console.log(
      "📚 Synchronisation contenu pédagogique..."
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

      .order(
        "order_number"
      );


    if (classesError)
      throw classesError;


    console.log(
      "CLASSES TELECHARGEES",
      classes?.length || 0
    );


    await cacheClasses(
      classes || []
    );


    // ==================================
    // SUBJECTS
    // ==================================

    const {

      data: subjects,

      error: subjectsError

    } = await supabase

      .from("subjects")

      .select("*");


    if (subjectsError)
      throw subjectsError;


    console.log(
      "SUBJECTS TELECHARGES",
      subjects?.length || 0
    );


    await cacheSubjects(
      subjects || []
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

      .order(
        "order_number"
      );


    if (chaptersError)
      throw chaptersError;


    console.log(
      "CHAPTERS TELECHARGES",
      chapters?.length || 0
    );


    await cacheChapters(
      chapters || []
    );


    // ==================================
    // DIAGNOSTIC
    // ==================================

    console.log(
      "================================="
    );

    console.log(
      "📚 DIAGNOSTIC CONTENU OFFLINE"
    );

    console.log(
      "================================="
    );


    for (
      const subject of subjects || []
    ) {

      const subjectChapters =
        (chapters || []).filter(

          chapter =>

            String(
              chapter.subject_id
            ) ===

            String(
              subject.id
            )

        );


      console.log(

        `📘 ${subject.name} | ${subject.id} | ${subjectChapters.length} chapitres`

      );

    }


    // ==================================
    // LESSONS
    // ==================================

    const {

      data: lessons,

      error: lessonsError

    } = await supabase

      .from("lessons")

      .select("*");


    if (lessonsError)
      throw lessonsError;


    console.log(
      "LESSONS TELECHARGEES",
      lessons?.length || 0
    );


    await cacheLessons(
      lessons || []
    );


    // ==================================
    // BLOCKS
    // ==================================

    const {

      data: blocks,

      error: blocksError

    } = await supabase

      .from("lesson_blocks")

      .select("*");


    if (blocksError)
      throw blocksError;


    await cacheLessonBlocks(
      blocks || []
    );


    // ==================================
    // QUIZZ
    // ==================================

    const {

      data: quizzes,

      error: quizzesError

    } = await supabase

      .from("quizzes")

      .select("*");


    if (quizzesError)
      throw quizzesError;


    await cacheQuizzes(
      quizzes || []
    );


    // ==================================
    // QUESTIONS
    // ==================================

    const {

      data: questions,

      error: questionsError

    } = await supabase

      .from("quiz_questions")

      .select("*");


    if (questionsError)
      throw questionsError;


    await cacheQuizQuestions(
      questions || []
    );


    // ==================================
    // BADGES
    // ==================================

    const {

      data: badges,

      error: badgesError

    } = await supabase

      .from("badges")

      .select("*");


    if (!badgesError) {

      await cacheBadges(
        badges || []
      );

    }


    console.log(
      "================================="
    );

    console.log(
      "✅ CONTENU OFFLINE TERMINÉ"
    );

    console.log(
      "================================="
    );


    return {

      success: true,

      classes:
        classes?.length || 0,

      subjects:
        subjects?.length || 0,

      chapters:
        chapters?.length || 0,

      lessons:
        lessons?.length || 0,

      blocks:
        blocks?.length || 0,

      quizzes:
        quizzes?.length || 0,

      questions:
        questions?.length || 0

    };

  }

  catch (error) {

    console.error(
      "❌ ERREUR SYNCHRO EDUCATION",
      error
    );


    return {

      success: false,

      error

    };

  }

}


// ======================================
// TÉLÉCHARGER CONTENU LEÇON
// ======================================

export async function downloadLessonContent(
  lessonId
) {

  try {

    // ==================================
    // LEÇON
    // ==================================

    const {

      data: lesson,

      error: lessonError

    } = await supabase

      .from("lessons")

      .select("*")

      .eq(
        "id",
        lessonId
      )

      .single();


    if (lessonError)
      throw lessonError;


    // ==================================
    // BLOCS
    // ==================================

    const {

      data: blocks,

      error: blocksError

    } = await supabase

      .from("lesson_blocks")

      .select("*")

      .eq(
        "lesson_id",
        lessonId
      );


    if (blocksError)
      console.error(
        "Erreur blocs :",
        blocksError
      );


    // ==================================
    // QUIZ
    // ==================================

    const {

      data: quizzes,

      error: quizzesError

    } = await supabase

      .from("quizzes")

      .select("*")

      .eq(
        "lesson_id",
        lessonId
      );


    if (quizzesError)
      console.error(
        "Erreur quiz :",
        quizzesError
      );


    // ==================================
    // QUESTIONS
    // ==================================

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
        );


      if (questionsError) {

        console.error(
          "Erreur questions quiz :",
          questionsError
        );

      }

      else {

        questions =
          quizQuestions || [];

      }

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

  catch (err) {

    console.error(
      "Erreur téléchargement leçon :",
      err.message
    );


    return null;

  }

}


// ======================================
// AUTO SYNC
// ======================================

export function enableAutoSync() {

  if (
    typeof window ===
    "undefined"
  ) {

    return;

  }


  /*
    Évite d'enregistrer plusieurs
    fois le même listener.
  */

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


      /*
        1. Données utilisateur
      */

      await syncPendingData();


      /*
        2. Nouveau contenu
      */

      await syncEducationContent();


      console.log(
        "🔄 Contenu pédagogique actualisé"
      );

    }

  );


  console.log(
    "✅ Auto-sync Kalan Academy activé"
  );

}


// ======================================
// GLOBAL DEBUG
// ======================================

if (
  typeof window !==
  "undefined"
) {

  window.syncKalanData =
    syncPendingData;

  window.syncKalanContent =
    syncEducationContent;

  window.enableKalanAutoSync =
    enableAutoSync;

}