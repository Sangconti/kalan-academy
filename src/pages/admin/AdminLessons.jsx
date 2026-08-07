import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft
} from "lucide-react";

import {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  importAdminLessonPack
} from "../../services/educationAdminService";


export default function AdminLessons(){

  const { chapterId } = useParams();

  const navigate = useNavigate();


  const [lessons,setLessons] = useState([]);

  const [loading,setLoading] = useState(false);

  const [editing,setEditing] = useState(null);



  const [form,setForm] = useState({

    title:"",
    description:"",
    duration_minutes:10,
    difficulty:"easy",
    video_url:"",
    thumbnail_url:"",
    is_premium:false,
    order_number:1

  });



  async function loadLessons(){


    if(!chapterId){

      setLessons([]);

      return;

    }


    try{


      setLoading(true);


      const data =
        await getLessons(chapterId);


      setLessons(data || []);


    }
    catch(error){

      console.error(
        "Erreur chargement leçons",
        error
      );

    }
    finally{

      setLoading(false);

    }


  }




  useEffect(()=>{

    loadLessons();

  },[chapterId]);






  async function handleImportJSON(e){


    const file =
      e.target.files[0];


    if(!file)
      return;



    try{


      const text =
        await file.text();


      const json =
        JSON.parse(text);



      const result =
        await importAdminLessonPack(json);



      alert(
      `✅ Import terminé


      Créés :

      📖 Leçons :
      ${result.created.lessons || 0}


      📝 Blocs :
      ${result.created.blocks || 0}


      🎯 Quiz :
      ${result.created.quizzes || 0}


      ❓ Questions :
      ${result.created.questions || 0}



      Déjà existants :

      📖 Leçons :
      ${result.skipped.lessons || 0}


      📝 Blocs :
      ${result.skipped.blocks || 0}


      🎯 Quiz :
      ${result.skipped.quizzes || 0}


      ❓ Questions :
      ${result.skipped.questions || 0}
      `
      );



      loadLessons();



      // permet de réimporter le même fichier

      e.target.value="";


    }
    catch(error){


      console.error(
        "Erreur import JSON",
        error
      );


      alert(
        "Erreur import JSON : "
        +
        error.message
      );


    }


  }








  async function handleSubmit(e){


    e.preventDefault();



    try{


      if(editing){


        await updateLesson(
          editing.id,
          form
        );


      }
      else{


        await createLesson({

          ...form,

          chapter_id:chapterId

        });


      }



      setEditing(null);


      setForm({

        title:"",
        description:"",
        duration_minutes:10,
        difficulty:"easy",
        video_url:"",
        thumbnail_url:"",
        is_premium:false,
        order_number:1

      });



      loadLessons();



    }
    catch(error){

      console.error(error);

    }


  }









  function editLesson(lesson){


    setEditing(lesson);


    setForm({

      title:lesson.title,

      description:
        lesson.description || "",

      duration_minutes:
        lesson.duration_minutes || 10,

      difficulty:
        lesson.difficulty || "easy",

      video_url:
        lesson.video_url || "",

      thumbnail_url:
        lesson.thumbnail_url || "",

      is_premium:
        lesson.is_premium || false,

      order_number:
        lesson.order_number || 1

    });


  }







  async function handleDelete(id){


    if(
      !confirm(
        "Supprimer cette leçon ?"
      )
    )
      return;



    try{


      await deleteLesson(id);


      loadLessons();


    }
    catch(error){

      console.error(error);

    }


  }








return (

<div className="p-6">


<div className="flex justify-between items-center mb-6">


<div>


<button

onClick={()=>navigate(-1)}

className="flex items-center gap-2 text-gray-600 mb-3"

>

<ArrowLeft size={18}/>

Retour

</button>



<h1 className="text-2xl font-bold flex items-center gap-2">

<BookOpen/>

Gestion des leçons

</h1>


</div>





<label

className="
cursor-pointer
bg-green-600
text-white
px-4
py-2
rounded-lg
"

>

Importer pack JSON Mali


<input

type="file"

accept=".json"

className="hidden"

onChange={handleImportJSON}

/>


</label>



</div>





{
!chapterId &&

<div className="
bg-yellow-50
border
border-yellow-300
rounded-lg
p-4
mb-6
">

<p className="font-semibold">

Aucun chapitre sélectionné

</p>


<p className="text-sm">

Utilisez l'import JSON pour créer automatiquement le chapitre et les leçons.

</p>


</div>

}







{
chapterId &&


<div className="grid md:grid-cols-3 gap-6">


<div className="bg-white shadow rounded-xl p-5">


<h2 className="font-bold mb-4">

{
editing
?
"Modifier leçon"
:
"Nouvelle leçon"
}

</h2>





<form
onSubmit={handleSubmit}
className="space-y-3"
>



<input

className="w-full border p-2 rounded"

placeholder="Titre"

value={form.title}

onChange={
e=>
setForm({
...form,
title:e.target.value
})
}

/>




<textarea

className="w-full border p-2 rounded"

placeholder="Description"

value={form.description}

onChange={
e=>
setForm({
...form,
description:e.target.value
})
}

/>




<label>

Durée vidéo (minutes)

</label>


<input

type="number"

className="w-full border p-2 rounded"

value={form.duration_minutes}

onChange={
e=>
setForm({
...form,
duration_minutes:Number(e.target.value)
})
}

/>





<select

className="w-full border p-2 rounded"

value={form.difficulty}

onChange={
e=>
setForm({
...form,
difficulty:e.target.value
})
}

>


<option value="easy">
Facile
</option>

<option value="medium">
Moyen
</option>

<option value="hard">
Difficile
</option>


</select>





<button

className="
bg-blue-600
text-white
px-4
py-2
rounded-lg
flex
gap-2
items-center
"

>

<Plus size={18}/>

{
editing
?
"Mettre à jour"
:
"Créer"
}


</button>



</form>


</div>








<div className="md:col-span-2">


{
loading ?

<p>
Chargement...
</p>


:

lessons.length===0 ?

<p>
Aucune leçon disponible.
</p>


:


<div className="space-y-4">


{

lessons.map(lesson=>(


<div

key={lesson.id}

className="
bg-white
shadow
rounded-xl
p-4
flex
justify-between
"

>


<div>


<h3 className="font-bold">

{lesson.title}

</h3>



<p>

{lesson.description}

</p>



<p className="text-sm text-gray-500">

Durée vidéo :
{lesson.duration_minutes} min

</p>


</div>




<div className="flex gap-2">


<button

onClick={()=>editLesson(lesson)}

className="bg-yellow-100 p-2 rounded"

>

<Pencil size={18}/>

</button>




<button

onClick={()=>handleDelete(lesson.id)}

className="bg-red-100 p-2 rounded"

>

<Trash2 size={18}/>

</button>


</div>


</div>


))

}



</div>


}


</div>



</div>


}



</div>

);


}