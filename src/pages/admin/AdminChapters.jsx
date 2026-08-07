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
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  importAdminLessonPack
} from "../../services/educationAdminService";



export default function AdminChapters() {


  const { subjectId } = useParams();

  const navigate = useNavigate();



  const [chapters,setChapters] = useState([]);

  const [loading,setLoading] = useState(true);


  const [editing,setEditing] = useState(null);



  const [form,setForm] = useState({

    title:"",
    description:"",
    order_number:1

  });



  async function loadChapters(){

    try{

      const result = await getChapters(subjectId);


      setChapters(result || []);


    }

    catch(error){

      console.error(
        "Erreur chargement chapitres",
        error
      );

    }

    finally{

      setLoading(false);

    }

  }

async function handleImportJSON(e){

  const file = e.target.files[0];


  if(!file)
    return;


  try{


    const text = await file.text();


    const json = JSON.parse(text);



    const result =
      await importAdminLessonPack(json);



    alert(
    `✅ Import terminé

    Créés :
    📚 Chapitres : ${result.created.chapters}
    📖 Leçons : ${result.created.lessons}
    📝 Blocs : ${result.created.blocks}
    🎯 Quiz : ${result.created.quizzes}
    ❓ Questions : ${result.created.questions}


    Déjà existants :
    📚 Chapitres : ${result.skipped.chapters}
    📖 Leçons : ${result.skipped.lessons}
    📝 Blocs : ${result.skipped.blocks}
    🎯 Quiz : ${result.skipped.quizzes}
    ❓ Questions : ${result.skipped.questions}`
    );


    loadChapters();


    e.target.value="";


  }
  catch(error){


    console.error(
      "Erreur import JSON :",
      error
    );


    alert(
      "Erreur import JSON : "
      +
      error.message
    );


  }

}




  useEffect(()=>{

    if(subjectId){

      loadChapters();

    }

  },[subjectId]);







  async function handleSubmit(e){

    e.preventDefault();


    try{


      if(editing){


        await updateChapter(
          editing.id,
          form
        );


      }

      else{


        await createChapter({

          ...form,

          subject_id:subjectId

        });


      }



      setForm({

        title:"",
        description:"",
        order_number:1

      });


      setEditing(null);


      loadChapters();



    }

    catch(error){

      console.error(error);

    }

  }








  function editChapter(chapter){


    setEditing(chapter);


    setForm({

      title:chapter.title,

      description:
        chapter.description || "",

      order_number:
        chapter.order_number || 1

    });


  }




  async function handleDelete(id){


    if(!confirm(
      "Supprimer ce chapitre ?"
    ))
    return;



    try{

      await deleteChapter(id);

      loadChapters();

    }

    catch(error){

      console.error(error);

    }

  }



   return (

 <div className="p-6">


        <div className="mb-6 flex justify-between items-center">


        <div>

        <button

        onClick={()=>navigate(-1)}

        className="flex items-center gap-2 text-gray-600 mb-4"

        >

        <ArrowLeft size={18}/>

        Retour

        </button>



        <h1 className="text-2xl font-bold flex items-center gap-2">

        <BookOpen/>

        Gestion des chapitres

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




  <div className="grid md:grid-cols-3 gap-6">




        {/* FORMULAIRE */}


        <div className="bg-white rounded-xl shadow p-5">


        <h2 className="font-semibold mb-4">

        {editing
        ?
        "Modifier chapitre"
        :
        "Nouveau chapitre"
        }

        </h2>



        <form

        onSubmit={handleSubmit}

        className="space-y-3"

        >


        <input

        className="w-full border rounded-lg p-2"

        placeholder="Titre du chapitre"

        value={form.title}

        onChange={e=>
        setForm({

        ...form,

        title:e.target.value

        })
        }

        />





        <textarea

        className="w-full border rounded-lg p-2"

        placeholder="Description"

        value={form.description}

        onChange={e=>
        setForm({

        ...form,

        description:e.target.value

        })
        }

        />


        <label className="font-medium">
        Ordre du chapitre
        </label>

        <input
        type="number"
        className="w-full border rounded-lg p-2"
        value={form.order_number}
        onChange={
        e =>
        setForm({
        ...form,
        order_number:Number(e.target.value)
        })
        }
        />



        <button

        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"

        >

        <Plus size={18}/>

        {editing
        ?
        "Mettre à jour"
        :
        "Créer"
        }

        </button>


        </form>


        </div>



                {/* LISTE */}

                <div className="md:col-span-2">


                {
                loading ?

                <p>
                Chargement...
                </p>


                :

                chapters.length===0 ?

                <p>
                Aucun chapitre disponible.
                </p>


                :


                <div className="space-y-4">


                {
                chapters.map(chapter=>(


                <div

                key={chapter.id}

                className="bg-white shadow rounded-xl p-4 flex justify-between items-center"

                >


                <div>


                <h3 className="font-bold">

                {chapter.title}

                </h3>


                <p className="text-sm text-gray-500">

                {chapter.description}

                </p>


                </div>





                <div className="flex gap-2">



                <button

                onClick={()=>editChapter(chapter)}

                className="p-2 bg-yellow-100 rounded"

                >

                <Pencil size={18}/>

                </button>





                <button

                onClick={()=>handleDelete(chapter.id)}

                className="p-2 bg-red-100 rounded"

                >

                <Trash2 size={18}/>

                </button>





                <button

                onClick={()=>navigate(
                `/admin/lessons/${chapter.id}`
                )}

                className="bg-green-600 text-white px-3 py-2 rounded"

                >

                Leçons

                </button>



                </div>


                </div>


                ))

                }


                </div>


                }


                </div>


                </div>


                </div>


        );
        }