// src/offline/db.js

import Dexie from "dexie";


export const db = new Dexie("KalanAcademyDB");


db.version(3).stores({

  classes:
    "id, name, order_number, cached_at",

  subjects:
    "id, class_id, name, order_number, cached_at",

  chapters:
    "id, subject_id, title, description, order_number, cached_at",

  lessons:
    "id, chapter_id, subject_id, class_id, title, order_number, video_url, local_video_path, cached_at",

  lessonBlocks:
    "id, lesson_id, type, order_number, cached_at",

  quizzes:
    "id, lesson_id, cached_at",

  quizQuestions:
    "id, quiz_id, cached_at",

  badges:
    "id, name, description, icon, cached_at",

  userProgress:
    "++id, user_id, lesson_id, score, completed_at, synced",

  syncQueue:
    "++id, table_name, record_id, action, payload, created_at",

  downloads:
    "++id, lesson_id, video_path, size_mb, downloaded_at"

});


// ===============================
// STORAGE
// ===============================

export async function getStorageUsedMB(){

  let bytes = 0;

  const tables = [
    "classes",
    "subjects",
    "chapters",
    "lessons",
    "lessonBlocks",
    "exercises",
    "quizzes",
    "quizQuestions",
    "badges",
    "userProgress",
    "syncQueue"
  ];


  for(const table of tables){

    const data = await db[table].toArray();

    bytes += JSON.stringify(data).length;

  }


  return Number(
    (bytes / 1024 / 1024).toFixed(2)
  );

}



// ===============================
// CLASSES
// ===============================

export async function cacheClasses(list){

 await db.classes.bulkPut(
   list.map(x=>({
    ...x,
    cached_at:new Date().toISOString()
   }))
 );

}


export async function getCachedClasses(){

 return await db.classes.toArray();

}



// ===============================
// SUBJECTS
// ===============================

export async function cacheSubjects(list){

 await db.subjects.bulkPut(
  list.map(x=>({
    ...x,
    cached_at:new Date().toISOString()
  }))
 );

}


export async function getCachedSubjects(classId){

 return await db.subjects
 .where("class_id")
 .equals(classId)
 .toArray();

}



// ===============================
// CHAPTERS
// ===============================

export async function cacheChapters(list){

 await db.chapters.bulkPut(
  list.map(x=>({
    ...x,
    cached_at:new Date().toISOString()
  }))
 );

}



export async function getCachedChapter(id){

  return await db.chapters.get(id);

}


// ===============================
// LESSONS
// ===============================

export async function cacheLessons(list){

 await db.lessons.bulkPut(
  list.map(x=>({
    ...x,
    cached_at:new Date().toISOString()
  }))
 );

}

export async function cacheChapter(chapter) {

  if(!chapter) return;


 await db.chapters.put({
     ...chapter,
     cached_at: Date.now()
   });

}


export async function cacheLesson(lesson){

 await db.lessons.put({
  ...lesson,
  cached_at:new Date().toISOString()
 });

}



export async function getCachedLessons(chapterId){

 return await db.lessons
 .where("chapter_id")
 .equals(chapterId)
 .toArray();

}



export async function getCachedLesson(id){

 return await db.lessons.get(id);

}



export async function updateLessonVideoPath(id,path){

 await db.lessons.update(
  id,
  {
   local_video_path:path
  }
 );

}



export async function removeLessonLocal(id){

 await db.lessons.update(
  id,
  {
   local_video_path:null
  }
 );

 await db.downloads
 .where("lesson_id")
 .equals(id)
 .delete();

}



// ===============================
// LESSON BLOCKS
// ===============================

export async function cacheLessonBlocks(list){

 await db.lessonBlocks.bulkPut(
  list.map(x=>({
   ...x,
   cached_at:new Date().toISOString()
  }))
 );

}



export async function getCachedLessonBlocks(lessonId){

 return await db.lessonBlocks
 .where("lesson_id")
 .equals(lessonId)
 .toArray();

}



// ===============================
// EXERCISES
// ===============================

export async function cacheExercises(list){

 await db.exercises.bulkPut(
  list.map(x=>({
   ...x,
   cached_at:new Date().toISOString()
  }))
 );

}



export async function getCachedExercises(lessonId){

 return await db.exercises
 .where("lesson_id")
 .equals(lessonId)
 .toArray();

}



// ===============================
// QUIZZ
// ===============================


export async function cacheQuizzes(list){


 await db.quizzes.bulkPut(

  list.map(q => ({

   ...q,

   cached_at:
    new Date().toISOString()

  }))

 );


}





export async function getCachedQuizzes(lessonId){


 return await db.quizzes

 .where("lesson_id")

 .equals(lessonId)

 .toArray();


}





export async function getCachedQuizByLesson(lessonId){


 const quiz =

 await db.quizzes

 .where("lesson_id")

 .equals(lessonId)

 .first();



 if(!quiz){

  return null;

 }



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

// ===============================
// QUIZ QUESTIONS
// ===============================



export async function cacheQuizQuestions(list){


 await db.quizQuestions.bulkPut(


  list.map(q => ({


   ...q,


   cached_at:

    new Date().toISOString()


  }))


 );


}





export async function getCachedQuizQuestions(quizId){


 return await db.quizQuestions

 .where("quiz_id")

 .equals(quizId)

 .sortBy(
  "order_number"
 );


}


// ===============================
// BADGES
// ===============================

export async function cacheBadges(list){

 await db.badges.bulkPut(
  list.map(b=>({
   ...b,
   cached_at:new Date().toISOString()
  }))
 );

}


export async function getCachedBadges(){

 return await db.badges.toArray();

}



// ===============================
// PROGRESS
// ===============================

export async function saveProgress(progress){

 await db.userProgress.put({
  ...progress,
  synced:false
 });

}



export async function getUnsyncedProgress(){

 return await db.userProgress
 .where("synced")
 .equals(0)
 .toArray();

}



export async function markProgressSynced(id){

 await db.userProgress.update(
  id,
  {
   synced:true
  }
 );

}



// ===============================
// DOWNLOADS
// ===============================

export async function addDownload(
 lessonId,
 path,
 size
){

 await db.downloads.add({

  lesson_id:lessonId,
  video_path:path,
  size_mb:size,
  downloaded_at:new Date().toISOString()

 });


 await updateLessonVideoPath(
  lessonId,
  path
 );

}



export async function getDownloads(){

 return await db.downloads.toArray();

}


// ===============================
// SYNC QUEUE
// ===============================

export async function addToSyncQueue(item){

  await db.syncQueue.add({

    ...item,

    created_at:new Date().toISOString()

  });

}



export async function getSyncQueue(){

  return await db.syncQueue.toArray();

}



export async function removeFromSyncQueue(id){

  await db.syncQueue.delete(id);

}

// ===============================
// CLEAR
// ===============================

export async function clearAllCache(){

 await Promise.all(
  db.tables.map(
   table=>table.clear()
  )
 );

}