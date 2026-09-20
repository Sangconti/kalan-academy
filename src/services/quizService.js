// src/services/quizService.js

import { supabase } from "../lib/supabase";

import {
  db,

  getCachedQuizQuestions,

  saveQuizAttempt,

  saveProgress,

  markQuizAttemptSynced,

  addToSyncQueue,

  getLocalProgressResetVersion,

  setLocalProgressResetVersion,

  clearLocalUserProgress
} from "../offline/db";


// =====================================
// VÉRIFICATION RESET PROGRESSION
// =====================================

async function checkProgressResetBeforeWrite(userId) {

  if (!userId) {
    return {
      success: false,
      checked: false
    };
  }


  const localVersion =
    getLocalProgressResetVersion(
      userId
    );


  const isOnline =
    typeof navigator === "undefined" ||
    navigator.onLine === true;


  /*
   * =====================================
   * MODE OFFLINE
   * =====================================
   *
   * Impossible de connaître une nouvelle
   * version côté serveur.
   *
   * On utilise donc la version locale connue.
   *
   * La synchronisation générale vérifiera
   * le serveur dès que la connexion reviendra.
   */

  if (!isOnline) {

    return {
      success: true,
      checked: false,
      offline: true,
      resetDetected: false,
      userId,
      localVersion
    };

  }


  try {

    const {
      data,
      error
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


    if (error) {
      throw error;
    }


    const serverVersion =
      Number(
        data?.progress_reset_version
      ) || 0;


    /*
     * =====================================
     * NOUVEAU RESET DÉTECTÉ
     * =====================================
     */

    if (
      serverVersion >
      localVersion
    ) {

      console.log(
        "🚨 Reset détecté avant écriture quiz/progression :",
        {
          userId,
          localVersion,
          serverVersion
        }
      );


      /*
       * Supprime :
       *
       * - userProgress
       * - quizAttempts
       * - anciennes opérations de queue
       * - cache XP
       */

      await clearLocalUserProgress(
        userId
      );


      setLocalProgressResetVersion(
        userId,
        serverVersion
      );


      console.log(
        "✅ État local invalidé avant écriture :",
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
     * =====================================
     * VERSION IDENTIQUE
     * =====================================
     */

    if (
      serverVersion ===
      localVersion
    ) {

      setLocalProgressResetVersion(
        userId,
        serverVersion
      );


      return {
        success: true,
        checked: true,
        resetDetected: false,
        userId,
        localVersion,
        serverVersion
      };

    }


    /*
     * =====================================
     * VERSION LOCALE SUPÉRIEURE
     * =====================================
     *
     * On ne supprime surtout pas les
     * données locales.
     */

    console.warn(
      "⚠️ Version locale supérieure à la version serveur :",
      {
        userId,
        localVersion,
        serverVersion
      }
    );


    return {
      success: true,
      checked: true,
      resetDetected: false,
      userId,
      localVersion,
      serverVersion
    };


  } catch (error) {

    /*
     * Impossible de vérifier le serveur.
     *
     * En ligne, on ne considère pas que
     * l'état est sûr pour une écriture.
     */

    console.warn(
      "⚠️ Impossible de vérifier le reset avant écriture :",
      error
    );


    return {
      success: false,
      checked: false,
      resetDetected: false,
      userId,
      localVersion
    };

  }

}


// =====================================
// CALCUL XP
// =====================================

function calculateQuizXP(score) {

  if (score >= 80)
    return 100;

  if (score >= 50)
    return 50;

  return 20;

}


// =====================================
// QUESTIONS QUIZ
// =====================================

export async function getQuizQuestions(
  quizId
) {

  /*
    Priorité au cache local.

    C'est essentiel pour le vrai
    fonctionnement offline.
  */

  const cached =
    await getCachedQuizQuestions(
      quizId
    );


  if (
    cached &&
    cached.length > 0
  ) {

    console.log(
      "📦 QUESTIONS QUIZ DEPUIS DEXIE",
      cached.length
    );

    return cached;

  }


  /*
    Si aucune question locale,
    tentative Supabase.
  */

  if (
    typeof navigator !== "undefined" &&
    !navigator.onLine
  ) {

    return [];

  }


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
      "order_number"
    );


  if (error) {

    console.error(
      "Erreur questions quiz :",
      error
    );

    return [];

  }


  return data || [];

}


// =====================================
// CORRECTION QCM
// =====================================

export async function submitQuizAttempt(

  userId,

  quizId,

  lessonId,

  answers,

  questions = []

) {

  /*
   * ==========================================================
   * VÉRIFICATION RESET
   * ==========================================================
   *
   * Cette vérification intervient AVANT :
   *
   * - saveQuizAttempt()
   * - l'écriture Supabase
   * - addToSyncQueue()
   */

  const resetCheck =
    await checkProgressResetBeforeWrite(
      userId
    );


  /*
   * Si nous sommes en ligne mais que
   * la vérification du reset échoue,
   * on ne crée pas de nouvelle tentative.
   *
   * Cela évite de risquer de remettre
   * une ancienne progression dans la queue.
   */

  if (
    !resetCheck.success
  ) {

    throw new Error(
      "Impossible de vérifier l'état de la progression. Veuillez réessayer."
    );

  }


  /*
   * Si un reset vient d'être détecté,
   * l'état local a déjà été nettoyé.
   *
   * La nouvelle tentative peut normalement
   * être enregistrée : elle appartient à
   * la nouvelle progression.
   */


  /*
    Si les questions ne sont pas
    fournies, on les récupère.
  */

  if (
    !questions ||
    questions.length === 0
  ) {

    questions =
      await getQuizQuestions(
        quizId
      );

  }


  if (
    !questions ||
    questions.length === 0
  ) {

    throw new Error(
      "Aucune question disponible pour ce quiz."
    );

  }


  /*
    ------------------------------------
    CORRECTION
    ------------------------------------
  */

  let correct = 0;


  questions.forEach(
    (question, index) => {

      const userAnswer =
        answers?.[index];

      const correctIndex =
        Number(question.correct_index);

      const isCorrect =
        Number(userAnswer) === correctIndex;

      console.log(
        `📝 QUESTION ${index + 1}`,
        {
          userAnswer,

          userAnswerText:
            question.choices?.[
              Number(userAnswer)
            ],

          correctIndex,

          correctAnswerText:
            question.choices?.[
              correctIndex
            ],

          isCorrect
        }
      );

      if (isCorrect) {
        correct++;
      }

    }
  );


  const total =
    questions.length;


  const score =
    total > 0

      ? Math.round(
          (correct / total) * 100
        )

      : 0;


  const passed =
    score >= 80;


  const xp =
    calculateQuizXP(score);


  /*
    ------------------------------------
    DONNÉES LOCALES
    ------------------------------------
  */

  const localAttempt = {

    user_id:
      userId,

    quiz_id:
      quizId,

    lesson_id:
      lessonId,

    score,

    correct_answers:
      correct,

    total_questions:
      total,

    passed,

    completed_at:
      new Date().toISOString()

  };


  const localId =
    await saveQuizAttempt(
      localAttempt
    );


  console.log(
    "💾 Tentative quiz sauvegardée localement :",
    {
      id: localId,
      quizId,
      score,
      correct,
      total
    }
  );


  /*
    ------------------------------------
    DONNÉES SUPABASE
    ------------------------------------
  */

  const remotePayload = {

    user_id:
      userId,

    quiz_id:
      quizId,

    score,

    answers:
      answers || {},

    attempt_number:
      1

  };


  /*
    ------------------------------------
    SYNCHRONISATION ONLINE
    ------------------------------------
  */

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {

    try {

      /*
       * Nouvelle vérification juste avant
       * l'écriture distante.
       *
       * Cela réduit le risque qu'un reset
       * soit intervenu pendant la correction
       * du quiz.
       */

      const finalResetCheck =
        await checkProgressResetBeforeWrite(
          userId
        );


      if (
        !finalResetCheck.success
      ) {

        throw new Error(
          "Impossible de vérifier la réinitialisation avant synchronisation."
        );

      }


      const {

        data: attempt,

        error: attemptError

      } = await supabase

        .from("quiz_attempts")

        .insert(
          remotePayload
        )

        .select()

        .single();


      if (attemptError)
        throw attemptError;


      await markQuizAttemptSynced(
        localId
      );


      console.log(
        "☁️ Tentative quiz synchronisée"
      );


      return {

        attempt,

        score,

        correct,

        total,

        xp,

        synced: true

      };

    }

    catch (error) {

      /*
        Même avec une erreur réseau,
        la tentative reste locale et
        peut être mise en queue.
      */

      console.error(
        "⚠️ Tentative quiz non synchronisée :",
        error
      );

    }

  }


  /*
    ------------------------------------
    QUEUE
    ------------------------------------
   *
   * Une dernière vérification est faite
   * avant de remettre la tentative dans
   * syncQueue.
   */

  const queueResetCheck =
    await checkProgressResetBeforeWrite(
      userId
    );


  if (
    !queueResetCheck.success
  ) {

    /*
     * On ne met pas une opération
     * potentiellement ancienne en queue
     * si nous ne pouvons pas vérifier
     * l'état du compte.
     */

    return {

      attempt: {

        id:
          localId,

        ...localAttempt

      },

      score,

      correct,

      total,

      xp,

      synced: false,

      queued: false

    };

  }


  /*
   * Si un reset vient d'être détecté,
   * clearLocalUserProgress() a supprimé
   * la tentative locale précédente.
   *
   * La tentative actuelle peut être
   * conservée comme nouvelle tentative.
   */

  await addToSyncQueue({

    table_name:
      "quiz_attempts",

    record_id:
      localId,

    action:
      "insert",

    local_record_id:
      localId,

    payload:
      remotePayload

  });


  console.log(
    "📥 Tentative quiz ajoutée à syncQueue."
  );


  return {

    attempt: {

      id:
        localId,

      ...localAttempt

    },

    score,

    correct,

    total,

    xp,

    synced: false

  };

}


// =====================================
// VALIDATION PROGRESSION CHAPITRE
// =====================================

export async function validateChapterProgress(
  userId,
  lessonId,
  score
) {

  /*
   * Vérification avant toute écriture.
   */

  const resetCheck =
    await checkProgressResetBeforeWrite(
      userId
    );


  if (
    !resetCheck.success
  ) {

    console.warn(
      "⚠️ Validation chapitre annulée : reset impossible à vérifier."
    );

    return null;

  }


  const numericScore =
    Number(score) || 0;


  const completed =
    numericScore >= 80;


  const payload = {

    user_id:
      userId,

    lesson_id:
      lessonId,

    completed,

    completion_percentage:
      numericScore,

    last_score:
      numericScore,

    completed_at:
      completed
        ? new Date().toISOString()
        : null

  };


  // =====================================
  // MODE ONLINE
  // =====================================

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {

    try {

      /*
       * Vérification supplémentaire avant
       * l'upsert distant.
       */

      const finalResetCheck =
        await checkProgressResetBeforeWrite(
          userId
        );


      if (
        !finalResetCheck.success
      ) {

        return null;

      }


      const {
        data,
        error
      } = await supabase
        .from("user_progress")
        .upsert(
          payload,
          {
            onConflict:
              "user_id,lesson_id"
          }
        )
        .select();


      if (!error) {

        console.log(
          "☁️ Progression chapitre synchronisée"
        );

        return data;

      }


      console.error(
        "Erreur progression online :",
        error
      );

    } catch (error) {

      console.error(
        "Erreur réseau progression :",
        error
      );

    }

  }


  // =====================================
  // MODE OFFLINE
  // =====================================

  try {

    /*
     * Dernière protection avant l'écriture
     * locale.
     */

    const offlineResetCheck =
      await checkProgressResetBeforeWrite(
        userId
      );


    if (
      !offlineResetCheck.success
    ) {

      return null;

    }


    const localId =
      await saveProgress(
        payload
      );


    if (!localId) {

      console.error(
        "❌ Impossible de sauvegarder la progression offline"
      );

      return null;

    }


    /*
     * Vérification avant ajout à la queue.
     */

    const queueResetCheck =
      await checkProgressResetBeforeWrite(
        userId
      );


    if (
      !queueResetCheck.success
    ) {

      return {

        ...payload,

        id:
          localId,

        offline:
          true,

        queued:
          false

      };

    }


    await addToSyncQueue({

      table_name:
        "user_progress",

      record_id:
        localId,

      action:
        "upsert",

      local_record_id:
        localId,

      payload: {

        user_id:
          userId,

        lesson_id:
          lessonId,

        completed:
          completed,

        score:
          numericScore,

        completed_at:
          payload.completed_at

      }

    });


    console.log(
      "💾 Progression chapitre sauvegardée offline"
    );


    return {

      ...payload,

      id:
        localId,

      offline:
        true

    };

  } catch (error) {

    console.error(
      "❌ Erreur sauvegarde progression offline :",
      error
    );

    return null;

  }

}


// =====================================
// ATTRIBUTION BADGE
// =====================================

export async function giveBadge(
  userId,
  badgeName
) {

  try {

    if (
      !userId ||
      !badgeName
    ) {

      console.warn(
        "⚠️ giveBadge : userId ou badgeName manquant"
      );

      return null;

    }


    /*
     * =====================================
     * VÉRIFICATION RESET
     * =====================================
     */

    const resetCheck =
      await checkProgressResetBeforeWrite(
        userId
      );


    if (
      !resetCheck.success
    ) {

      console.warn(
        "⚠️ Attribution badge annulée : impossible de vérifier le reset."
      );

      return null;

    }


    // =====================================
    // MODE ONLINE
    // =====================================

    if (
      typeof navigator !== "undefined" &&
      navigator.onLine
    ) {

      try {

        /*
         * Nouvelle vérification avant écriture
         * du badge.
         */

        const finalResetCheck =
          await checkProgressResetBeforeWrite(
            userId
          );


        if (
          !finalResetCheck.success
        ) {

          return null;

        }


        const {
          data: badge,
          error: badgeError
        } = await supabase
          .from("badges")
          .select("id")
          .eq(
            "name",
            badgeName
          )
          .maybeSingle();


        if (badgeError)
          throw badgeError;


        if (!badge) {

          console.warn(
            "⚠️ Badge introuvable :",
            badgeName
          );

          return null;

        }


        const {
          data,
          error
        } = await supabase
          .from("user_badges")
          .upsert(
            {
              user_id:
                userId,

              badge_id:
                badge.id
            },
            {
              onConflict:
                "user_id,badge_id"
            }
          );


        if (error)
          throw error;


        console.log(
          "🏆 Badge attribué online :",
          badgeName
        );


        return data;

      } catch (onlineError) {

        /*
         * Si la connexion disparaît pendant
         * l'appel Supabase, on continue avec
         * le mécanisme offline.
         */

        console.warn(
          "⚠️ Attribution badge online impossible, passage offline :",
          onlineError
        );

      }

    }


    // =====================================
    // MODE OFFLINE
    // =====================================

    const offlineResetCheck =
      await checkProgressResetBeforeWrite(
        userId
      );


    if (
      !offlineResetCheck.success
    ) {

      return null;

    }


    const badge =
      await db.badges
        .where("name")
        .equals(badgeName)
        .first();


    if (!badge) {

      console.warn(
        "⚠️ Badge non trouvé dans le cache Dexie :",
        badgeName
      );

      return null;

    }


    // =====================================
    // AJOUT À LA FILE DE SYNCHRONISATION
    // =====================================

    const payload = {

      user_id:
        userId,

      badge_id:
        badge.id

    };


    const localRecordId =
      `${userId}-${badge.id}`;


    /*
     * Dernière vérification avant d'ajouter
     * le badge à syncQueue.
     */

    const queueResetCheck =
      await checkProgressResetBeforeWrite(
        userId
      );


    if (
      !queueResetCheck.success
    ) {

      return null;

    }


    await addToSyncQueue({

      table_name:
        "user_badges",

      record_id:
        localRecordId,

      action:
        "insert",

      local_record_id:
        localRecordId,

      payload

    });


    console.log(
      "💾 Badge ajouté à la file offline :",
      badgeName
    );


    return {

      ...payload,

      offline:
        true

    };


  } catch (error) {

    console.error(
      "Erreur attribution badge :",
      error
    );

    return null;

  }

}