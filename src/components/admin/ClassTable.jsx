export default function ClassTable({
classes,
onEdit,
onDelete
}){


return (

<div className="
bg-white
rounded-xl
shadow
overflow-hidden
">


<table className="w-full">


<thead className="bg-gray-100">

<tr>

<th className="p-4 text-left">
Nom
</th>

<th>
Ordre
</th>

<th>
Actions
</th>

</tr>

</thead>


<tbody>


{
classes.map(item=>(

<tr
key={item.id}
className="border-t"
>


<td className="p-4">

{item.name}

</td>


<td className="text-center">

{item.order_number}

</td>



<td className="text-center">


<button

onClick={()=>onEdit(item)}

className="text-blue-600 mr-4"

>
Modifier
</button>


<button

onClick={()=>onDelete(item.id)}

className="text-red-600"

>
Supprimer
</button>


</td>


</tr>


))

}


</tbody>


</table>


</div>

)

}