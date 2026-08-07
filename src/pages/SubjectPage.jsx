// src/pages/SubjectPage.jsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getChapters } from "../services/educationService";

import {
  cacheChapters,
  getCachedChapters
} from "../offline/db";

import { useNetwork } from "../hooks/useNetwork";

import {
  ArrowLeft,
  BookOpen
} from "lucide-react";


export default function SubjectPage() {


  const { subjectId } = useParams();

  const navigate = useNavigate();

  const { isOnline } = useNetwork();


  const [chapters,setChapters] = useState([]);

  const [loading,setLoading] = useState(true);

  const [error,setError] = useState(null);





  useEffect(()=>{

    loadSubjectData();

  },[subjectId,isOnline]);





  async function loadSubjectData(){

    try{


      setLoading(true);


      if(isOnline){


        const data = await getChapters(subjectId);


        setChapters(data || []);


        if(data?.length){

          await cacheChapters(data);

        }


      }else{


        const cached = await getCachedChapters(subjectId);

        setChapters(cached || []);

      }



    }catch(err){


      console.error(err);

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





return (

<div className="space-y-5">



{/* RETOUR */}

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






<h1 className="
text-2xl
font-bold
">

Chapitres

</h1>







{
chapters.length===0 ? (

<div className="
bg-white
rounded-xl
shadow
p-6
text-center
text-gray-500
">

Aucun chapitre disponible.

</div>


) : (


<div className="
grid
md:grid-cols-2
gap-4
">


{
chapters.map((chapter)=>(


<div

key={chapter.id}

onClick={()=>navigate(`/chapter/${chapter.id}`)}

className="
bg-white
rounded-xl
shadow
p-5
cursor-pointer
hover:shadow-lg
transition
"


>


<div className="
flex
items-center
gap-3
">


<BookOpen
className="text-blue-600"
/>


<h3 className="font-bold">

{chapter.title}

</h3>


</div>



<p className="
text-gray-600
mt-3
">

{chapter.description}

</p>



</div>



))

}



</div>


)

}



</div>


);


}