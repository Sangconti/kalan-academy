// =====================================================
// src/components/UserMenu.jsx
// =====================================================

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  supabase
} from "../lib/supabase";

import {
  User,
  LayoutDashboard,
  Award,
  Download,
  Settings,
  LogOut
} from "lucide-react";


export default function UserMenu() {

  const navigate =
    useNavigate();


  // =====================================================
  // DÉCONNEXION
  // =====================================================

  async function logout() {

    try {

      const {
        error
      } =
        await supabase.auth.signOut();


      if (error) {

        throw error;

      }


      navigate("/login");

    } catch (error) {

      console.error(
        "Erreur déconnexion :",
        error
      );

    }

  }


  // =====================================================
  // STYLE
  // =====================================================

  const itemClass = `
    flex
    items-center
    gap-3
    p-3
    rounded-lg
    hover:bg-gray-100
    transition
    text-gray-800
  `;


  // =====================================================
  // AFFICHAGE
  // =====================================================

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


      {/* PROFIL */}

      <Link
        to="/profile"
        className={itemClass}
      >

        <User
          size={20}
          className="text-blue-600"
        />

        <span>
          Mon profil
        </span>

      </Link>


      {/* TABLEAU DE BORD */}

      <Link
        to="/dashboard"
        className={itemClass}
      >

        <LayoutDashboard
          size={20}
          className="text-green-600"
        />

        <span>
          Tableau de bord
        </span>

      </Link>


      {/* BADGES */}

      <Link
        to="/profile"
        className={itemClass}
      >

        <Award
          size={20}
          className="text-yellow-500"
        />

        <span>
          Mes badges
        </span>

      </Link>


      {/* TÉLÉCHARGEMENTS */}

      <Link
        to="/downloads"
        className={itemClass}
      >

        <Download
          size={20}
          className="text-purple-600"
        />

        <span>
          Mes téléchargements
        </span>

      </Link>


      {/* PARAMÈTRES */}

      <Link
        to="/settings"
        className={itemClass}
      >

        <Settings
          size={20}
          className="text-gray-600"
        />

        <span>
          Paramètres
        </span>

      </Link>


      {/* DÉCONNEXION */}

      <button
        type="button"
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
          transition
        "
      >

        <LogOut size={20} />

        <span>
          Déconnexion
        </span>

      </button>


    </div>

  );

}

