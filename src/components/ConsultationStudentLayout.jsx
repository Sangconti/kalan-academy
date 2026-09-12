import { Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  Eye,
  ArrowLeft,
  Home,
  BarChart3,
  Download,
  User,
  Settings
} from "lucide-react";

import { useConsultationStudent } from "../context/ConsultationStudentContext";

export default function ConsultationStudentLayout() {

  const navigate = useNavigate();
  const location = useLocation();

  const {
    studentId,
    studentName,
    loading,
    error
  } = useConsultationStudent();


  function consultationPath(path = "") {
    return `/admin/student/${studentId}/consultation${path}`;
  }


  function handleQuit() {
    navigate(`/admin/student/${studentId}`);
  }


  function isActive(path) {

    const target =
      consultationPath(path);

    if (path === "") {

      return (
        location.pathname ===
        consultationPath("")
      );

    }

    return location.pathname.startsWith(
      target
    );

  }


  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (loading) {

    return (

      <div
        className="
          min-h-screen
          theme-bg
          theme-text
          flex
          items-center
          justify-center
        "
      >

        <div className="text-center px-6">

          <div
            className="
              animate-spin
              rounded-full
              h-10
              w-10
              border-b-2
              border-accent
              mx-auto
              mb-4
            "
          />

          <p
            className="
              theme-text-secondary
              font-medium
            "
          >
            Chargement de la consultation...
          </p>

        </div>

      </div>

    );

  }


  // =====================================================
  // ERREUR
  // =====================================================

  if (error) {

    return (

      <div
        className="
          min-h-screen
          theme-bg
          flex
          items-center
          justify-center
          px-6
        "
      >

        <div
          className="
            max-w-md
            w-full
            theme-surface
            rounded-2xl
            shadow-sm
            border
            theme-border
            p-6
            text-center
          "
        >

          <div
            className="
              w-14
              h-14
              mx-auto
              mb-4
              rounded-2xl
              bg-red-50
              dark:bg-red-950/40
              flex
              items-center
              justify-center
            "
          >

            <Eye
              size={28}
              className="
                text-red-500
                dark:text-red-400
              "
            />

          </div>


          <h1
            className="
              text-lg
              font-bold
              theme-text
              mb-2
            "
          >
            Consultation impossible
          </h1>


          <p
            className="
              text-sm
              theme-text-secondary
              mb-6
            "
          >
            {error}
          </p>


          <button
            type="button"
            onClick={handleQuit}
            className="
              w-full
              rounded-xl
              bg-accent
              text-white
              px-4
              py-3
              font-semibold
              hover:opacity-90
              transition
            "
          >
            Retour à la fiche élève
          </button>

        </div>

      </div>

    );

  }


  return (

    <div
      className="
        min-h-screen
        theme-bg
        theme-text
        pb-24
      "
    >

      {/* =====================================================
          BANDEAU CONSULTATION
      ===================================================== */}

      <div
        className="
          sticky
          top-0
          z-50
          bg-blue-600
          text-white
          shadow-md
        "
      >

        <div
          className="
            max-w-2xl
            mx-auto
            px-4
            py-3
            flex
            items-center
            justify-between
            gap-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
              min-w-0
            "
          >

            <div
              className="
                w-9
                h-9
                rounded-xl
                bg-white/15
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Eye size={19} />
            </div>

            <div className="min-w-0">

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wide
                  opacity-90
                "
              >
                Mode consultation
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  truncate
                "
              >
                {studentName}
              </p>

            </div>

          </div>


          <div
            className="
              flex
              items-center
              gap-2
              shrink-0
            "
          >

            <span
              className="
                hidden
                sm:inline-flex
                text-xs
                bg-white/10
                rounded-lg
                px-2
                py-1
              "
            >
              Lecture seule
            </span>


            <button
              type="button"
              onClick={handleQuit}
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                bg-white/10
                hover:bg-white/20
                px-3
                py-2
                text-xs
                font-semibold
                transition
              "
            >

              <ArrowLeft size={15} />

              Quitter

            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          CONTENU
      ===================================================== */}

      <main
        className="
          max-w-2xl
          mx-auto
          w-full
          p-4
        "
      >

        <Outlet />

      </main>


      {/* =====================================================
          NAVIGATION ÉLÈVE — CONSULTATION
      ===================================================== */}

      <nav
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-40
          theme-surface
          border-t
          theme-border
          shadow-lg
        "
      >

        <div
          className="
            max-w-2xl
            mx-auto
            grid
            grid-cols-5
            h-16
          "
        >

          {/* ACCUEIL */}

          <button
            type="button"
            onClick={() =>
              navigate(
                consultationPath("")
              )
            }
            className={`
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-xs
              transition

              ${
                isActive("")
                  ? "text-accent font-semibold"
                  : "theme-text-secondary hover:text-accent"
              }
            `}
          >

            <Home size={19} />

            <span>
              Accueil
            </span>

          </button>


          {/* PROGRESSION */}

          <button
            type="button"
            onClick={() =>
              navigate(
                consultationPath(
                  "/dashboard"
                )
              )
            }
            className={`
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-xs
              transition

              ${
                isActive("/dashboard")
                  ? "text-accent font-semibold"
                  : "theme-text-secondary hover:text-accent"
              }
            `}
          >

            <BarChart3 size={19} />

            <span>
              Progression
            </span>

          </button>


          {/* TÉLÉCHARGEMENTS */}

          <button
            type="button"
            onClick={() =>
              navigate(
                consultationPath(
                  "/downloads"
                )
              )
            }
            className={`
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-xs
              transition

              ${
                isActive("/downloads")
                  ? "text-accent font-semibold"
                  : "theme-text-secondary hover:text-accent"
              }
            `}
          >

            <Download size={19} />

            <span>
              Téléchargés
            </span>

          </button>


          {/* PROFIL */}

          <button
            type="button"
            onClick={() =>
              navigate(
                consultationPath(
                  "/profile"
                )
              )
            }
            className={`
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-xs
              transition

              ${
                isActive("/profile")
                  ? "text-accent font-semibold"
                  : "theme-text-secondary hover:text-accent"
              }
            `}
          >

            <User size={19} />

            <span>
              Profil
            </span>

          </button>


          {/* PARAMÈTRES */}

          <button
            type="button"
            onClick={() =>
              navigate(
                consultationPath(
                  "/settings"
                )
              )
            }
            className={`
              flex
              flex-col
              items-center
              justify-center
              gap-1
              text-xs
              transition

              ${
                isActive("/settings")
                  ? "text-accent font-semibold"
                  : "theme-text-secondary hover:text-accent"
              }
            `}
          >

            <Settings size={19} />

            <span>
              Paramètres
            </span>

          </button>

        </div>

      </nav>

    </div>

  );

}