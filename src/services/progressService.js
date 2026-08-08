// src/services/progressService.js

import { supabase } from "../lib/supabase";

import {
  db,
  saveProgress,
  getCachedProgress,
  addToSyncQueue,
  markProgressSynced
} from "../offline/db";


// =====================================
// SAUVEGARDE PROGRESSION
// =====================================

export async function saveLessonProgress({

  userId,

  lessonId,

  score

}) {

  if (!userId || !lessonId)
    return null;


  const completed =
    Number(score) >= 80;


  const completedAt =
    completed
      ? new Date().toISOString()
      : null;


  /*
    ------------------------------------
    1. SAUVEGARDE LOCALE
    ------------------------------------
  */

  await saveProgress({

    user_id:
      userId,

    lesson_id:
      lessonId,

    score:
      Number(score) || 0,

    completed,

    completed_at:
      completedAt

  });


  /*
    Récupérer l'enregistrement local
    afin d'obtenir son id Dexie.
  */

  const localProgress =
    await getCachedProgress(
      userId,
      lessonId
    );


  if (!localProgress) {

    throw new Error(
      "Impossible de retrouver la progression locale."
    );

  }


  /*
    ------------------------------------
    DONNÉES SUPABASE
    ------------------------------------
  */

  const remotePayload = {

    user_id:
      userId,

    lesson_id:
      lessonId,

    completed,

    score:
      Number(score) || 0,

    completed_at:
      completedAt

  };


  /*
    ------------------------------------
    2. TENTATIVE ONLINE
    ------------------------------------
  */

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine
  ) {

    try {

      const {
        data,
        error
      } = await supabase

        .from("user_progress")

        .upsert(

          remotePayload,

          {
            onConflict:
              "user_id,lesson_id"
          }

        );


      if (error)
        throw error;


      await markProgressSynced(
        localProgress.id
      );


      /*
        Si la synchronisation a réussi,
        supprimer l'éventuelle ancienne
        opération de queue.
      */

      console.log(
        "☁️ Progression synchronisée :",
        {
          userId,
          lessonId,
          score
        }
      );


      return data;

    }

    catch (error) {

      console.error(
        "⚠️ Progression non synchronisée, mise en attente :",
        error
      );

    }

  }


  /*
    ------------------------------------
    3. QUEUE OFFLINE
    ------------------------------------
  */

  await addToSyncQueue({

    table_name:
      "user_progress",

    record_id:
      localProgress.id,

    action:
      "upsert",

    local_record_id:
      localProgress.id,

    payload:
      remotePayload

  });


  console.log(
    "💾 Progression sauvegardée localement :",
    {
      userId,
      lessonId,
      score
    }
  );


  return {

    local: true,

    data: localProgress

  };

}


// =====================================
// RÉCUPÉRER PROGRESSION
// =====================================

export async function getLessonProgress(
  userId,
  lessonId
) {

  return await getCachedProgress(
    userId,
    lessonId
  );

}


// =====================================
// RÉCUPÉRER TOUTE LA PROGRESSION
// =====================================

export async function getUserProgress(
  userId
) {

  return await db.userProgress

    .where("user_id")
    .equals(userId)

    .toArray();

}