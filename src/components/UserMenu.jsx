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


// =====================================================
// COMPOSANT
// =====================================================

export default function UserMenu({ onClose }) {

  const navigate =
    useNavigate();


  // ===================================================
  // NAVIGATION
  // ===================================================

  function handleNavigate(path) {

    if (onClose) {
      onClose();
    }

    navigate(path);

  }


  // ===================================================
  // DÉCONNEXION
  // ===================================================

  async function logout() {

    if (onClose) {
      onClose();
    }

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


  // ===================================================
  // STYLE DES ÉLÉMENTS
  // ===================================================

  const itemClass = `
    flex
    items-center
    gap-3
    p-3
    rounded-lg
    transition
    theme-text
    theme-hover
  `;


  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (

    <div
      className="
        rounded-xl
        shadow-xl
        p-4
        space-y-2
        border
        theme-surface
        theme-border
      "
    >

      {/* PROFIL */}

      <Link
        to="/profile"
        onClick={onClose}
        className={itemClass}
      >

        <User
          size={20}
          className="theme-accent-text"
        />

        <span>
          Mon profil
        </span>

      </Link>


      {/* TABLEAU DE BORD */}

      <Link
        to="/dashboard"
        onClick={onClose}
        className={itemClass}
      >

        <LayoutDashboard
          size={20}
          className="theme-accent-text"
        />

        <span>
          Tableau de bord
        </span>

      </Link>


      {/* BADGES */}

      <Link
        to="/profile"
        onClick={onClose}
        className={itemClass}
      >

        <Award
          size={20}
          className="theme-accent-text"
        />

        <span>
          Mes badges
        </span>

      </Link>


      {/* TÉLÉCHARGEMENTS */}

      <Link
        to="/downloads"
        onClick={onClose}
        className={itemClass}
      >

        <Download
          size={20}
          className="theme-accent-text"
        />

        <span>
          Mes téléchargements
        </span>

      </Link>


      {/* PARAMÈTRES */}

      <Link
        to="/settings"
        onClick={onClose}
        className={itemClass}
      >

        <Settings
          size={20}
          className="theme-accent-text"
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

        <LogOut
          size={20}
        />

        <span>
          Déconnexion
        </span>

      </button>

    </div>

  );

}