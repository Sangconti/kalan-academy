// src/services/educationService.js

import { supabase } from "../lib/supabase";


import {

cacheClasses,
getCachedClasses,

cacheSubjects,
getCachedSubjects,

cacheChapters,
getCachedChapters,

cacheLessons,
getCachedLessons,

cacheLesson,
getCachedLesson,

cacheChapter,
getCachedChapter,

cacheLessonBlocks,
getCachedLessonBlocks,

cacheQuizzes,
getCachedQuizzes,

cacheQuizQuestions,
getCachedQuizQuestions

} from "../offline/db";


// Vérification réseau

function isOnline() {

  return navigator.onLine;

}




// =====================================
// CLASSES
// =====================================

export async function getClasses() {


  if (!isOnline()) {

    return await getCachedClasses();

  }



  const {
    data,
    error
  } = await supabase

    .from("classes")

    .select("*")

    .order(
      "order_number",
      {
        ascending:true
      }
    );



  if(error){

    console.error(error);

    return await getCachedClasses();

  }



  await cacheClasses(data || []);


  return data || [];

}







// =====================================
// SUBJECTS
// =====================================

export async function getSubjects(classId) {


  if(!isOnline()){

    return await getCachedSubjects(classId);

  }



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
        ascending:true
      }
    );



  if(error){

    return await getCachedSubjects(classId);

  }



  await cacheSubjects(data || []);



  return data || [];

}








// =====================================
// CHAPTERS
// =====================================

export async function getChapters(subjectId) {


  if(!isOnline()){

    return await getCachedChapters(subjectId);

  }



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
        ascending:true
      }
    );



  if(error){

    return await getCachedChapters(subjectId);

  }



  await cacheChapters(data || []);



  return data || [];

}

export async function getChapter(chapterId) {


  if(!isOnline()){

    return await getCachedChapter(chapterId);

  }


  const {
    data,
    error
  } = await supabase

    .from("chapters")

    .select(`
      id,
      title,
      description,
      order_number,
      subject_id
    `)

    .eq(
      "id",
      chapterId
    )

    .single();



  if(error){

    console.error(
      "Erreur getChapter :",
      error
    );


    return await getCachedChapter(chapterId);

  }



  await cacheChapter(data);



  return data;


}





// =====================================
// LESSONS
// =====================================

export async function getLessons(chapterId) {


  if(!isOnline()){

    return await getCachedLessons(chapterId);

  }



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
        ascending:true
      }
    );



  if(error){

    return await getCachedLessons(chapterId);

  }



  await cacheLessons(data || []);



  return data || [];

}








// =====================================
// UNE LEÇON
// =====================================

export async function getLesson(lessonId) {


  if(!isOnline()){

    return await getCachedLesson(lessonId);

  }



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

    .single();



  if(error){

    return await getCachedLesson(lessonId);

  }



  await cacheLesson(data);



  return data;

}








// =====================================
// BLOCS DE LEÇON
// =====================================

export async function getLessonBlocks(lessonId) {

  if (!isOnline()) {

    return await getCachedLessonBlocks(lessonId);

  }


  const {
    data,
    error
  } = await supabase

    .from("lesson_blocks")

    .select("*")

    .eq("lesson_id", lessonId)

    .order(
      "order_number",
      {
        ascending: true
      }
    );


  if(error){

    console.error(
      "Erreur récupération lesson_blocks :",
      error
    );


    return await getCachedLessonBlocks(lessonId);

  }



  await cacheLessonBlocks(data || []);


  return data || [];

}






// =====================================
// EXERCICES
// =====================================

export async function getExercises(lessonId) {


  if (!isOnline()) {

    return await getCachedExercises(lessonId);

  }



  const {
    data,
    error
  } = await supabase

    .from("exercises")

    .select(`
      id,
      lesson_id,
      level,
      question,
      answer,
      explanation,
      points,
      order_number,
      created_at
    `)

    .eq(
      "lesson_id",
      lessonId
    )

    .order(
      "order_number",
      {
        ascending:true
      }
    );



  if(error){

    console.error(
      "Erreur récupération exercises :",
      error
    );


    return await getCachedExercises(lessonId);

  }



  await cacheExercises(data || []);


  return data || [];

}





// =====================================
// QUIZZ
// =====================================

export async function getQuizzes(lessonId) {


  if(!isOnline()){

    return await getCachedQuizzes(lessonId);

  }



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



  if(error){

    return await getCachedQuizzes(lessonId);

  }



  await cacheQuizzes(data || []);



  return data || [];

}








 // =====================================
 // QUESTIONS QUIZ
 // =====================================

 export async function getQuizQuestions(quizId) {


   if(!isOnline()){

     return await getCachedQuizQuestions(quizId);

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
       "order_number",
       {
         ascending:true
       }
     );



   if(error){

     console.error(
       "Erreur récupération quiz_questions :",
       error
     );

     return await getCachedQuizQuestions(quizId);

   }



   await cacheQuizQuestions(data || []);



   return data || [];

 }





 // =====================================
 // QUIZ COMPLET PAR LEÇON
 // =====================================

 export async function getQuizByLesson(lessonId) {

   console.log("Recherche quiz :", lessonId);

   // 1. Récupérer le quiz

   const {

     data: quizzes,
     error: quizError

   } = await supabase

     .from("quizzes")

     .select(`
       id,
       lesson_id,
       title,
       passing_score,
       time_limit_seconds
     `)

     .eq("lesson_id", lessonId)

     .limit(1);



   if (quizError) {

     console.error("Erreur quiz :", quizError);

     return null;

   }



   if (!quizzes || quizzes.length === 0) {

     console.log("Aucun quiz trouvé");

     return null;

   }



   const quiz = quizzes[0];



   // 2. Récupérer les questions

   const {

     data: questions,
     error: questionsError

   } = await supabase

     .from("quiz_questions")

     .select("*")

     .eq("quiz_id", quiz.id)

     .order("order_number");



   if (questionsError) {

     console.error(

       "Erreur questions :",

       questionsError

     );

     return null;

   }



   return {

     ...quiz,

     quiz_questions: questions || []

   };

 }