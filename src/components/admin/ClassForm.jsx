import {
useState
} from "react";


export default function ClassForm({
onSubmit
}){


const [name,setName]=useState("");

const [order,setOrder]=useState(1);



function submit(e){

e.preventDefault();


onSubmit({

name,

order_number:Number(order)

});


setName("");

}



return (

<form

onSubmit={submit}

className="
bg-white
p-5
rounded-xl
shadow
mb-6
"


>


<input

className="
border
p-3
rounded
mr-3
"

placeholder="Nom classe"

value={name}

onChange={
e=>setName(e.target.value)
}

/>


<input

type="number"

className="
border
p-3
rounded
w-24
"

value={order}

onChange={
e=>setOrder(e.target.value)
}

/>



<button

className="
bg-indigo-600
text-white
px-5
py-3
rounded
ml-3
"

>

Ajouter

</button>


</form>

)

}