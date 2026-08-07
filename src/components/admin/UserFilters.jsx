export default function UserFilters({
search,
setSearch,
role,
setRole
}){


return (

<div className="
flex
gap-4
mb-6
">


<input

className="
border
rounded-lg
p-3
flex-1
"

placeholder="Rechercher un élève..."

value={search}

onChange={
(e)=>setSearch(e.target.value)
}

/>



<select

className="
border
rounded-lg
p-3
"

value={role}

onChange={
(e)=>setRole(e.target.value)
}

>


<option value="">
Tous les rôles
</option>


<option value="student">
Élève
</option>


<option value="teacher">
Enseignant
</option>


<option value="editor">
Éditeur
</option>


<option value="admin">
Admin
</option>


<option value="super_admin">
Super Admin
</option>


</select>


</div>

)

}