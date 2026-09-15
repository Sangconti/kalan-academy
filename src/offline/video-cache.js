// src/offline/video-cache.js

import {
  db,
  updateLessonVideoPath,
  removeLessonLocal
} from "./db.js";


// Taille maximale des vidéos offline (MB)
const MAX_STORAGE_MB = 500;



// =====================================
// CALCUL STOCKAGE VIDÉOS
// =====================================

async function getDownloadedVideoStorage() {

  const videos =
    await db.downloads.toArray();


  let total = 0;


  for (const video of videos) {

    total += Number(video?.size_mb) || 0;

  }


  return Number(
    total.toFixed(2)
  );

}



// =====================================
// VERIFICATION ESPACE
// =====================================

async function checkStorage() {

  const used =
    await getDownloadedVideoStorage();


  if (used >= MAX_STORAGE_MB) {

    throw new Error(
      "Stockage offline plein. Supprimez des vidéos téléchargées."
    );

  }

}



// =====================================
// TELECHARGER VIDEO
// =====================================

export async function cacheVideo(
  lessonId,
  videoUrl
) {

  try {

    await checkStorage();


    const response =
      await fetch(videoUrl);


    if (!response.ok) {

      throw new Error(
        "Impossible de télécharger la vidéo"
      );

    }


    const blob =
      await response.blob();


    const videoPath =
      `video_${lessonId}`;


    // =================================
    // STOCKAGE INDEXEDDB
    // =================================

    await db.downloads.put({

      lesson_id: lessonId,

      video_path: videoPath,

      blob: blob,

      size_mb:
        Number(
          (
            blob.size /
            1024 /
            1024
          ).toFixed(2)
        ),

      downloaded_at:
        new Date().toISOString()

    });


    await updateLessonVideoPath(
      lessonId,
      videoPath
    );


    return {

      success: true,

      path: videoPath

    };


  } catch (error) {

    console.error(
      "Erreur cache vidéo:",
      error
    );


    return {

      success: false,

      error: error.message

    };

  }

}



// =====================================
// LIRE VIDEO OFFLINE
// =====================================

export async function getCachedVideo(
  lessonId
) {

  const download =
    await db.downloads
      .where("lesson_id")
      .equals(lessonId)
      .first();


  if (
    !download ||
    !download.blob
  ) {

    return null;

  }


  return URL.createObjectURL(
    download.blob
  );

}



// =====================================
// SUPPRIMER VIDEO
// =====================================

export async function deleteCachedVideo(
  lessonId
) {

  await removeLessonLocal(
    lessonId
  );

}



// =====================================
// LISTE VIDEOS TELECHARGEES
// =====================================

export async function getCachedVideos() {

  return await db.downloads.toArray();

}



// =====================================
// TAILLE UTILISEE
// =====================================

export async function getVideoStorage() {

  return await getDownloadedVideoStorage();

}