// src/pages/HomePage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getClasses } from "../services/educationService";

import {
  GraduationCap,
  ArrowRight
} from "lucide-react";


export default function HomePage() {


const navigate = useNavigate();


const [classes,setClasses] = useState([]);

const [loading,setLoading] = useState(true);





useEffect(()=>{


async function loadClasses(){


try{


const data = await getClasses();

setClasses(data || []);



}catch(error){


console.error(
"Erreur classes :",
error
);


setClasses([]);


}finally{


setLoading(false);


}


}


loadClasses();


},[]);







if(loading){


return (

<div className="p-6 text-center">

Chargement...

</div>

);

}








return (


<div className="space-y-6">





<div>


<h1 className="
text-3xl
font-bold
text-gray-800
">

🎓 Kalan Academy

</h1>


<p className="
text-gray-500
mt-2
">

Choisis ta classe pour commencer.

</p>


</div>









{
classes.length === 0 ? (


<div className="
bg-white
rounded-xl
p-6
text-center
">

Aucune classe disponible.

</div>



) : (



<div className="
grid
grid-cols-2
md:grid-cols-3
gap-5
">



{
classes.map((classe)=>(



<div


key={classe.id}


onClick={()=>navigate(`/class/${classe.id}`)}


className="
bg-white
rounded-2xl
shadow
p-5
cursor-pointer
hover:shadow-xl
hover:-translate-y-1
transition
"

>



<div className="
bg-blue-100
w-12
h-12
rounded-xl
flex
items-center
justify-center
mb-4
">

<GraduationCap

className="text-blue-600"

/>


</div>






<h2 className="
font-bold
text-lg
text-gray-800
">

{classe.name}

</h2>





<p className="
text-sm
text-gray-500
mt-2
">

{classe.description}

</p>







<div className="
mt-4
flex
items-center
text-blue-600
text-sm
font-semibold
gap-2
">

Commencer

<ArrowRight size={16}/>

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