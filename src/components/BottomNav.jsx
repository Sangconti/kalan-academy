// src/components/BottomNav.jsx

import { useNavigate, useLocation } from "react-router-dom";

import {
  Home,
  BookOpen,
  BarChart3,
  Download,
  User
} from "lucide-react";


export default function BottomNav(){


const navigate = useNavigate();

const location = useLocation();



const isActive = (path)=>{

 if(path === "/"){
   return location.pathname === "/";
 }

 return location.pathname.startsWith(path);

};



const items=[

{
path:"/",
label:"Accueil",
icon:Home
},

{
path:"/courses",
label:"Cours",
icon:BookOpen
},

{
path:"/dashboard",
label:"Progression",
icon:BarChart3
},

{
path:"/downloads",
label:"Téléchargés",
icon:Download
},

{
path:"/profile",
label:"Profil",
icon:User
}

];



return (

<nav
className="
fixed
bottom-0
left-0
right-0
bg-white
border-t
shadow-lg
z-20
"
>


<div
className="
max-w-md
mx-auto
flex
justify-around
py-2
"
>


{
items.map((item)=>{


const Icon=item.icon;


return (

<button

key={item.path}

onClick={()=>navigate(item.path)}

className={`
flex
flex-col
items-center
gap-1
p-2

${
isActive(item.path)
?
"text-blue-600 font-semibold"
:
"text-gray-400"
}

`}

>


<Icon size={22}/>


<span className="text-xs">

{item.label}

</span>


</button>


)


})

}


</div>


</nav>

);


}