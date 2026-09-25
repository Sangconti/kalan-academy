// src/services/educationService.js

import { supabase } from "../lib/supabase";

import {
  db,

  cacheClasses,
  cacheSubjects,
  cacheChapters,
  cacheLessons,
  cacheLessonBlocks,
  cacheExercises,
  cacheQuizzes,
  cacheQuizQuestions,
  cacheBadges,

  getCachedClasses,
  getCachedSubjects,
  getCachedChapters,
  getCachedLessons,
  getCachedLesson,
  getCachedLessonBlocks,
  getCachedExercises,
  getCachedQuizzes,
  getCachedQuizQuestions,
  getCachedBadges
} from "../offline/db";


// ======================================================
// NETWORK
// ======================================================

let networkStatus = null;

let networkCheckedAt = 0;

const NETWORK_CACHE_DURATION = 5000;

const NETWORK_TIMEOUT = 1500;


// ------------------------------------------------------
// Vérifie réellement si Supabase est accessible
// ------------------------------------------------------
//
// IMPORTANT
//
// On n'utilise plus :
//
//     HEAD /rest/v1/
//
// car cette requête directe n'envoie pas correctement
// le contexte du client Supabase et provoquait :
//
//     401 Unauthorized
//
// À la place, on utilise le client Supabase déjà
// configuré dans src/lib/supabase.js.
//
// Une petite requête sur "classes" permet de vérifier
// que Supabase répond réellement.
//
// ------------------------------------------------------

async function checkSupabaseConnection() {

  const now = Date.now();


  // ----------------------------------------------------
  // Utiliser le résultat récent
  // ----------------------------------------------------

  if (
    networkStatus !== null &&
    now - networkCheckedAt <
      NETWORK_CACHE_DURATION
  ) {

    return networkStatus;

  }


  // ----------------------------------------------------
  // navigator.onLine = false
  // ----------------------------------------------------

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {

    networkStatus = false;

    networkCheckedAt = now;

    return false;

  }


  // ----------------------------------------------------
  // Vérification réelle Supabase
  // ----------------------------------------------------

  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      NETWORK_TIMEOUT
    );


  try {

    const {
      data,
      error
    } = await supabase
      .from("classes")
      .select("id")
      .limit(1);


    clearTimeout(timeout);


    // --------------------------------------------------
    // Une réponse Supabase signifie que le serveur
    // est joignable.
    //
    // Même une erreur Supabase avec un code HTTP
    // signifie que le serveur a répondu.
    // --------------------------------------------------

    if (error) {

      const status =
        Number(error?.status);


      if (
        Number.isFinite(status)
      ) {

        networkStatus = true;

        networkCheckedAt =
          Date.now();

        console.log(
          "🌐 Supabase accessible"
        );

        return true;

      }


      // ------------------------------------------------
      // Pas de statut HTTP :
      // probablement problème réseau / connexion.
      // ------------------------------------------------

      networkStatus = false;

      networkCheckedAt =
        Date.now();

      console.warn(
        "📴 Supabase inaccessible → mode offline",
        error?.message || error
      );

      return false;

    }


    // --------------------------------------------------
    // Supabase a répondu correctement
    // --------------------------------------------------

    networkStatus = true;

    networkCheckedAt =
      Date.now();

    console.log(
      "🌐 Supabase accessible"
    );


    return true;

  } catch (error) {

    clearTimeout(timeout);


    networkStatus = false;

    networkCheckedAt =
      Date.now();


    console.warn(
      "📴 Supabase inaccessible → mode offline",
      error?.message || error
    );


    return false;

  }

}


// ------------------------------------------------------
// Fonction utilisée par les services
// ------------------------------------------------------

async function isOnline() {

  return await checkSupabaseConnection();

}


// ------------------------------------------------------
// Réinitialisation lorsque la connexion change
// ------------------------------------------------------

if (
  typeof window !== "undefined"
) {

  window.addEventListener(
    "online",
    () => {

      networkStatus = null;

      networkCheckedAt = 0;

      console.log(
        "🌐 Réseau détecté → vérification Supabase réinitialisée"
      );

    }
  );


  window.addEventListener(
    "offline",
    () => {

      networkStatus = false;

      networkCheckedAt =
        Date.now();

      console.log(
        "📴 Appareil hors ligne"
      );

    }
  );

}

// ======================================================
// HELPERS
// ======================================================

function sortByOrder(a, b) {

  return (
    (Number(a?.order_number) || 0) -
    (Number(b?.order_number) || 0)
  );

}


function normalizeCode(value) {

  return String(value || "")
    .trim()
    .toLowerCase();

}


// ======================================================
// DÉDUPLICATION DES MATIÈRES
// ======================================================

/*
 * Déduplication logique des matières.
 *
 * Clé :
 *
 *     class_id + code
 *
 * Exemple :
 *
 * Mathématiques A → 0 chapitre
 * Mathématiques B → 24 chapitres
 *
 * On conserve B.
 *
 * Cette fonction ne supprime rien directement dans Dexie.
 */

async function deduplicateSubjects(subjects) {

  if (!Array.isArray(subjects)) {

    return [];

  }


  const groups =
    new Map();


  // ----------------------------------------------------
  // Regrouper
  // ----------------------------------------------------

  for (const subject of subjects) {

    if (!subject?.id) {

      continue;

    }


    const classId =
      String(
        subject.class_id || ""
      );


    const logicalCode =
      normalizeCode(
        subject.code ||
        subject.subject_code ||
        subject.name
      );


    const key =
      `${classId}::${logicalCode}`;


    if (!groups.has(key)) {

      groups.set(
        key,
        []
      );

    }


    groups
      .get(key)
      .push(subject);

  }


  const result = [];


  // ----------------------------------------------------
  // Choisir le meilleur candidat
  // ----------------------------------------------------

  for (
    const [
      key,
      group
    ]
    of groups.entries()
  ) {

    if (group.length === 1) {

      result.push(
        group[0]
      );

      continue;

    }


    const candidates = [];


    for (const subject of group) {

      let chapterCount = 0;


      try {

        chapterCount =
          await db.chapters
            .where("subject_id")
            .equals(subject.id)
            .count();

      } catch (error) {

        console.warn(
          "⚠️ Impossible de compter les chapitres de la matière :",
          subject.name,
          error
        );

      }


      candidates.push({

        subject,

        chapterCount

      });

    }


    // --------------------------------------------------
    // Priorités
    //
    // 1. plus de chapitres
    // 2. order_number
    // 3. ID stable
    // --------------------------------------------------

    candidates.sort(
      (a, b) => {

        if (
          b.chapterCount !==
          a.chapterCount
        ) {

          return (
            b.chapterCount -
            a.chapterCount
          );

        }


        const orderDifference =
          sortByOrder(
            a.subject,
            b.subject
          );


        if (
          orderDifference !== 0
        ) {

          return orderDifference;

        }


        return String(
          a.subject.id
        ).localeCompare(
          String(
            b.subject.id
          )
        );

      }
    );


    const winner =
      candidates[0];


    console.warn(
      "⚠️ DOUBLON MATIÈRE DÉTECTÉ",
      {
        key,

        winner:
          winner.subject.id,

        candidates:
          candidates.map(
            item => ({
              id:
                item.subject.id,

              name:
                item.subject.name,

              code:
                item.subject.code,

              chapters:
                item.chapterCount
            })
          )
      }
    );


    result.push(
      winner.subject
    );

  }


  result.sort(
    sortByOrder
  );


  return result;

}


// ======================================================
// CLASSES
// ======================================================

export async function getClasses() {

  try {

    if (await isOnline()) {

      try {

        const {
          data,
          error
        } = await supabase
          .from("classes")
          .select("*")
          .order(
            "order_number",
            {
              ascending: true
            }
          );


        if (error) {

          throw error;

        }


        await cacheClasses(
          data || []
        );


        return data || [];

      } catch (error) {

        console.warn(
          "⚠️ Erreur réseau classes → fallback Dexie",
          error
        );

      }

    }


    return await getCachedClasses();

  } catch (error) {

    console.error(
      "❌ getClasses:",
      error
    );


    return await getCachedClasses();

  }

}


// ======================================================
// SUBJECTS
// ======================================================

export async function getSubjects(
  classId
) {

  if (!classId) {

    return [];

  }


  try {

    let subjects = [];


    // ==================================================
    // ONLINE
    // ==================================================

    if (await isOnline()) {

      try {

        const {
          data,
          error
        } = await supabase
          .from("subjects")
          .select("*")
          .eq(
            "class_id",
            classId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );


        if (error) {

          throw error;

        }


        subjects =
          data || [];


        await cacheSubjects(
          subjects
        );

      } catch (error) {

        console.warn(
          "⚠️ Erreur réseau subjects → fallback Dexie",
          error
        );


        subjects =
          await getCachedSubjects(
            classId
          );

      }

    }

    // ==================================================
    // OFFLINE
    // ==================================================

    else {

      subjects =
        await getCachedSubjects(
          classId
        );

    }


    // ==================================================
    // FILTRE DE SÉCURITÉ
    // ==================================================

    subjects =
      (subjects || [])
        .filter(
          subject =>
            String(
              subject.class_id
            ) ===
            String(classId)
        );


    // ==================================================
    // DÉDUPLICATION
    // ==================================================

    subjects =
      await deduplicateSubjects(
        subjects
      );


    // ==================================================
    // TRI FINAL
    // ==================================================

    subjects.sort(
      sortByOrder
    );


    console.log(
      "📚 SUBJECTS FINAUX :",
      subjects
    );


    return subjects;

  } catch (error) {

    console.error(
      "❌ getSubjects:",
      error
    );


    // --------------------------------------------------
    // Dernier fallback Dexie
    // --------------------------------------------------

    try {

      const cached =
        await getCachedSubjects(
          classId
        );


      const filtered =
        cached.filter(
          subject =>
            String(
              subject.class_id
            ) ===
            String(classId)
        );


      return await deduplicateSubjects(
        filtered
      );

    } catch (dexieError) {

      console.error(
        "❌ Impossible de récupérer les matières offline :",
        dexieError
      );


      return [];

    }

  }

}


// ======================================================
// CHAPTERS
// ======================================================

export async function getChapters(
  subjectId
) {

  if (!subjectId) {

    return [];

  }


  try {

    // ==================================================
    // 1. DEXIE PRIORITAIRE
    // ==================================================

    const cached =
      await getCachedChapters(
        subjectId
      );


    if (
      Array.isArray(cached) &&
      cached.length > 0
    ) {

      cached.sort(
        sortByOrder
      );


      console.log(
        "📦 CHAPTERS → DEXIE",
        cached.length
      );


      return cached;

    }


    // ==================================================
    // 2. SUPABASE SI CACHE VIDE
    // ==================================================

    if (
      !(await isOnline())
    ) {

      console.log(
        "📴 Chapters : offline et cache vide"
      );


      return [];

    }


    try {

      const {
        data,
        error
      } = await supabase
        .from("chapters")
        .select("*")
        .eq(
          "subject_id",
          subjectId
        )
        .order(
          "order_number",
          {
            ascending: true
          }
        );


      if (error) {

        throw error;

      }


      const chapters =
        data || [];


      await cacheChapters(
        chapters
      );


      chapters.sort(
        sortByOrder
      );


      return chapters;

    } catch (error) {

      console.warn(
        "⚠️ Chapters réseau indisponibles",
        error
      );


      return [];

    }

  } catch (error) {

    console.error(
      "❌ getChapters:",
      error
    );


    return [];

  }

}


// ======================================================
// SINGLE CHAPTER
// ======================================================

export async function getChapter(
  chapterId
) {

  if (!chapterId) {

    return null;

  }


  try {

    if (
      await isOnline()
    ) {

      try {

        const {
          data,
          error
        } = await supabase
          .from("chapters")
          .select("*")
          .eq(
            "id",
            chapterId
          )
          .maybeSingle();


        if (error) {

          throw error;

        }


        if (data) {

          await db.chapters.put({

            ...data,

            cached_at:
              new Date().toISOString()

          });


          return data;

        }

      } catch (error) {

        console.warn(
          "⚠️ getChapter réseau → Dexie",
          error
        );

      }

    }


    return await db.chapters.get(
      chapterId
    );

  } catch (error) {

    console.error(
      "❌ getChapter:",
      error
    );


    return null;

  }

}


// ======================================================
// LESSONS
// ======================================================

export async function getLessons(
  chapterId
) {

  if (!chapterId) {

    return [];

  }


  try {

    const cached =
      await getCachedLessons(
        chapterId
      );


    if (
      Array.isArray(cached) &&
      cached.length > 0
    ) {

      cached.sort(
        sortByOrder
      );


      console.log(
        "📦 LESSONS → DEXIE",
        cached.length
      );


      return cached;

    }


    if (
      !(await isOnline())
    ) {

      return [];

    }


    try {

      const {
        data,
        error
      } = await supabase
        .from("lessons")
        .select("*")
        .eq(
          "chapter_id",
          chapterId
        )
        .order(
          "order_number",
          {
            ascending: true
          }
        );


      if (error) {

        throw error;

      }


      const lessons =
        data || [];


      await cacheLessons(
        lessons
      );


      lessons.sort(
        sortByOrder
      );


      return lessons;

    } catch (error) {

      console.warn(
        "⚠️ Lessons réseau indisponibles",
        error
      );


      return [];

    }

  } catch (error) {

    console.error(
      "❌ getLessons:",
      error
    );


    return [];

  }

}


// ======================================================
// SINGLE LESSON
// ======================================================

export async function getLesson(
  lessonId
) {

  if (!lessonId) {

    return null;

  }


  try {

    if (
      await isOnline()
    ) {

      try {

        const {
          data,
          error
        } = await supabase
          .from("lessons")
          .select("*")
          .eq(
            "id",
            lessonId
          )
          .maybeSingle();


        if (error) {

          throw error;

        }


        if (data) {

          await cacheLessons([
            data
          ]);


          return data;

        }

      } catch (error) {

        console.warn(
          "⚠️ getLesson réseau → Dexie",
          error
        );

      }

    }


    return await getCachedLesson(
      lessonId
    );

  } catch (error) {

    console.error(
      "❌ getLesson:",
      error
    );


    return null;

  }

}


// ======================================================
// LESSON BLOCKS
// ======================================================

export async function getLessonBlocks(
  lessonId
) {

  if (!lessonId) {

    return [];

  }


  try {

    const cached =
      await getCachedLessonBlocks(
        lessonId
      );


    if (
      Array.isArray(cached) &&
      cached.length > 0
    ) {

      console.log(
        "📦 LESSON BLOCKS → DEXIE",
        cached.length
      );


      return cached;

    }


    if (
      !(await isOnline())
    ) {

      return [];

    }


    try {

      const {
        data,
        error
      } = await supabase
        .from("lesson_blocks")
        .select("*")
        .eq(
          "lesson_id",
          lessonId
        )
        .order(
          "order_number",
          {
            ascending: true
          }
        );


      if (error) {

        throw error;

      }


      const blocks =
        data || [];


      await cacheLessonBlocks(
        blocks
      );


      blocks.sort(
        sortByOrder
      );


      return blocks;

    } catch (error) {

      console.warn(
        "⚠️ Lesson blocks réseau indisponibles",
        error
      );


      return [];

    }

  } catch (error) {

    console.error(
      "❌ getLessonBlocks:",
      error
    );


    return [];

  }

}


// ======================================================
// EXERCISES
// ======================================================

export async function getExercises(
  lessonId
) {

  if (!lessonId) {

    return [];

  }


  try {

    let exercises = [];


    if (
      await isOnline()
    ) {

      try {

        const {
          data,
          error
        } = await supabase
          .from("exercises")
          .select("*")
          .eq(
            "lesson_id",
            lessonId
          )
          .order(
            "order_number",
            {
              ascending: true
            }
          );


        if (error) {

          throw error;

        }


        exercises =
          data || [];


        await cacheExercises(
          exercises
        );

      } catch (error) {

        console.warn(
          "⚠️ Erreur réseau exercises → Dexie",
          error
        );


        exercises =
          await getCachedExercises(
            lessonId
          );

      }

    } else {

      exercises =
        await getCachedExercises(
          lessonId
        );

    }


    exercises.sort(
      sortByOrder
    );


    return exercises;

  } catch (error) {

    console.error(
      "❌ getExercises:",
      error
    );


    return await getCachedExercises(
      lessonId
    );

  }

}


// ======================================================
// QUIZZES
// ======================================================

export async function getQuizzes(
  lessonId
) {

  if (!lessonId) {

    return [];

  }


  try {

    let quizzes = [];


    if (
      await isOnline()
    ) {

      try {

        const {
          data,
          error
        } = await supabase
          .from("quizzes")
          .select("*")
          .eq(
            "lesson_id",
            lessonId
          );


        if (error) {

          throw error;

        }


        quizzes =
          data || [];


        await cacheQuizzes(
          quizzes
        );

      } catch (error) {

        console.warn(
          "⚠️ Erreur réseau quizzes → Dexie",
          error
        );


        quizzes =
          await getCachedQuizzes(
            lessonId
          );

      }

    } else {

      quizzes =
        await getCachedQuizzes(
          lessonId
        );

    }


    return quizzes || [];

  } catch (error) {

    console.error(
      "❌ getQuizzes:",
      error
    );


    return await getCachedQuizzes(
      lessonId
    );

  }

}


// ======================================================
// QUIZ BY LESSON
// ======================================================

export async function getQuizByLesson(
  lessonId
) {

  if (!lessonId) {

    return null;

  }


  try {

    const cached =
      await getCachedQuizzes(
        lessonId
      );


    if (
      Array.isArray(cached) &&
      cached.length > 0
    ) {

      console.log(
        "📦 QUIZ → DEXIE"
      );


      return cached[0] || null;

    }


    if (
      !(await isOnline())
    ) {

      return null;

    }


    try {

      const {
        data,
        error
      } = await supabase
        .from("quizzes")
        .select("*")
        .eq(
          "lesson_id",
          lessonId
        )
        .maybeSingle();


      if (error) {

        throw error;

      }


      if (!data) {

        return null;

      }


      await cacheQuizzes([
        data
      ]);


      return data;

    } catch (error) {

      console.warn(
        "⚠️ Quiz réseau indisponible",
        error
      );


      return null;

    }

  } catch (error) {

    console.error(
      "❌ getQuizByLesson:",
      error
    );


    return null;

  }

}


// ======================================================
// QUIZ QUESTIONS
// ======================================================

export async function getQuizQuestions(
  quizId
) {

  if (!quizId) {

    return [];

  }


  try {

    const cached =
      await getCachedQuizQuestions(
        quizId
      );


    if (
      Array.isArray(cached) &&
      cached.length > 0
    ) {

      console.log(
        "📦 QUIZ QUESTIONS → DEXIE",
        cached.length
      );


      return cached;

    }


    if (
      !(await isOnline())
    ) {

      return [];

    }


    try {

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
          "order_number",
          {
            ascending: true
          }
        );


      if (error) {

        throw error;

      }


      const questions =
        data || [];


      await cacheQuizQuestions(
        questions
      );


      questions.sort(
        sortByOrder
      );


      return questions;

    } catch (error) {

      console.warn(
        "⚠️ Quiz questions réseau indisponibles",
        error
      );


      return [];

    }

  } catch (error) {

    console.error(
      "❌ getQuizQuestions:",
      error
    );


    return [];

  }

}


// ======================================================
// BADGES
// ======================================================

export async function getBadges() {

  try {

    if (
      await isOnline()
    ) {

      try {

        const {
          data,
          error
        } = await supabase
          .from("badges")
          .select("*");


        if (error) {

          throw error;

        }


        const badges =
          data || [];


        await cacheBadges(
          badges
        );


        return badges;

      } catch (error) {

        console.warn(
          "⚠️ Erreur réseau badges → Dexie",
          error
        );

      }

    }


    return await getCachedBadges();

  } catch (error) {

    console.error(
      "❌ getBadges:",
      error
    );


    return await getCachedBadges();

  }

}


// ======================================================
// DEBUG NETWORK
// ======================================================

export async function checkNetwork() {

  const result =
    await checkSupabaseConnection();


  console.log(
    "🌐 SUPABASE ACCESSIBLE :",
    result
  );


  return result;

}


// ======================================================
// EXPORTS DEBUG
// ======================================================

if (
  typeof window !== "undefined"
) {

  window.kalanEducation = {

    getClasses,

    getSubjects,

    getChapters,

    getChapter,

    getLessons,

    getLesson,

    getLessonBlocks,

    getExercises,

    getQuizzes,

    getQuizByLesson,

    getQuizQuestions,

    getBadges,

    checkNetwork

  };

}