import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft
} from "lucide-react";

import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} from "../../services/educationAdminService";


export default function AdminSubjects() {


  const navigate = useNavigate();


  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);


  const [form, setForm] = useState({

    name: "",
    code: "",
    order_number: 1

  });


  const [editing, setEditing] = useState(null);



  async function loadSubjects(){

    try {

      setLoading(true);

      const data = await getAllSubjects();

      setSubjects(data || []);

    }

    catch(error){

      console.error(
        "Erreur chargement matières",
        error
      );

    }

    finally{

      setLoading(false);

    }

  }



  useEffect(()=>{

    loadSubjects();

  },[]);





  async function handleSubmit(e){

    e.preventDefault();


    try {


      if(editing){


        await updateSubject(
          editing.id,
          form
        );


      }

      else{


        await createSubject(form);


      }



      setForm({

        name:"",
        code:"",
        order_number:1

      });


      setEditing(null);


      loadSubjects();


    }

    catch(error){

      console.error(
        "Erreur sauvegarde matière",
        error
      );

    }

  }





  async function handleDelete(id){


    if(!confirm(
      "Supprimer cette matière ?"
    ))
    return;



    try{

      await deleteSubject(id);

      loadSubjects();

    }

    catch(error){

      console.error(error);

    }


  }





  function editSubject(subject){


    setEditing(subject);


    setForm({

      name: subject.name,

      code: subject.code || "",

      order_number:
        subject.order_number || 1

    });


  }







return (

<div className="p-6">



<div className="flex items-center justify-between mb-6">


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

Gestion des matières

</h1>


</div>


</div>






<div className="grid md:grid-cols-3 gap-6">





{/* FORMULAIRE */}


<div className="bg-white shadow rounded-xl p-5">


<h2 className="font-semibold mb-4">

{
editing
?
"Modifier matière"
:
"Nouvelle matière"
}

</h2>



<form

onSubmit={handleSubmit}

className="space-y-3"

>



<input

className="w-full border rounded-lg p-2"

placeholder="Nom matière"

value={form.name}

onChange={
e=>setForm({

...form,

name:e.target.value

})
}

/>





<input

className="w-full border rounded-lg p-2"

placeholder="Code (MATH, PC...)"

value={form.code}

onChange={
e=>setForm({

...form,

code:e.target.value

})
}

/>


<label className="font-medium">
Ordre d'affichage
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

className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2"

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







{/* LISTE */}


<div className="md:col-span-2">


{
loading

?

<p>
Chargement...
</p>


:

subjects.length===0

?

<p>
Aucune matière disponible.
</p>


:


<div className="grid gap-4">


{
subjects.map(subject=>(


<div

key={subject.id}

className="bg-white shadow rounded-xl p-4 flex justify-between items-center"

>



<div>


<h3 className="font-bold">

{subject.name}

</h3>


<p className="text-sm text-gray-500">

Code : {subject.code}

</p>


{
subject.classes &&

<p className="text-sm text-gray-500">

Classe : {subject.classes.name}

</p>

}


</div>





<div className="flex gap-2">


<button

onClick={()=>editSubject(subject)}

className="p-2 rounded bg-yellow-100"

>

<Pencil size={18}/>

</button>





<button

onClick={()=>handleDelete(subject.id)}

className="p-2 rounded bg-red-100"

>

<Trash2 size={18}/>

</button>





<button

onClick={()=>navigate(
`/admin/chapters/${subject.id}`
)}

className="px-3 py-2 bg-green-600 text-white rounded"

>

Chapitres

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