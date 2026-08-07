import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import {
  User,
  LayoutDashboard,
  Award,
  Download,
  Settings,
  LogOut
} from "lucide-react";


export default function UserMenu() {


  const navigate = useNavigate();


  async function logout() {

    await supabase.auth.signOut();

    navigate("/login");

  }




  const item =
    "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition text-gray-800";



  return (

    <div
      className="
      bg-white
      text-gray-800
      rounded-xl
      shadow-xl
      p-4
      space-y-2
      border
      border-gray-100
      "
    >



      <Link
        to="/profile"
        className={item}
      >

        <User size={20} className="text-blue-600"/>

        <span>
          Mon profil
        </span>

      </Link>





      <Link
        to="/dashboard"
        className={item}
      >

        <LayoutDashboard
          size={20}
          className="text-green-600"
        />

        <span>
          Tableau de bord
        </span>

      </Link>





      <Link
        to="/profile"
        className={item}
      >

        <Award
          size={20}
          className="text-yellow-500"
        />

        <span>
          Mes badges
        </span>

      </Link>






      <Link
        to="/downloads"
        className={item}
      >

        <Download
          size={20}
          className="text-purple-600"
        />

        <span>
          Mes téléchargements
        </span>

      </Link>






      <Link
        to="/settings"
        className={item}
      >

        <Settings
          size={20}
          className="text-gray-600"
        />

        <span>
          Paramètres
        </span>

      </Link>






      <button

        onClick={logout}

        className="
        w-full
        flex
        items-center
        gap-3
        p-3
        rounded-lg
        bg-red-600
        text-white
        hover:bg-red-700
        "

      >

        <LogOut size={20}/>

        <span>
          Déconnexion
        </span>


      </button>




    </div>

  );

}