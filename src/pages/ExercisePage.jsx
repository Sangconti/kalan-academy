// src/pages/ExercisePage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";

import {
  getQuizByLesson
} from "../services/educationService";

import { useNetwork } from "../hooks/useNetwork";

import ExerciseQuiz from "../components/ExerciseQuiz";

import {
  ArrowLeft
} from "lucide-react";



export default function ExercisePage(){


  const { lessonId } = useParams();
  console.log(
    "LESSON ID REÇU PAR EXERCISE PAGE :",
    lessonId
  );

  const navigate = useNavigate();

  const { isOnline } = useNetwork();

  const { user } = useUser();



  const [quiz,setQuiz] = useState(null);

  const [loading,setLoading] = useState(true);

  const [error,setError] = useState(null);





  useEffect(()=>{

    loadQuiz();

  },[lessonId,isOnline]);







  async function loadQuiz(){


    try{


      setLoading(true);

      setError(null);



      const data = await getQuizByLesson(lessonId);



      setQuiz(data);



    }catch(err){


      console.error(
        "Erreur chargement quiz :",
        err
      );


      setError(err.message);



    }finally{


      setLoading(false);


    }


  }







  if(loading){


    return (

      <div className="p-6 text-center">

        Chargement du quiz...

      </div>

    );


  }







  if(error){


    return (

      <div className="p-6 text-red-600">

        {error}

      </div>

    );


  }








  if(
    !quiz ||
    !quiz.quiz_questions ||
    quiz.quiz_questions.length === 0
  ){


    return (

      <div className="p-6">


        <button

          onClick={()=>navigate(-1)}

          className="
          flex
          items-center
          gap-2
          text-gray-600
          hover:text-blue-600
          mb-5
          "

        >

          <ArrowLeft size={18}/>

          Retour

        </button>




        <div
          className="
          bg-white
          rounded-xl
          shadow
          p-6
          text-center
          "
        >

          Aucun quiz disponible pour cette leçon.


        </div>



      </div>

    );


  }









  return (


    <div className="p-6 space-y-5">



      <button

        onClick={()=>navigate(-1)}

        className="
        flex
        items-center
        gap-2
        text-gray-600
        hover:text-blue-600
        "

      >

        <ArrowLeft size={18}/>

        Retour


      </button>






      <div>

        <h1 className="text-2xl font-bold">

          {quiz.title || "Quiz"}

        </h1>


        {quiz.description && (

          <p className="text-gray-500 mt-1">

            {quiz.description}

          </p>

        )}

      </div>







      <ExerciseQuiz

        questions={quiz.quiz_questions}

        quizId={quiz.id}

        lessonId={lessonId}

        userId={user?.id}

      />





    </div>


  );


}