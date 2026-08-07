export default function UserTable({
users,
onRoleChange
}){


return (

<div className="
bg-white
rounded-xl
shadow
overflow-hidden
">


<table className="
w-full
">


<thead className="
bg-gray-100
">

<tr>

<th className="p-4 text-left">
Nom
</th>

<th className="p-4">
Rôle
</th>

<th className="p-4">
Premium
</th>

<th className="p-4">
XP
</th>

<th className="p-4">
Niveau
</th>

</tr>

</thead>



<tbody>


{
users.map(user=>(


<tr
key={user.id}
className="
border-t
"
>


<td className="p-4">

{user.full_name || "Sans nom"}

</td>



<td className="p-4">


<select

value={user.role}

onChange={
(e)=>
onRoleChange(
user.id,
e.target.value
)
}

className="
border
rounded
p-2
"

>


<option value="student">
student
</option>


<option value="teacher">
teacher
</option>


<option value="editor">
editor
</option>


<option value="admin">
admin
</option>


<option value="super_admin">
super_admin
</option>


</select>


</td>



<td className="p-4 text-center">

{
user.is_premium
?
"⭐"
:
"-"
}

</td>



<td className="p-4 text-center">

{user.xp || 0}

</td>



<td className="p-4 text-center">

{user.level || 1}

</td>


</tr>


))

}


</tbody>


</table>


</div>


)

}