// src/pages/ChapterPage.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getLessons,
  getChapter
} from "../services/educationService";

import {
  cacheLessons,
  getCachedLessons
} from "../offline/db";

import { useNetwork } from "../hooks/useNetwork";

import {
  ArrowLeft,
  PlayCircle,
  Clock,
  BookOpen
} from "lucide-react";



export default function ChapterPage() {


  const { chapterId } = useParams();

  const navigate = useNavigate();

  const { isOnline } = useNetwork();


  const [chapter, setChapter] = useState(null);

  const [lessons,setLessons] = useState([]);

  const [loading,setLoading] = useState(true);

  const [error,setError] = useState(null);





  useEffect(()=>{

    loadLessons();

  },[chapterId,isOnline]);







  async function loadLessons(){


    try{


      setLoading(true);



      if(isOnline){

        const chapterData = await getChapter(chapterId);

        setChapter(chapterData);


        const data = await getLessons(chapterId);

        setLessons(data || []);


        if(data?.length){

          await cacheLessons(data);

        }

      }else{


        const cached = await getCachedLessons(chapterId);

        setLessons(cached || []);


      }



    }catch(err){


      console.error(
        "Erreur ChapterPage :",
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

        Chargement des leçons...

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







  return (

      <div className="p-6 space-y-6">






      {/* RETOUR */}

     <button
       onClick={() => navigate(-1)}
       className="
         flex
         items-center
         gap-2
         mb-4
         px-3
         py-2
         rounded-lg
         bg-white
         shadow-sm
         text-gray-700
         hover:text-blue-600
       "
     >
       <ArrowLeft size={18} />
       Retour
     </button>








      <div>

       {chapter && (
         <div className="mb-6">
           <h1 className="text-2xl font-bold">
             📘 {chapter.title}
           </h1>

           {chapter.description && (
             <p className="mt-2 text-gray-600">
               {chapter.description}
             </p>
           )}
         </div>
       )}

       <h2 className="text-xl font-semibold">
         📖 Leçons
       </h2>

       <p className="text-gray-500">
         Choisis une leçon pour apprendre.
       </p>

      </div>








      {
        lessons.length === 0 ? (


          <div className="
            bg-white
            rounded-2xl
            shadow
            p-6
            text-center
            text-gray-500
          ">

            Aucune leçon disponible.


          </div>



        ) : (



          <div className="
            grid
            grid-cols-2
            md:grid-cols-3
            gap-4
          ">



          {

            lessons.map((lesson,index)=>(


              <div

                key={lesson.id}

                onClick={()=>navigate(`/lesson/${lesson.id}`)}

                className={`
                  rounded-2xl
                  p-5
                  shadow
                  cursor-pointer
                  hover:scale-105
                  transition

                  ${
                    index%3===0
                    ?
                    "bg-blue-100"
                    :
                    index%3===1
                    ?
                    "bg-green-100"
                    :
                    "bg-purple-100"
                  }

                `}

              >



                <PlayCircle
                  size={38}
                  className="text-blue-700"
                />



                <h2 className="
                  font-bold
                  mt-3
                  text-gray-800
                ">

                  {lesson.title}

                </h2>





                <div className="
                  flex
                  items-center
                  gap-2
                  mt-3
                  text-sm
                  text-gray-600
                ">


                  <Clock size={15}/>


                  {lesson.duration_minutes || 0} min


                </div>





                <div className="
                  flex
                  items-center
                  gap-2
                  mt-2
                  text-sm
                  text-gray-600
                ">


                  <BookOpen size={15}/>


                  Leçon {index+1}


                </div>




              </div>



            ))

          }



          </div>



        )

      }







    </div>


  );


}