import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";


export default function AdminLayout({children}){


return (

<div className="flex min-h-screen bg-gray-100">


<AdminSidebar/>


<div className="flex-1">


<AdminHeader/>


<main className="p-6">

{children}

</main>


</div>


</div>

)

}