import {
useEffect,
useState
} from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

import UserTable from "../../components/admin/UserTable";

import UserFilters from "../../components/admin/UserFilters";


import {
  getAdminUsers,
  updateUserRole,
  updateUserAccess,
  deleteAdminUser,
  updateUserAccessStatus
} from "../../services/adminService";



export default function UsersAdmin(){

    const navigate = useNavigate();

    function viewStudent(studentId) {
      console.log(
        "👁️ [ADMIN] Ouverture du mode consultation :",
        studentId
      );

      navigate(
        `/admin/student/${studentId}/consultation`
      );
    }

    function manageStudent(studentId) {
      console.log(
        "⚙️ [ADMIN] Ouverture de la gestion de l'élève :",
        studentId
      );

      navigate(
        `/admin/student/${studentId}`
      );
    }

    async function deleteUser(id) {

      try {

        await deleteAdminUser(id);

        await load();

      } catch (error) {

        console.error(
          "Erreur suppression utilisateur :",
          error
        );

        throw error;

      }

    }

    async function resetUserDevice(id) {
        console.log("🚨 TEST RESET APPAREIL APPELÉ", id);

      try {

        console.log(
          "📱 [ADMIN] Réinitialisation appareil pour :",
          id
        );

        const {
          data: sessionData
        } = await supabase.auth.getSession();

        console.log(
          "🔐 [ADMIN] Session avant reset =",
          sessionData?.session?.user?.id
        );

        console.log(
          "👑 [ADMIN] ID attendu =",
          "6d37e063-455a-4058-92ce-468e43e8a993"
        );

        const {
          data,
          error
        } = await supabase.rpc(
          "reset_user_device",
          {
            p_user_id: id
          }
        );

        console.log(
          "📱 [ADMIN] Résultat reset appareil RAW =",
          data
        );

        console.log(
          "🔎 [ADMIN] auth_uid RPC =",
          data?.auth_uid
        );

        console.log(
          "🔎 [ADMIN] auth_uid_text RPC =",
          data?.auth_uid_text
        );

        console.log(
          "🔎 [ADMIN] profile_role RPC =",
          data?.profile_role
        );

        console.log(
          "🔎 [ADMIN] target_user_id RPC =",
          data?.target_user_id
        );

        console.log(
          "🔎 [ADMIN] is_admin RPC =",
          data?.is_admin
        );

        console.log(
          "🔎 [ADMIN] status RPC =",
          data?.status
        );

        if (error) {

          console.error(
            "❌ [ADMIN] Erreur RPC reset appareil :",
            error
          );

          throw error;
        }

        if (!data?.success) {

          throw new Error(
            data?.status === "not_authorized"
              ? "Vous n'êtes pas autorisé à réinitialiser cet appareil."
              : data?.status === "not_authenticated"
                ? "Votre session administrateur n'est plus valide."
                : "Impossible de réinitialiser l'appareil."
          );

        }

        await load();

      } catch (error) {

        console.error(
          "Erreur réinitialisation appareil :",
          error
        );

        throw error;

      }

    }



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
  onDelete={deleteUser}
  onDeviceReset={resetUserDevice}
  onViewStudent={viewStudent}
  onManageStudent={manageStudent}
/>


</>

)

}