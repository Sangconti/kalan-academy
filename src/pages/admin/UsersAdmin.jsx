import {
useEffect,
useState
} from "react";


import UserTable from "../../components/admin/UserTable";

import UserFilters from "../../components/admin/UserFilters";


import {
  getAdminUsers,
  updateUserRole,
  updateUserAccess,
  updateUserAccessStatus
} from "../../services/adminService";



export default function UsersAdmin(){


const [users,setUsers]=useState([]);

const [search,setSearch]=useState("");

const [role,setRole]=useState("");



async function load(){

const data =
await getAdminUsers();

setUsers(data);

}



useEffect(()=>{

load();

},[]);



async function changeRole(
id,
newRole
){

await updateUserRole(
id,
newRole
);


load();

}

async function changeAccess(
  id,
  newStatus
){

  await updateUserAccess(
    id,
    newStatus
  );

  load();
}

async function changeAccessStatus(
  id,
  newStatus
) {
  try {
    await updateUserAccessStatus(
      id,
      newStatus
    );

    await load();

  } catch (error) {
    console.error(
      "Erreur changement accès utilisateur :",
      error
    );
  }
}


const filtered =
users.filter(user=>{


const matchName =
(user.full_name || "")
.toLowerCase()
.includes(
search.toLowerCase()
);



const matchRole =
role === ""
||
user.role === role;



return matchName && matchRole;


});



return (

<>


<h1 className="
text-3xl
font-bold
mb-6
">

Gestion des utilisateurs

</h1>



<UserFilters

search={search}

setSearch={setSearch}

role={role}

setRole={setRole}

/>



<UserTable
  users={filtered}
  onRoleChange={changeRole}
  onAccessChange={changeAccess}
  onAccessStatusChange={changeAccessStatus}
/>



</>

)

}