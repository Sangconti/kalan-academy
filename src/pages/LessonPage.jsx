// src/pages/LessonPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getLesson,
  getLessonBlocks
} from "../services/educationService";

import {
  cacheLesson,
  getCachedLesson,
  cacheLessonBlocks,
  getCachedLessonBlocks
} from "../offline/db";

import { useNetwork } from "../hooks/useNetwork";

import {
  ArrowLeft,
  PlayCircle,
  BookOpen
} from "lucide-react";


export default function LessonPage(){

  const { lessonId } = useParams();
  const navigate = useNavigate();

  const { isOnline } = useNetwork();


  const [lesson,setLesson] = useState(null);
  const [blocks,setBlocks] = useState([]);

  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(null);



  useEffect(()=>{

    loadLesson();

  },[lessonId,isOnline]);




  async function loadLesson(){

      try{

        setLoading(true);


        let lessonData = null;
        let blockData = [];



        if(isOnline){


          lessonData = await getLesson(lessonId);

          blockData = await getLessonBlocks(lessonId);



          if(lessonData){

            await cacheLesson(lessonData);

          }



          await cacheLessonBlocks(
            blockData || []
          );


        }else{


          lessonData =
            await getCachedLesson(lessonId);


          blockData =
            await getCachedLessonBlocks(lessonId);


        }




        setLesson(lessonData);

        setBlocks(blockData || []);



      }catch(err){


        console.error(
          "Erreur LessonPage:",
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
        Chargement...
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



  if(!lesson){

    return (
      <div className="p-6">
        Leçon introuvable.
      </div>
    );

  }




  return (

    <div className="p-6 space-y-6">


      <button
        onClick={()=>navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
      >

        <ArrowLeft size={18}/>

        Retour

      </button>




      <div className="bg-white rounded-xl shadow p-5">


        <h1 className="text-2xl font-bold">
          {lesson.title}
        </h1>


        <p className="text-gray-600 mt-2">
          {lesson.description}
        </p>




        {
          lesson.video_url &&

          <button

            onClick={()=>
              navigate(`/video/${lesson.id}`)
            }

            className="
            mt-4
            flex
            items-center
            gap-2
            bg-blue-600
            text-white
            px-4
            py-3
            rounded-lg
            "

          >

            <PlayCircle size={20}/>

            Voir la vidéo

          </button>

        }


      </div>






      <div>


        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">

          <BookOpen size={22}/>

          Cours

        </h2>




        {
          blocks.length === 0 ?

          <p className="text-gray-500">
            Aucun contenu disponible.
          </p>


          :

          blocks.map(block=>(

            <div
              key={block.id}
              className="bg-white rounded-xl shadow p-4 mb-3"
            >

              <h3 className="font-semibold text-lg">
               {block.title || "Cours"}
              </h3>

              <p className="text-gray-700 mt-2 whitespace-pre-line">
                {
                  typeof block.content === "object"
                    ? block.content.text
                    : block.content
                }
              </p>


            </div>

          ))

        }


      </div>







      <div className="bg-white rounded-xl shadow p-5">

      <h2 className="text-xl font-bold mb-3">
      Quiz de validation
      </h2>


      <button

      onClick={()=>
      navigate(`/exercise/${lesson.id}`)
      }

      className="
      bg-green-600
      text-white
      px-5
      py-3
      rounded-lg
      "

      >

      Commencer le quiz

      </button>


      </div>



    </div>

  );

}