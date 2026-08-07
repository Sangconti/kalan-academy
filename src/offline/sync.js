// src/offline/sync.js

import { supabase } from "../lib/supabase";

import {
  getSyncQueue,
  removeFromSyncQueue,
  getUnsyncedProgress,
  markProgressSynced
} from "./db";



// ======================================
// Synchronisation générale de la queue
// ======================================

export async function syncPendingData() {

  try {


    const queue = await getSyncQueue();



    for (const item of queue) {


      const {
        table_name,
        action,
        payload
      } = item;



      let error = null;



      if (action === "insert") {


        ({
          error
        } = await supabase
          .from(table_name)
          .insert(payload));


      }



      else if (action === "update") {


        ({
          error
        } = await supabase
          .from(table_name)
          .update(payload)
          .eq(
            "id",
            payload.id
          ));


      }



      else if (action === "delete") {


        ({
          error
        } = await supabase
          .from(table_name)
          .delete()
          .eq(
            "id",
            payload.id
          ));


      }



      if (!error) {


        await removeFromSyncQueue(
          item.id
        );


      }


      else {


        console.error(
          "Erreur synchronisation",
          table_name,
          error.message
        );


      }


    }




    await syncUserProgress();



    console.log(
      "✅ Synchronisation Kalan Academy terminée"
    );



  } catch (err) {


    console.error(
      "Erreur sync offline :",
      err.message
    );


  }

}





// ======================================
// Synchronisation progression utilisateur
// ======================================

async function syncUserProgress() {


  const progressList =
    await getUnsyncedProgress();



  for (const progress of progressList) {


    const {

      user_id,

      lesson_id,

      video_position,

      score,

      completed_at


    } = progress;



    const {
      error
    } = await supabase
      .from("user_progress")
      .upsert({

        user_id,

        lesson_id,

        video_position,

        score,

        completed_at

      });



    if (!error) {


      await markProgressSynced(
        progress.id
      );


    }


    else {


      console.error(
        "Erreur progression:",
        error.message
      );


    }


  }


}





// ======================================
// Télécharger le contenu pédagogique
// pour mode offline
// ======================================

export async function downloadLessonContent(
  lessonId
) {


  try {


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




    const {
      data: blocks
    } = await supabase

      .from("lesson_blocks")

      .select("*")

      .eq(
        "lesson_id",
        lessonId
      );





    const {
      data: exercises
    } = await supabase

      .from("exercises")

      .select("*")

      .eq(
        "lesson_id",
        lessonId
      );





    const {
      data: quizzes
    } = await supabase

      .from("quizzes")

      .select("*")

      .eq(
        "lesson_id",
        lessonId
      );





    return {

      lesson,

      blocks: blocks || [],

      exercises: exercises || [],

      quizzes: quizzes || []

    };



  } catch (err) {


    console.error(
      "Erreur téléchargement leçon:",
      err.message
    );


    return null;


  }


}






// ======================================
// Synchronisation automatique au retour
// internet
// ======================================

export function enableAutoSync() {


  window.addEventListener(
    "online",
    async () => {


      console.log(
        "Connexion rétablie..."
      );


      await syncPendingData();


    }
  );


}