import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  BarChart3,
  Settings,
  Upload
} from "lucide-react";


const menu = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard
  },
  {
    name: "Utilisateurs",
    path: "/admin/users",
    icon: Users
  },
    {
     name:"Matières",
     path:"/admin/subjects",
     icon:BookOpen
    },
  {
    name: "Cours",
    path: "/admin/courses",
    icon: BookOpen
  },
  {
    name: "Vidéos",
    path: "/admin/videos",
    icon: Video
  },
  {
    name: "Statistiques",
    path: "/admin/stats",
    icon: BarChart3
  },
  {
    name: "Paramètres",
    path: "/admin/settings",
    icon: Settings
  }
];


export default function AdminSidebar(){

return (

<aside className="
w-64
bg-slate-900
text-white
min-h-screen
p-5
">


<h1 className="
text-2xl
font-bold
mb-8
">
Kalan Admin
</h1>


<nav className="space-y-2">


{
menu.map((item)=>{

const Icon=item.icon;


return (

<a
key={item.name}
href={item.path}
className="
flex
items-center
gap-3
p-3
rounded-lg
hover:bg-slate-700
"
>

<Icon size={20}/>

<span>
{item.name}
</span>


</a>

)

})
}


</nav>


</aside>

)

}