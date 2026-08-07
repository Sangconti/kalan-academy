// src/components/ExerciseQuiz.jsx

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { addXP } from "../services/xpService";
import { Trophy } from "lucide-react";
import { saveLessonProgress } from "../services/progressService";


export default function ExerciseQuiz({
  quizId,
  lessonId
}) {


const [answers,setAnswers]=useState({});

const [result,setResult]=useState(null);

const [questions,setQuestions]=useState([]);

const [loading,setLoading]=useState(true);





useEffect(()=>{

loadQuestions();

},[quizId]);





async function loadQuestions(){


const {data,error}=await supabase

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
"Erreur chargement questions",
error
);

return;

}



const formatted = (data || []).map(q=>({

...q,

choices:
q.choices || q.options || []

}));


console.log(
"QUESTIONS CHARGEES",
formatted
);



setQuestions(formatted);

setLoading(false);


}





function chooseAnswer(
questionIndex,
answerIndex
){


setAnswers(prev=>({

...prev,

[questionIndex]:answerIndex

}));

}




async function validateQuiz(){



const {

data:{user}

}=await supabase.auth.getUser();



if(!user)
return;



console.log(
"REPONSES UTILISATEUR",
answers
);


console.log(
"QUESTIONS",
questions
);



let correct=0;



questions.forEach(
(q,index)=>{


const userAnswer =
answers[index];


const goodAnswer =
q.correct_index;



if(
Number(userAnswer) === Number(goodAnswer)
){

correct++;

}


});





const score =
questions.length > 0
?
Math.round(
(correct/questions.length)*100
)
:
0;




let gainedXP=0;



if(score>=80){

gainedXP=300;

}
else if(score>=50){

gainedXP=100;

}




if(gainedXP>0){

await addXP(
user.id,
gainedXP
);

}





// sauvegarde tentative

const {error:attemptError}=await supabase

.from("quiz_attempts")

.insert({

user_id:user.id,

quiz_id:quizId,

score:score,

answers:answers,

attempt_number:1

});



if(attemptError){

console.error(
"Erreur quiz_attempts",
attemptError
);

}





// badge

if(score>=80){


const {

data:badge

}=await supabase

.from("badges")

.select("id")

.eq(
"name",
"Élève brillant"
)

.maybeSingle();



if(badge){


const {error}=await supabase

.from("user_badges")

.insert({

user_id:user.id,

badge_id:badge.id

});


if(error){

console.error(
"Erreur badge",
error
);

}

}


}





await saveLessonProgress({

userId:user.id,

lessonId:lessonId,

score:score

});





setResult({

score,

xp:gainedXP,

correct

});


}







if(loading){

return (

<div>

Chargement quiz...

</div>

);

}





if(questions.length===0){

return (

<div className="bg-white p-5 rounded-xl shadow">

Aucune question trouvée.

</div>

);

}





return (

<div className="space-y-6">


<h2 className="text-2xl font-bold">

Quiz

</h2>




{

questions.map(
(q,index)=>(


<div

key={q.id}

className="bg-white shadow rounded-xl p-5"

>


<h3 className="font-semibold mb-4">

{index+1}. {q.question}

</h3>




<div className="space-y-2">


{

q.choices.map(

(choice,i)=>(


<button

key={i}

onClick={()=>chooseAnswer(index,i)}

className={`

w-full text-left p-3 rounded-lg border

${
answers[index]===i

?

"bg-blue-200 border-blue-500"

:

"bg-gray-100"

}

`}

>

{choice}

</button>


)

)


}


</div>


</div>


)

)


}





<button

onClick={validateQuiz}

className="bg-blue-600 text-white px-6 py-3 rounded-xl"

>

Valider le quiz

</button>





{

result &&

<div className="bg-green-100 p-5 rounded-xl">


<Trophy/>


<h2 className="font-bold text-xl">

Résultat

</h2>



<p>

Score : {result.score} %

</p>


<p>

Bonnes réponses :

{result.correct}/{questions.length}

</p>


<p>

+{result.xp} XP

</p>



</div>

}



</div>

);


}