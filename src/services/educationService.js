// src/services/educationService.js


import { supabase } from "../lib/supabase";


import {

  cacheClasses,
  getCachedClasses,

  cacheSubjects,
  getCachedSubjects,

  cacheChapters,
  getCachedChapters,

  cacheChapter,
  getCachedChapter,


  cacheLessons,
  getCachedLessons,

  cacheLesson,
  getCachedLesson,


  cacheLessonBlocks,
  getCachedLessonBlocks,


  cacheExercises,
  getCachedExercises,


  cacheQuizzes,
  getCachedQuizzes,


  cacheQuizQuestions,
  getCachedQuizQuestions


} from "../offline/db";




// ===============================
// NETWORK
// ===============================

function isOnline(){

 return navigator.onLine;

}




// ===============================
// CLASSES
// ===============================


export async function getClasses(){


 if(!isOnline()){

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






// ===============================
// SUBJECTS
// ===============================


export async function getSubjects(classId){

console.log(
"GET SUBJECTS CLASS ID",
classId
);

if(!classId){
 return [];
}


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

    console.error(
         "Erreur subjects :",
         error
       );

  return await getCachedSubjects(classId);

 }



 await cacheSubjects(data || []);



 return data || [];

}






// ===============================
// CHAPTERS
// ===============================


export async function getChapters(subjectId){

console.log(
  "🔎 GET CHAPTERS SUBJECT ID :",
  subjectId
);

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






// ===============================
// ONE CHAPTER
// ===============================


export async function getChapter(chapterId){


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

  subject_id,

  order_number

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







// ===============================
// LESSONS
// ===============================


export async function getLessons(chapterId){


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







// ===============================
// ONE LESSON
// ===============================


export async function getLesson(lessonId){


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






// ===============================
// LESSON BLOCKS
// ===============================


export async function getLessonBlocks(lessonId){


 if(!isOnline()){

  return await getCachedLessonBlocks(lessonId);

 }



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
   ascending:true
  }
 );



 if(error){

  return await getCachedLessonBlocks(lessonId);

 }



 await cacheLessonBlocks(data || []);



 return data || [];

}







// ===============================
// EXERCISES
// ===============================


export async function getExercises(lessonId){


 if(!isOnline()){

  return await getCachedExercises(lessonId);

 }



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
   ascending:true
  }
 );



 if(error){

  return await getCachedExercises(lessonId);

 }



 await cacheExercises(data || []);



 return data || [];

}







// ===============================
// QUIZZES
// ===============================


export async function getQuizzes(lessonId){


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







// ===============================
// QUIZ QUESTIONS
// ===============================


export async function getQuizQuestions(quizId){


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
  "order_number"
 );



 if(error){

  return await getCachedQuizQuestions(quizId);

 }



 await cacheQuizQuestions(data || []);



 return data || [];

}







// ===============================
// COMPLETE QUIZ
// ===============================


export async function getQuizByLesson(lessonId){


  // ==========================
  // MODE OFFLINE
  // ==========================

  if(!isOnline()){


    const quizzes =
      await getCachedQuizzes(lessonId);



    if(!quizzes || quizzes.length === 0){

      return null;

    }



    const quiz = quizzes[0];



    const questions =
      await getCachedQuizQuestions(
        quiz.id
      );



    return {

      ...quiz,

      quiz_questions:
        questions || []

    };


  }




  // ==========================
  // MODE ONLINE
  // ==========================


  const {

    data: quizzes,

    error

  } = await supabase

  .from("quizzes")

  .select("*")

  .eq(
    "lesson_id",
    lessonId
  )

  .limit(1);



  if(error || !quizzes?.length){


    return null;


  }



  const quiz = quizzes[0];



  const {

    data: questions

  } = await supabase

  .from("quiz_questions")

  .select("*")

  .eq(
    "quiz_id",
    quiz.id
  )

  .order(
    "order_number"
  );



  await cacheQuizzes([
    quiz
  ]);



  await cacheQuizQuestions(
    questions || []
  );



  return {


    ...quiz,


    quiz_questions:
      questions || []


  };


}