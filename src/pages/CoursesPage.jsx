// src/pages/CoursesPage.jsx

import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";

import { getClasses } from "../services/educationService";

import {
  ArrowLeft,
  GraduationCap
} from "lucide-react";



export default function CoursesPage(){


const navigate = useNavigate();


const [classes,setClasses]=useState([]);

const [loading,setLoading]=useState(true);





useEffect(()=>{


async function load(){


try{


const data = await getClasses();

setClasses(data || []);


}catch(error){

console.error(error);


}finally{


setLoading(false);


}


}


load();


},[]);







if(loading){

return (

<div className="p-6 text-center">

Chargement des cours...

</div>

);

}







return (

<div className="space-y-6">





<button

onClick={()=>navigate("/")}

className="
flex
items-center
gap-2
text-gray-600
"

>

<ArrowLeft size={18}/>

Accueil

</button>






<div>

<h1 className="
text-3xl
font-bold
">

📚 Mes cours

</h1>


<p className="text-gray-500">

Choisis ton niveau scolaire.

</p>


</div>








<div className="
grid
grid-cols-2
md:grid-cols-3
gap-5
">


{

classes.map((classe,index)=>(


<div

key={classe.id}

onClick={()=>navigate(`/class/${classe.id}`)}

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


<GraduationCap
size={35}
className="text-gray-700"
/>



<h2 className="
font-bold
text-lg
mt-3
">

{classe.name}

</h2>



<p className="
text-sm
text-gray-600
mt-2
">

{classe.description}

</p>




</div>


))

}


</div>





</div>


);


}