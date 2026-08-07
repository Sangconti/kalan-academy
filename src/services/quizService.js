// src/services/quizService.js

import { supabase } from "../lib/supabase";



// =====================================
// Correction QCM
// =====================================

export async function submitQuizAttempt(
 userId,
 quizId,
 answers
){


/*

answers :

[
 {
   question_id:"uuid",
   answer_index:0
 }
]

*/


const {
 data:questions,
 error
}
=
await supabase

.from("quiz_questions")

.select("*")

.eq(
 "quiz_id",
 quizId
);



if(error){

 console.error(
 "Erreur questions:",
 error
 );

 return null;

}




let correct = 0;



questions.forEach(question=>{


const userAnswer =
answers.find(
 a =>
 a.question_id === question.id
);



if(
 userAnswer &&
 userAnswer.answer_index === question.correct_index
){

correct++;

}


});




const total = questions.length;



const score =
Math.round(
(correct / total) * 100
);





// ================================
// Sauvegarde tentative
// ================================


const {
data:attempt,
error:attemptError
}
=
await supabase

.from("quiz_attempts")

.insert({

 user_id:userId,

 quiz_id:quizId,

 score:score

})

.select()

.single();



if(attemptError){

console.error(
"Erreur sauvegarde quiz:",
attemptError
);


}





// ================================
// XP
// ================================


let xp = 0;


if(score >= 80){

 xp = 100;

}
else if(score >=50){

 xp = 50;

}
else{

 xp = 20;

}





return {

attempt,

score,

correct,

total,

xp

};


}






// =====================================
// Validation chapitre
// =====================================


export async function validateChapterProgress(
 userId,
 lessonId,
 score
){


const completed =
score >=80;



const {
data,
error
}
=
await supabase

.from("user_progress")

.upsert({

 user_id:userId,

 lesson_id:lessonId,

 completed,

 completion_percentage:score,

 last_score:score,

 completed_at:
 completed
 ? new Date()
 : null

},

{

onConflict:
"user_id,lesson_id"

}

);



if(error){

console.error(
"Erreur progression:",
error
);

}



return data;


}





// =====================================
// Attribution badge
// =====================================


export async function giveBadge(
userId,
badgeName
){



const {
data:badge
}
=
await supabase

.from("badges")

.select("id")

.eq(
"name",
badgeName
)

.single();




if(!badge)
return;



await supabase

.from("user_badges")

.insert({

 user_id:userId,

 badge_id:badge.id

})

.onConflict(
"user_id,badge_id"
);



}