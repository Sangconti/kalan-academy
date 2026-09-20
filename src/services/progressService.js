import { supabase } from "../lib/supabase";

import {
  db,
  saveProgress,
  getCachedProgress,
  addToSyncQueue,
  markProgressSynced,
  getLocalProgressResetVersion,
  setLocalProgressResetVersion,
  clearLocalUserProgress
} from "../offline/db";

/**
 * ============================================================
 * VÉRIFIER UNE RÉINITIALISATION DE PROGRESSION
 * ============================================================
 *
 * IMPORTANT :
 *
 * Avant de réutiliser une progression locale, on vérifie que
 * sa version de réinitialisation correspond à celle du serveur.
 *
 * Cela empêche un ancien état local comme :
 *
 *   score = 95
 *   completed = true
 *
 * de revenir après une réinitialisation admin.
 */
async function checkProgressResetBeforeRead(userId) {
  if (!userId) {
    return {
      success: false,
      checked: false
    };
  }

  const localVersion =
    getLocalProgressResetVersion(userId);

  const isOnline =
    typeof navigator === "undefined" ||
    navigator.onLine === true;

  /*
   * Hors ligne :
   *
   * Nous ne pouvons pas connaître une éventuelle nouvelle
   * version côté serveur.
   *
   * La synchronisation générale vérifiera la version dès que
   * le serveur sera de nouveau accessible.
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
      .select("progress_reset_version")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const serverVersion =
      Number(
        data?.progress_reset_version
      ) || 0;

    /*
     * ========================================================
     * NOUVELLE RÉINITIALISATION DÉTECTÉE
     * ========================================================
     */

    if (serverVersion > localVersion) {

      console.log(
        "🚨 Nouvelle réinitialisation détectée avant lecture locale :",
        {
          userId,
          localVersion,
          serverVersion
        }
      );

      /*
       * Suppression de l'ancien état local.
       *
       * Cette fonction supprime :
       *   - userProgress
       *   - quizAttempts
       *   - anciennes opérations de sync liées à l'utilisateur
       *   - cache XP
       */
      await clearLocalUserProgress(userId);

      /*
       * On mémorise immédiatement la nouvelle version.
       */
      setLocalProgressResetVersion(
        userId,
        serverVersion
      );

      console.log(
        "✅ Réinitialisation locale appliquée avant lecture de progression :",
        {
          userId,
          previousVersion: localVersion,
          newVersion: serverVersion
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
     * ========================================================
     * VERSION IDENTIQUE
     * ========================================================
     */

    if (serverVersion === localVersion) {

      /*
       * On s'assure que la version locale existe bien.
       */
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
     * ========================================================
     * VERSION LOCALE SUPÉRIEURE
     * ========================================================
     *
     * Situation anormale :
     *
     * localVersion > serverVersion
     *
     * On ne supprime surtout pas la progression locale.
     */
    console.warn(
      "⚠️ Version locale de reset supérieure à la version serveur :",
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
     * Si la vérification distante échoue, on ne doit surtout
     * pas réutiliser aveuglément une ancienne progression locale.
     *
     * La synchronisation générale pourra effectuer une nouvelle
     * vérification dès que le serveur sera accessible.
     */
    console.warn(
      "⚠️ Impossible de vérifier la version de reset avant lecture locale :",
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


/**
 * ============================================================
 * SAUVEGARDE DE LA PROGRESSION D'UNE LEÇON
 * ============================================================
 *
 * RÈGLES MÉTIER :
 *
 * 1. Une leçon est considérée comme terminée à partir de 80 %.
 *
 * 2. Une fois qu'une leçon est terminée, elle reste terminée.
 *    Un score inférieur obtenu plus tard ne peut PAS la rendre
 *    de nouveau incomplète.
 *
 * 3. Le meilleur score est toujours conservé.
 *
 * 4. Ces règles fonctionnent :
 *      - en ligne
 *      - hors ligne
 *      - après reconnexion
 *
 * 5. Une réinitialisation complète de la progression reste
 *    le seul moyen de supprimer cet état.
 */
export async function saveLessonProgress({
  userId,
  lessonId,
  score
}) {

  if (!userId || !lessonId) {
    return null;
  }


  /*
   * ==========================================================
   * VÉRIFICATION DU RESET AVANT TOUTE LECTURE LOCALE
   * ==========================================================
   *
   * C'est volontairement placé AVANT getCachedProgress().
   *
   * Ainsi, une ancienne progression locale ne peut pas être
   * utilisée pour reconstruire une progression après reset.
   */

  const resetCheck =
    await checkProgressResetBeforeRead(
      userId
    );


  /*
   * Si nous sommes en ligne mais que la vérification du reset
   * a échoué, nous ne devons pas réutiliser l'ancien cache local.
   *
   * On continue cependant avec une progression vide afin de
   * permettre une nouvelle progression.
   */
  const canUseLocalProgress =
    resetCheck.success ||
    resetCheck.offline;


  const currentScore = Math.max(
    0,
    Number(score) || 0
  );


  /*
   * ==========================================================
   * ÉTAT LOCAL EXISTANT
   * ==========================================================
   */

  const localProgress =
    canUseLocalProgress
      ? await getCachedProgress(
          userId,
          lessonId
        )
      : null;


  const localBestScore = Math.max(
    0,
    Number(localProgress?.score) || 0
  );


  const localWasCompleted =
    localProgress?.completed === true ||
    localBestScore >= 80;


  /*
   * ==========================================================
   * ÉTAT DISTANT EXISTANT
   * ==========================================================
   */

  let remoteProgress = null;


  const isOnline =
    typeof navigator === "undefined" ||
    navigator.onLine === true;


  if (isOnline) {

    try {

      const {
        data,
        error
      } = await supabase
        .from("user_progress")
        .select(
          "user_id, lesson_id, completed, score, completed_at"
        )
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .maybeSingle();


      if (error) {
        throw error;
      }


      remoteProgress =
        data || null;

    } catch (error) {

      console.warn(
        "⚠️ Impossible de lire la progression distante. Conservation de la progression locale :",
        error
      );

    }

  }


  /*
   * ==========================================================
   * CALCUL DU MEILLEUR SCORE
   * ==========================================================
   */

  const remoteBestScore = Math.max(
    0,
    Number(remoteProgress?.score) || 0
  );


  const bestScore = Math.max(
    currentScore,
    localBestScore,
    remoteBestScore
  );


  /*
   * ==========================================================
   * CALCUL DE L'ÉTAT "TERMINÉE"
   * ==========================================================
   */

  const remoteWasCompleted =
    remoteProgress?.completed === true ||
    remoteBestScore >= 80;


  const completed =
    localWasCompleted ||
    remoteWasCompleted ||
    bestScore >= 80;


  /*
   * ==========================================================
   * DATE DE TERMINAISON
   * ==========================================================
   */

  let completedAt = null;


  if (completed) {

    completedAt =
      localProgress?.completed_at ||
      remoteProgress?.completed_at ||
      new Date().toISOString();

  }


  /*
   * ==========================================================
   * PROGRESSION FINALE
   * ==========================================================
   */

  const finalProgress = {

    user_id:
      userId,

    lesson_id:
      lessonId,

    score:
      bestScore,

    completed,

    completed_at:
      completedAt

  };


  /*
   * ==========================================================
   * 1. SAUVEGARDE LOCALE
   * ==========================================================
   */

  const savedLocalId =
    await saveProgress(
      finalProgress
    );


  if (
    savedLocalId === undefined ||
    savedLocalId === null
  ) {

    throw new Error(
      "Impossible d'enregistrer la progression locale."
    );

  }


  /*
   * ==========================================================
   * 2. SYNCHRONISATION SUPABASE
   * ==========================================================
   */

  if (isOnline) {

    try {

      const {
        data,
        error
      } = await supabase
        .from("user_progress")
        .upsert(
          finalProgress,
          {
            onConflict:
              "user_id,lesson_id"
          }
        )
        .select();


      if (error) {
        throw error;
      }


      await markProgressSynced(
        savedLocalId
      );


      console.log(
        "☁️ Progression synchronisée :",
        {
          userId,
          lessonId,
          score: bestScore,
          completed
        }
      );


      return data;

    } catch (error) {

      console.warn(
        "⚠️ Progression non synchronisée, mise en attente :",
        error
      );

    }

  }


  /*
   * ==========================================================
   * 3. MISE EN FILE POUR SYNCHRONISATION
   * ==========================================================
   */

  await addToSyncQueue({

    table_name:
      "user_progress",

    record_id:
      savedLocalId,

    action:
      "upsert",

    local_record_id:
      savedLocalId,

    payload:
      finalProgress

  });


  console.log(
    "💾 Progression sauvegardée localement :",
    {
      userId,
      lessonId,
      score: bestScore,
      completed
    }
  );


  return {

    local:
      true,

    data:
      {
        ...finalProgress,

        id:
          savedLocalId,

        synced:
          false
      }

  };

}


/**
 * ============================================================
 * RÉCUPÉRER LA PROGRESSION D'UNE LEÇON
 * ============================================================
 */
export async function getLessonProgress(
  userId,
  lessonId
) {

  /*
   * Même protection que saveLessonProgress().
   *
   * Une lecture directe de getCachedProgress() ne doit pas
   * pouvoir récupérer une ancienne progression après reset.
   */

  const resetCheck =
    await checkProgressResetBeforeRead(
      userId
    );

  const canUseLocalProgress =
    resetCheck.success ||
    resetCheck.offline;

  if (!canUseLocalProgress) {
    return null;
  }

  return await getCachedProgress(
    userId,
    lessonId
  );

}


/**
 * ============================================================
 * RÉCUPÉRER TOUTE LA PROGRESSION D'UN UTILISATEUR
 * ============================================================
 */
export async function getUserProgress(
  userId
) {

  /*
   * Vérification du reset avant toute lecture globale.
   */
  const resetCheck =
    await checkProgressResetBeforeRead(
      userId
    );

  const canUseLocalProgress =
    resetCheck.success ||
    resetCheck.offline;

  if (!canUseLocalProgress) {
    return [];
  }

  return await db.userProgress
    .where("user_id")
    .equals(userId)
    .toArray();

}