import {
useEffect,
useState
} from "react";


import ClassTable from "../../components/admin/ClassTable";

import ClassForm from "../../components/admin/ClassForm";


import {
getAdminClasses,
createClass,
deleteClass
}
from "../../services/adminService";



export default function ClassesAdmin(){


const [classes,setClasses]=useState([]);



async function load(){

setClasses(
await getAdminClasses()
);

}



useEffect(()=>{

load();

},[]);



async function add(data){

await createClass(data);

load();

}



async function remove(id){

await deleteClass(id);

load();

}



return (

<>


<h1 className="
text-3xl
font-bold
mb-6
">

Gestion des classes

</h1>


<ClassForm
onSubmit={add}
/>


<ClassTable

classes={classes}

onDelete={remove}

onEdit={()=>{}}

/>


</>

)

}