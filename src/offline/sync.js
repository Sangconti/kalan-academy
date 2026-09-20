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

  getLocalProgressResetVersion,
  setLocalProgressResetVersion,
  clearLocalUserProgress,

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
// VÉRIFICATION RÉINITIALISATION
// ======================================

async function checkProgressReset() {
  try {
    /*
      ----------------------------------
      1. UTILISATEUR ACTUEL
      ----------------------------------

      On utilise l'utilisateur réellement
      connecté.

      Cela permet de ne supprimer que
      les données locales de cet utilisateur.
    */

    const {
      data: userData,
      error: userError
    } = await supabase.auth.getUser();


    if (userError) {
      console.warn(
        "⚠️ Impossible de récupérer l'utilisateur connecté :",
        userError
      );

      return {
        success: false,
        checked: false
      };
    }


    const userId =
      userData?.user?.id;


    if (!userId) {
      console.log(
        "ℹ️ Aucun utilisateur connecté : vérification reset ignorée."
      );

      return {
        success: true,
        checked: false
      };
    }


    /*
      ----------------------------------
      2. VERSION SERVEUR
      ----------------------------------
    */

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from("profiles")
      .select(
        "progress_reset_version"
      )
      .eq(
        "id",
        userId
      )
      .maybeSingle();


    if (profileError) {
      console.warn(
        "⚠️ Impossible de vérifier progress_reset_version :",
        profileError
      );

      return {
        success: false,
        checked: false
      };
    }


    /*
      Si aucun profil n'est trouvé,
      on ne touche pas aux données locales.
    */

    if (!profile) {
      console.warn(
        "⚠️ Profil utilisateur introuvable lors de la vérification du reset :",
        userId
      );

      return {
        success: false,
        checked: false
      };
    }


    const serverVersion =
      Math.max(
        0,
        Number(
          profile.progress_reset_version
        ) || 0
      );


    /*
      ----------------------------------
      3. VERSION LOCALE
      ----------------------------------
    */

    const localVersion =
      getLocalProgressResetVersion(
        userId
      );


    console.log(
      "🔐 Vérification réinitialisation progression :",
      {
        userId,
        localVersion,
        serverVersion
      }
    );


    /*
      ----------------------------------
      4. UNE NOUVELLE RÉINITIALISATION
      A ÉTÉ DÉTECTÉE
      ----------------------------------

      Exemple :

        local = 0
        serveur = 1

      Cela signifie qu'une réinitialisation
      a été effectuée depuis le dernier
      passage de l'application.

      On doit donc supprimer les anciennes
      données locales AVANT toute nouvelle
      synchronisation.
    */

    if (
      serverVersion >
      localVersion
    ) {
      console.log(
        "🚨 Nouvelle réinitialisation détectée !"
      );

      console.log(
        "🧹 Suppression de l'ancienne progression locale..."
      );


      await clearLocalUserProgress(
        userId
      );


      /*
        On enregistre la nouvelle version
        uniquement après avoir supprimé
        les anciennes données.
      */

      setLocalProgressResetVersion(
        userId,
        serverVersion
      );


      console.log(
        "✅ Réinitialisation locale appliquée :",
        {
          userId,
          previousVersion:
            localVersion,
          newVersion:
            serverVersion
        }
      );


      return {
        success: true,
        checked: true,
        resetDetected: true,
        userId,
        localVersion,
        serverVersion
      };
    }


    /*
      ----------------------------------
      5. PREMIÈRE INITIALISATION
      ----------------------------------

      Si le serveur et le local sont
      tous les deux à 0, on initialise
      simplement la version locale.

      Cela évite de refaire cette logique
      à chaque synchronisation.
    */

    if (
      serverVersion ===
      localVersion
    ) {
      /*
        On écrit quand même la valeur
        lorsqu'elle n'existait pas encore.

        Pour la version 0, cela permet
        notamment d'initialiser proprement
        le stockage local.
      */

      setLocalProgressResetVersion(
        userId,
        serverVersion
      );
    }


    /*
      ----------------------------------
      6. CAS ANORMAL
      ----------------------------------

      La version serveur est supposée
      être monotone.

      Elle ne devrait donc jamais être
      inférieure à la version locale.

      On ne supprime aucune donnée dans
      ce cas afin d'éviter une suppression
      locale injustifiée.
    */

    if (
      serverVersion <
      localVersion
    ) {
      console.warn(
        "⚠️ Version locale supérieure à la version serveur :",
        {
          userId,
          localVersion,
          serverVersion
        }
      );
    }


    return {
      success: true,
      checked: true,
      resetDetected: false,
      userId,
      localVersion,
      serverVersion
    };
  }

  catch (error) {
    console.error(
      "❌ Erreur vérification réinitialisation progression :",
      error
    );

    return {
      success: false,
      checked: false,
      error
    };
  }
}


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
      0. VÉRIFIER UNE ÉVENTUELLE
         RÉINITIALISATION SERVEUR
      ----------------------------------

      IMPORTANT :

      Cette étape doit impérativement
      avoir lieu AVANT de transformer les
      anciennes données Dexie en opérations
      de synchronisation.

      Sinon une ancienne progression
      pourrait être renvoyée vers Supabase
      après une réinitialisation admin.
    */

    const resetCheck =
      await checkProgressReset();


    /*
      ----------------------------------
      PROTECTION EN CAS D'ERREUR RÉSEAU
      ----------------------------------

      Si la vérification du reset n'a pas
      pu être effectuée, on ne prend pas
      le risque d'envoyer une ancienne
      progression potentiellement réinitialisée.

      On arrête donc uniquement la
      synchronisation utilisateur.
    */

    if (
      resetCheck?.checked === false
    ) {
      console.warn(
        "⚠️ Vérification de réinitialisation impossible."
      );

      console.warn(
        "⏸️ Synchronisation utilisateur interrompue pour éviter de ressusciter une ancienne progression."
      );

      return {
        success: 0,
        errors: 1,
        resetCheckFailed: true
      };
    }


    /*
      ----------------------------------
      1. AJOUTER LES DONNÉES LOCALES
         NON SYNCHRONISÉES À LA QUEUE
      ----------------------------------

      La vérification du reset a déjà
      été effectuée.

      Les anciennes données d'un élève
      réinitialisé ont donc été supprimées.
    */

    await Promise.all([
      queueUnsyncedProgress(),
      queueUnsyncedQuizAttempts()
    ]);


    /*
      ----------------------------------
      2. DEUXIÈME VÉRIFICATION
      ----------------------------------

      Cette deuxième vérification protège
      contre le cas où une réinitialisation
      aurait été effectuée entre :

        - la première vérification
        - la création de la queue

      Si une nouvelle version apparaît,
      clearLocalUserProgress() supprime
      immédiatement les opérations locales
      correspondantes avant leur traitement.
    */

    const secondResetCheck =
      await checkProgressReset();


    if (
      secondResetCheck?.checked === false
    ) {
      console.warn(
        "⚠️ Deuxième vérification reset impossible."
      );

      console.warn(
        "⏸️ Traitement de la queue interrompu."
      );

      return {
        success: 0,
        errors: 1,
        resetCheckFailed: true
      };
    }


    /*
      ----------------------------------
      3. TRAITER LA QUEUE
      ----------------------------------

      IMPORTANT :

      On conserve volontairement un
      traitement séquentiel.

      Certaines opérations, notamment
      le XP et les fusions de progression,
      doivent respecter leur ordre.
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

        lesson_id:
          attempt.lesson_id || null,

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
// FUSION PROGRESSION UTILISATEUR
// ======================================

async function mergeUserProgress(
  payload,
  localRecordId
) {
  const userId =
    payload?.user_id;

  const lessonId =
    payload?.lesson_id;


  if (!userId || !lessonId) {
    console.error(
      "❌ Progression invalide :",
      payload
    );

    return false;
  }


  /*
    ----------------------------------
    1. RÉCUPÉRER LA PROGRESSION SERVEUR
    ----------------------------------
  */

  const {
    data: remoteProgress,
    error: remoteError
  } = await supabase
    .from("user_progress")
    .select(
      "user_id, lesson_id, score, completed, completed_at"
    )
    .eq(
      "user_id",
      userId
    )
    .eq(
      "lesson_id",
      lessonId
    )
    .maybeSingle();


  if (remoteError) {
    console.error(
      "❌ Erreur récupération user_progress :",
      remoteError
    );

    return false;
  }


  /*
    ----------------------------------
    2. CALCUL DU MEILLEUR SCORE
    ----------------------------------
  */

  const localScore =
    Number(payload?.score) || 0;

  const remoteScore =
    Number(remoteProgress?.score) || 0;

  const bestScore =
    Math.max(
      localScore,
      remoteScore
    );


  /*
    ----------------------------------
    3. COMPLETED PERMANENT
    ----------------------------------
  */

  const completed =
    remoteProgress?.completed === true ||
    payload?.completed === true ||
    bestScore >= 80;


  /*
    ----------------------------------
    4. DATE DE COMPLÉTION
    ----------------------------------
  */

  let completedAt =
    remoteProgress?.completed_at ||
    payload?.completed_at ||
    null;


  if (
    completed &&
    !completedAt
  ) {
    completedAt =
      new Date().toISOString();
  }


  /*
    ----------------------------------
    5. OBJET FINAL
    ----------------------------------
  */

  const mergedProgress = {
    user_id:
      userId,

    lesson_id:
      lessonId,

    score:
      bestScore,

    completed:
      completed,

    completed_at:
      completedAt
  };


  console.log(
    "🔀 Fusion progression :",
    {
      lessonId,
      localScore,
      remoteScore,
      bestScore,
      localCompleted:
        Boolean(payload?.completed),
      remoteCompleted:
        Boolean(remoteProgress?.completed),
      completed
    }
  );


  /*
    ----------------------------------
    6. ENVOYER LA VALEUR FUSIONNÉE
       VERS SUPABASE
    ----------------------------------
  */

  const {
    data: savedProgress,
    error: saveError
  } = await supabase
    .from("user_progress")
    .upsert(
      mergedProgress,
      {
        onConflict:
          "user_id,lesson_id"
      }
    )
    .select(
      "user_id, lesson_id, score, completed, completed_at"
    )
    .single();


  if (saveError) {
    console.error(
      "❌ Erreur sauvegarde user_progress :",
      saveError
    );

    return false;
  }


  /*
    ----------------------------------
    7. METTRE DEXIE À JOUR
    ----------------------------------
  */

  try {
    const existing =
      localRecordId !== undefined &&
      localRecordId !== null
        ? await db.userProgress.get(
            localRecordId
          )
        : null;


    const localRecord = {
      ...(existing || {}),

      user_id:
        savedProgress?.user_id ||
        userId,

      lesson_id:
        savedProgress?.lesson_id ||
        lessonId,

      score:
        Number(
          savedProgress?.score
        ) || bestScore,

      completed:
        savedProgress?.completed === true ||
        completed,

      completed_at:
        savedProgress?.completed_at ||
        completedAt,

      synced:
        true,

      updated_at:
        new Date().toISOString()
    };


    if (existing?.id) {
      localRecord.id =
        existing.id;
    }
    else if (
      localRecordId !== undefined &&
      localRecordId !== null
    ) {
      localRecord.id =
        localRecordId;
    }


    await db.userProgress.put(
      localRecord
    );


    console.log(
      "💾 Progression locale mise à jour après synchronisation"
    );
  }

  catch (localError) {
    console.warn(
      "⚠️ Impossible de mettre à jour la progression locale :",
      localError
    );
  }


  /*
    ----------------------------------
    8. MARQUER L'ENREGISTREMENT
       LOCAL COMME SYNCHRONISÉ
    ----------------------------------
  */

  if (
    localRecordId !== undefined &&
    localRecordId !== null
  ) {
    await markProgressSynced(
      localRecordId
    );
  }


  console.log(
    "☁️ Progression synchronisée :",
    {
      lessonId,
      score:
        savedProgress?.score ||
        bestScore,
      completed:
        savedProgress?.completed === true ||
        completed
    }
  );


  return true;
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
    return await syncXP(
      payload
    );
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
    return await mergeUserProgress(
      payload,
      local_record_id
    );
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
      .insert(
        payload
      );


    if (error) {

      if (
        error.code === "23505"
      ) {
        console.warn(
          "⚠️ Tentative quiz déjà présente dans Supabase :",
          payload
        );


        if (
          local_record_id !==
          undefined &&
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
      local_record_id !==
      undefined &&
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


  /*
  ======================================
  USER BADGES
  ======================================
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
      .insert(
        payload
      );


    if (error) {

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
      .update(
        payload
      )
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


  if (
    !userId ||
    amount <= 0
  ) {
    return true;
  }


  /*
    ----------------------------------
    VÉRIFICATION RESET AVANT XP
    ----------------------------------

    Une opération XP ancienne ne doit
    jamais pouvoir ressusciter le XP
    supprimé par une réinitialisation.
  */

  const resetCheck =
    await checkProgressReset();


  if (
    resetCheck?.checked === false
  ) {
    console.warn(
      "⏸️ XP non synchronisé : vérification reset impossible."
    );

    return false;
  }


  /*
    Si une nouvelle réinitialisation a
    été détectée, clearLocalUserProgress()
    a déjà supprimé les anciennes
    opérations de cet utilisateur.

    Cette opération peut donc être
    considérée comme annulée.
  */

  if (
    resetCheck?.resetDetected === true &&
    String(resetCheck.userId) ===
      String(userId)
  ) {
    console.log(
      "🧹 Ancienne opération XP annulée après réinitialisation."
    );

    return true;
  }


  /*
    ----------------------------------
    RÉCUPÉRER LE XP SERVEUR
    ----------------------------------
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


    const [
      classesResult,
      subjectsResult,
      chaptersResult,
      lessonsResult,
      blocksResult,
      quizzesResult,
      questionsResult,
      badgesResult
    ] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("order_number"),

      supabase
        .from("subjects")
        .select("*"),

      supabase
        .from("chapters")
        .select("*")
        .order("order_number"),

      supabase
        .from("lessons")
        .select("*"),

      supabase
        .from("lesson_blocks")
        .select("*"),

      supabase
        .from("quizzes")
        .select("*"),

      supabase
        .from("quiz_questions")
        .select("*"),

      supabase
        .from("badges")
        .select("*")
    ]);


    if (classesResult.error) {
      throw classesResult.error;
    }

    if (subjectsResult.error) {
      throw subjectsResult.error;
    }

    if (chaptersResult.error) {
      throw chaptersResult.error;
    }

    if (lessonsResult.error) {
      throw lessonsResult.error;
    }

    if (blocksResult.error) {
      throw blocksResult.error;
    }

    if (quizzesResult.error) {
      throw quizzesResult.error;
    }

    if (questionsResult.error) {
      throw questionsResult.error;
    }


    const classes =
      classesResult.data || [];

    const subjects =
      subjectsResult.data || [];

    const chapters =
      chaptersResult.data || [];

    const lessons =
      lessonsResult.data || [];

    const blocks =
      blocksResult.data || [];

    const quizzes =
      quizzesResult.data || [];

    const questions =
      questionsResult.data || [];

    const badges =
      badgesResult.error
        ? []
        : badgesResult.data || [];


    console.log(
      "CLASSES TELECHARGEES",
      classes.length
    );

    console.log(
      "SUBJECTS TELECHARGES",
      subjects.length
    );

    console.log(
      "CHAPTERS TELECHARGES",
      chapters.length
    );

    console.log(
      "LESSONS TELECHARGEES",
      lessons.length
    );

    console.log(
      "BLOCKS TELECHARGES",
      blocks.length
    );

    console.log(
      "QUIZZ TELECHARGES",
      quizzes.length
    );

    console.log(
      "QUESTIONS TELECHARGEES",
      questions.length
    );

    console.log(
      "BADGES TELECHARGES",
      badges.length
    );


    await cacheClasses(
      classes
    );

    await cacheSubjects(
      subjects
    );

    await cacheChapters(
      chapters
    );

    await cacheLessons(
      lessons
    );

    await cacheLessonBlocks(
      blocks
    );

    await cacheQuizzes(
      quizzes
    );

    await cacheQuizQuestions(
      questions
    );


    if (!badgesResult.error) {
      await cacheBadges(
        badges
      );
    }


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
      const subject of subjects
    ) {
      const subjectChapters =
        chapters.filter(
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
        questions.length
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

    const [
      lessonResult,
      blocksResult,
      quizzesResult
    ] = await Promise.all([
      supabase
        .from("lessons")
        .select("*")
        .eq(
          "id",
          lessonId
        )
        .single(),

      supabase
        .from("lesson_blocks")
        .select("*")
        .eq(
          "lesson_id",
          lessonId
        ),

      supabase
        .from("quizzes")
        .select("*")
        .eq(
          "lesson_id",
          lessonId
        )
    ]);


    if (lessonResult.error) {
      throw lessonResult.error;
    }


    const lesson =
      lessonResult.data;


    const blocks =
      blocksResult.error
        ? []
        : blocksResult.data || [];


    const quizzes =
      quizzesResult.error
        ? []
        : quizzesResult.data || [];


    if (blocksResult.error) {
      console.error(
        "Erreur blocs :",
        blocksResult.error
      );
    }


    if (quizzesResult.error) {
      console.error(
        "Erreur quiz :",
        quizzesResult.error
      );
    }


    // ==================================
    // QUESTIONS
    // ==================================

    let questions = [];


    if (
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

      blocks,

      quizzes,

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