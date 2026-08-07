import useAdmin from "../../hooks/useAdmin";

import { supabase } from "../../lib/supabase";


export default function AdminHeader(){


const {admin}=useAdmin();



async function logout(){

await supabase.auth.signOut();

window.location.href="/admin/login";

}



return (

<header className="
h-16
bg-white
border-b
flex
items-center
justify-between
px-6
">


<div>

<h2 className="font-semibold">

Administration

</h2>

</div>



<div className="
flex
items-center
gap-5
">


<div className="text-right">


<p className="font-medium">

{admin?.profile?.full_name}

</p>


<p className="
text-xs
text-gray-500
">

{admin?.profile?.role}

</p>


</div>



<button

onClick={logout}

className="
bg-red-500
text-white
px-4
py-2
rounded-lg
"

>

Déconnexion

</button>


</div>


</header>

)

}