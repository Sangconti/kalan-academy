// src/pages/VideoPage.jsx

import {
useEffect,
useState
} from "react";

import {
useParams,
useNavigate
} from "react-router-dom";


import {
supabase
} from "../lib/supabase";


import {
getLesson
} from "../services/educationService";


import {
addXP
} from "../services/xpService";


import {
unlockBadge
} from "../services/badgeService";


import {
ArrowLeft,
CheckCircle
} from "lucide-react";





export default function VideoPage(){


const {lessonId}=useParams();

const navigate=useNavigate();


const [lesson,setLesson]=useState(null);

const [quiz,setQuiz]=useState(null);

const [questions,setQuestions]=useState([]);

const [answers,setAnswers]=useState({});

const [result,setResult]=useState(null);

const [loading,setLoading]=useState(true);

const [user,setUser]=useState(null);







useEffect(()=>{

loadData();

},[lessonId]);







async function loadData(){


try{


const {

data:{
user

}

}
=
await supabase.auth.getUser();



setUser(user);





const lessonData =
await getLesson(lessonId);


setLesson(lessonData);





const {

data:quizData

}
=
await supabase

.from("quizzes")

.select("*")

.eq(
"lesson_id",
lessonId
)

.single();





if(!quizData){

setLoading(false);

return;

}



setQuiz(quizData);





const {

data:questionsData,

error

}
=
await supabase

.from("quiz_questions")

.select("*")

.eq(
"quiz_id",
quizData.id
)

.order(
"order_number"
);



if(error)
throw error;



setQuestions(
questionsData || []
);



}
catch(error){

console.error(
"Chargement erreur:",
error
);

}
finally{

setLoading(false);

}


}









function chooseAnswer(
questionId,
index
){


setAnswers({

...answers,

[questionId]:index

});


}









async function validateQuiz(){


let goodAnswers=0;



questions.forEach(q=>{


if(
answers[q.id] === q.correct_index
){

goodAnswers++;

}


});




const score =
Math.round(
(goodAnswers/questions.length)*100
);





// sauvegarde tentative

await supabase

.from("quiz_attempts")

.insert({

user_id:user.id,

quiz_id:quiz.id,

score:score

});







// progression

await supabase

.from("user_progress")

.upsert({

user_id:user.id,

lesson_id:lessonId,

last_score:score,

completion_percentage:score,

completed:
score>=80,

completed_at:
score>=80
?
new Date()
:
null

});







// XP + badge


let xpGain = 50;



if(score>=80){


xpGain=100;



await unlockBadge(

user.id,

"Élève brillant"

);



}



const levelData =
await addXP(
user.id,
xpGain
);







setResult({

score,

goodAnswers,

total:questions.length,

xp:xpGain,

level:
levelData?.level || null


});



}









if(loading)

return (

<div className="p-6">

Chargement...

</div>

);







if(!lesson)

return (

<div className="p-6">

Leçon introuvable

</div>

);








return (


<div className="p-6 space-y-6">





<button

onClick={()=>navigate(-1)}

className="
flex items-center gap-2
text-gray-600
"

>

<ArrowLeft size={18}/>

Retour

</button>







<h1 className="text-2xl font-bold">

{lesson.title}

</h1>







<div className="
bg-black
rounded-xl
overflow-hidden
aspect-video
">


{
lesson.video_url ?

<video

controls

src={lesson.video_url}

className="w-full h-full"

/>

:

<div className="
text-white
flex
justify-center
items-center
h-full
">

Vidéo indisponible

</div>

}



</div>










<h2 className="text-xl font-bold">

QCM

</h2>








{
questions.map(
(q,index)=>(


<div

key={q.id}

className="
bg-white
shadow
rounded-xl
p-4
space-y-3
"

>


<h3 className="font-semibold">

{index+1}. {q.question}

</h3>




{
q.choices.map(
(choice,i)=>(


<button

key={i}

onClick={()=>chooseAnswer(q.id,i)}

className={`
w-full
text-left
p-3
rounded-lg

${
answers[q.id]===i
?
"bg-blue-200"
:
"bg-gray-100"
}

`}

>

{choice}

</button>


))

}



</div>



))
}







{
questions.length>0 && !result &&

<button

onClick={validateQuiz}

className="
bg-blue-600
text-white
px-6
py-3
rounded-xl
"

>

Valider

</button>

}








{
result &&


<div className="
bg-green-100
p-5
rounded-xl
space-y-2
">


<div className="flex gap-2 items-center">

<CheckCircle/>

Résultat

</div>


<p>
Score :
<b>{result.score}%</b>
</p>


<p>
Réponses correctes :
{result.goodAnswers}/{result.total}
</p>


<p>
XP gagné :
+{result.xp}
</p>


<p>
Niveau :
{result.level}
</p>



</div>


}



</div>


);


}