import { supabase } from "../lib/supabase";


// =====================================
// CLASSES
// =====================================

export async function getAdminClasses(){

  const {data,error}=await supabase
    .from("classes")
    .select("*")
    .order("order_number");

  if(error) throw error;

  return data || [];

}



export async function createClass(classData){

  const {data,error}=await supabase
    .from("classes")
    .insert(classData)
    .select()
    .single();

  if(error) throw error;

  return data;

}



export async function updateClass(id,updates){

  const {data,error}=await supabase
    .from("classes")
    .update(updates)
    .eq("id",id)
    .select()
    .single();

  if(error) throw error;

  return data;

}



export async function deleteClass(id){

  const {error}=await supabase
    .from("classes")
    .delete()
    .eq("id",id);

  if(error) throw error;

  return true;

}



// =====================================
// SUBJECTS
// =====================================


export async function getAllSubjects(){

  const {data,error}=await supabase
    .from("subjects")
    .select("*")
    .order("order_number");

  if(error) throw error;

  return data || [];

}




export async function getSubjectsByClass(classId){

  const {data,error}=await supabase
    .from("subjects")
    .select("*")
    .eq("class_id",classId)
    .order("order_number");


  if(error) throw error;

  return data || [];

}




export async function createSubject(subject){

  const {data,error}=await supabase
    .from("subjects")
    .insert(subject)
    .select()
    .single();


  if(error) throw error;

  return data;

}




export async function updateSubject(id,updates){

 const {data,error}=await supabase
    .from("subjects")
    .update(updates)
    .eq("id",id)
    .select()
    .single();


 if(error) throw error;

 return data;

}




export async function deleteSubject(id){

 const {error}=await supabase
    .from("subjects")
    .delete()
    .eq("id",id);


 if(error) throw error;

 return true;

}



 // recherche chapitre existant

export async function getChapters(subjectId){

 const {data,error}=await supabase
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


 if(error) throw error;

 return data || [];

}




export async function createChapter(chapter){

 const {data,error}=await supabase
    .from("chapters")
    .insert(chapter)
    .select()
    .single();


 if(error) throw error;

 return data;

}




export async function updateChapter(id,updates){

 const {data,error}=await supabase
    .from("chapters")
    .update(updates)
    .eq("id",id)
    .select()
    .single();


 if(error) throw error;

 return data;

}




// =====================================
// DELETE CHAPTER CASCADE V2
// =====================================

export async function deleteChapter(id){


  // 1) Récupérer toutes les leçons du chapitre

  const {data:lessons,error:lessonFetchError}=await supabase

    .from("lessons")

    .select("id")

    .eq(
      "chapter_id",
      id
    );



  if(lessonFetchError)
    throw lessonFetchError;



  // 2) Supprimer chaque leçon proprement

  if(lessons?.length){


    for(const lesson of lessons){


      await deleteLesson(
        lesson.id
      );


    }


  }



  // 3) Supprimer le chapitre

  const {error:chapterError}=await supabase

    .from("chapters")

    .delete()

    .eq(
      "id",
      id
    );



  if(chapterError)
    throw chapterError;



  return true;


}


// =====================================
// LESSONS
// =====================================


export async function getLessons(chapterId){

 const {data,error}=await supabase
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


 if(error) throw error;

 return data || [];

}





export async function createLesson(lesson){


 const {data,error}=await supabase
    .from("lessons")
    .insert({

      chapter_id:lesson.chapter_id,

      title:lesson.title,

      description:
        lesson.description ?? null,

      duration_minutes:
        lesson.duration_minutes ?? 10,


      difficulty:
        lesson.difficulty ?? "easy",


      video_url:
        lesson.video_url ?? null,


      thumbnail_url:
        lesson.thumbnail_url ?? null,


      is_premium:
        lesson.is_premium ?? false,


      order_number:
        lesson.order_number ?? 1

    })
    .select()
    .single();



 if(error) throw error;


 return data;


}




export async function updateLesson(id,lesson){


 const {data,error}=await supabase
    .from("lessons")
    .update({

      title:lesson.title,

      description:
        lesson.description ?? null,

      duration_minutes:
        lesson.duration_minutes,

      difficulty:
        lesson.difficulty,

      video_url:
        lesson.video_url ?? null,

      thumbnail_url:
        lesson.thumbnail_url ?? null,

      is_premium:
        lesson.is_premium ?? false,

      order_number:
        lesson.order_number

    })
    .eq("id",id)
    .select()
    .single();



 if(error) throw error;


 return data;


}





export async function deleteLesson(id){


 // supprimer blocks

 await supabase
 .from("lesson_blocks")
 .delete()
 .eq(
   "lesson_id",
   id
 );



 // récupérer quizzes

 const {data:quizzes}=await supabase
 .from("quizzes")
 .select("id")
 .eq(
   "lesson_id",
   id
 );



 if(quizzes?.length){


   await supabase
   .from("quiz_questions")
   .delete()
   .in(
     "quiz_id",
     quizzes.map(q=>q.id)
   );


   await supabase
   .from("quizzes")
   .delete()
   .eq(
     "lesson_id",
     id
   );

 }



 const {error}=await supabase
 .from("lessons")
 .delete()
 .eq(
   "id",
   id
 );


 if(error) throw error;


 return true;

}


// =====================================
// IMPORT PACK JSON ADMIN
// =====================================

export async function importAdminLessonPack(jsonData) {

// Import JSON reçu

  let result = {

   created:{
       chapters:0,
       lessons:0,
       blocks:0,
       quizzes:0,
       questions:0
     },

     skipped:{
       chapters:0,
       lessons:0,
       blocks:0,
       quizzes:0,
       questions:0
   }

  };


  let chapter = null;
  let subject = null;


    // ==============================
    // RECHERCHE DU SUJET
    // ==============================

   const {data:classData,error:classError}=await supabase
   .from("classes")
   .select("id")
   .eq("name",jsonData.class)
   .maybeSingle();


   if(classError)
     throw classError;


   if(!classData){
     throw new Error(
       "Classe introuvable : " + jsonData.class
     );
   }



   const {data:existingSubject,error:subjectError}=await supabase
   .from("subjects")
   .select("*")
   .eq("name",jsonData.subject)
   .eq("class_id",classData.id)
   .maybeSingle();


   if(subjectError)
     throw subjectError;


   if(!existingSubject){
     throw new Error(
       "Matière introuvable : " + jsonData.subject
     );
   }


   subject = existingSubject;


   // =====================================
   // CHAPITRE
   // =====================================


   const {data:existingChapter,error:chapterError}=await supabase
   .from("chapters")
   .select("*")
   .eq("subject_id",subject.id)
   .eq("title",jsonData.chapter)
   .maybeSingle();



   if(chapterError)
     throw chapterError;



   if(existingChapter){

     chapter = existingChapter;

   }
   else{


     const {data:newChapter,error:createChapterError}=await supabase
     .from("chapters")
     .insert({

       subject_id:subject.id,

       title:
         jsonData.chapter,

       description:
         "Chapitre importé depuis JSON Mali",

       order_number:
         jsonData.chapter_order ?? 1

     })
     .select()
     .single();



     if(createChapterError)
       throw createChapterError;



     chapter = newChapter;

    result.created.chapters++

   }


  // =====================================
  // LESSONS V2 IMPORT
  // =====================================


  for(const lesson of jsonData.lessons ?? []){


    let newLesson = null;



    // ==============================
    // RECHERCHE LEÇON EXISTANTE
    // ==============================


    const {data:oldLesson,error:findLessonError}=await supabase

    .from("lessons")

    .select("*")

    .eq(
      "chapter_id",
      chapter.id
    )

    .eq(
      "title",
      lesson.title
    )

    .maybeSingle();



    if(findLessonError)
      throw findLessonError;



    // ==============================
    // SI LEÇON EXISTE
    // ==============================


    if(oldLesson){


      // Leçon existante ignorée

      result.skipped.lessons++;

      newLesson = oldLesson;


    }



    // ==============================
    // SINON CREATION LEÇON
    // ==============================


    else{


      const {data:createdLesson,error:lessonError}=

      await supabase

      .from("lessons")

      .insert({

        chapter_id:chapter.id,


        title:
          lesson.title,


        description:
          lesson.description ?? "",


        duration_minutes:
          lesson.duration_minutes ?? 10,


        difficulty:
          lesson.difficulty ?? "easy",


        video_url:
          lesson.video_url ?? null,


        thumbnail_url:
          lesson.thumbnail_url ?? null,


        is_premium:
          lesson.is_premium ?? false,


        order_number:
          lesson.order_number ?? 1


      })


      .select()

      .single();



      if(lessonError)
        throw lessonError;



      newLesson = createdLesson;


      result.created.lessons++


    }





    // =====================================
    // BLOCKS
    // =====================================


    for(const block of lesson.blocks ?? lesson.lesson_blocks ?? []){


     const {data:existingBlock}=await supabase

     .from("lesson_blocks")

     .select("id")

     .eq(
       "lesson_id",
       newLesson.id
     )

     .eq(
       "title",
       block.title
     )

     .maybeSingle();



     if(existingBlock){

       result.skipped.blocks++;

       continue;

     }



     const {error:blockError}=

     await supabase
     .from("lesson_blocks")
     .insert({


        lesson_id:
          newLesson.id,


        block_type:
          block.type ?? "text",


        title:
          block.title ?? null,


        content:

          typeof block.content === "object"

          ? block.content.text

          : block.content,


        order_number:
          block.order_number ?? 1


      });



      if(blockError)
        throw blockError;



      result.created.blocks++;


    }






    // =====================================
    // QUIZ V2
    // =====================================

    if(lesson.quiz){


      const {data:existingQuiz,error:quizFindError}=await supabase

      .from("quizzes")

      .select("*")

      .eq(
        "lesson_id",
        newLesson.id
      )

      .maybeSingle();



      if(quizFindError)
        throw quizFindError;



      let quiz;



      if(existingQuiz){


        // Quiz existant ignoré

        quiz = existingQuiz;


        result.skipped.quizzes++;


      }


      else{


        const {data:newQuiz,error:quizError}=await supabase

        .from("quizzes")

        .insert({

          lesson_id:newLesson.id,

          title:
            lesson.quiz.title ?? "Quiz"

        })

        .select()

        .single();



        if(quizError)
          throw quizError;



        quiz = newQuiz;


        result.created.quizzes++;


      }



      // QUESTIONS

      let questionOrder = 1;


      for(const question of lesson.quiz.questions ?? []){


        const {data:existingQuestion}=await supabase

        .from("quiz_questions")

        .select("id")

        .eq(
          "quiz_id",
          quiz.id
        )

        .eq(
          "question",
          question.question
        )

        .maybeSingle();



        if(existingQuestion){


          result.skipped.questions++;


          questionOrder++;

          continue;


        }




        const {error:questionError}=await supabase

        .from("quiz_questions")

        .insert({

          quiz_id:
            quiz.id,


          question:
            question.question,


          choices:
            question.options
            ?? question.choices
            ?? [],


          correct_index:
            Number(question.correct_index ?? 0),


          explanation:
            question.explanation ?? null,


          order_number:
            questionOrder


        });



        if(questionError)
          throw questionError;



        result.created.questions++;


        questionOrder++;


      }


    }



  }

// Résultat import retourné

  return result;


}
