import { supabase } from "../lib/supabase";

import {
  db,
  saveProgress,
  getCachedProgress,
  addToSyncQueue,
  markProgressSynced
} from "../offline/db";

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
 *    Exemple :
 *      85 → 50 → 70 → 95
 *
 *    Résultat final :
 *      score     = 95
 *      completed = true
 *
 * 4. Ces règles doivent fonctionner :
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


  const currentScore = Math.max(
    0,
    Number(score) || 0
  );


  /*
   * ==========================================================
   * ÉTAT LOCAL EXISTANT
   * ==========================================================
   *
   * La progression locale peut déjà contenir :
   *
   *   completed = true
   *   score     = 85
   *
   * Une nouvelle tentative à 50 % ne doit donc jamais produire :
   *
   *   completed = false
   *   score     = 50
   */

  const localProgress =
    await getCachedProgress(
      userId,
      lessonId
    );


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
   *
   * Lorsque nous sommes en ligne, on vérifie également Supabase.
   *
   * Cela protège le cas où :
   *
   * - le cache local a été perdu ;
   * - l'application a été réinstallée ;
   * - la progression distante est meilleure que la progression
   *   locale ;
   * - une ancienne donnée locale risquerait d'écraser une
   *   progression déjà terminée.
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

      /*
       * Une erreur lors de la lecture distante ne doit pas
       * empêcher la progression locale.
       *
       * La sauvegarde locale continuera et la synchronisation
       * pourra être effectuée plus tard.
       */

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
   *
   * On prend toujours le maximum entre :
   *
   *   - la nouvelle tentative ;
   *   - le meilleur score local ;
   *   - le meilleur score distant.
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
   *
   * Une seule condition suffit pour conserver "terminée" :
   *
   *   - ancienne progression locale terminée ;
   *   - ancienne progression distante terminée ;
   *   - meilleur score >= 80.
   *
   * Ainsi :
   *
   *   85 % → true
   *   50 % → reste true
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
   *
   * Si la leçon était déjà terminée, on conserve sa date.
   *
   * Sinon, si elle vient de passer à 80 % ou plus, on crée
   * maintenant la date de terminaison.
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
   *
   * saveProgress() retourne déjà l'identifiant local du
   * record sauvegardé.
   *
   * Nous le conservons directement afin d'éviter une seconde
   * lecture Dexie juste après la sauvegarde.
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


      /*
       * Le record local est déjà connu grâce au résultat
       * de saveProgress().
       *
       * Aucun nouveau getCachedProgress() n'est nécessaire.
       */

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

      /*
       * La connexion peut avoir disparu entre la lecture
       * et l'écriture.
       *
       * Dans ce cas, la progression locale reste la source
       * de vérité temporaire et sera synchronisée plus tard.
       */

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
   *
   * IMPORTANT :
   *
   * On met dans la queue la progression FINALE calculée
   * ci-dessus, et non le score inférieur de la dernière
   * tentative.
   *
   * Exemple :
   *
   *   ancienne meilleure note = 85
   *   nouvelle tentative      = 50
   *
   * La queue recevra :
   *
   *   score     = 85
   *   completed = true
   *
   * et jamais :
   *
   *   score     = 50
   *   completed = false
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

  return await db.userProgress
    .where("user_id")
    .equals(userId)
    .toArray();

}