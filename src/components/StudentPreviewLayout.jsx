import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Home,
  BarChart3,
  Download,
  User,
  Settings,
  ArrowLeft,
} from "lucide-react";


export default function StudentPreviewLayout() {

  const navigate = useNavigate();
  const location = useLocation();


  // =====================================================
  // BASE DE L'APERÇU
  // =====================================================

  const basePath = "/admin/student-preview";


  // =====================================================
  // NAVIGATION
  // =====================================================

  function goHome() {

    navigate(basePath);

  }


  function goDashboard() {

    navigate(`${basePath}/dashboard`);

  }


  function goDownloads() {

    navigate(`${basePath}/downloads`);

  }


  function goProfile() {

    navigate(`${basePath}/profile`);

  }


  function goSettings() {

    navigate(`${basePath}/settings`);

  }


  function leavePreview() {

    navigate("/admin");

  }


  // =====================================================
  // NAVIGATION ACTIVE
  // =====================================================

  const isHome =
    location.pathname === basePath ||
    location.pathname === `${basePath}/`;

  const isDashboard =
    location.pathname.startsWith(
      `${basePath}/dashboard`
    );

  const isDownloads =
    location.pathname.startsWith(
      `${basePath}/downloads`
    );

  const isProfile =
    location.pathname.startsWith(
      `${basePath}/profile`
    );

  const isSettings =
    location.pathname.startsWith(
      `${basePath}/settings`
    );


  return (

    <div
      className="
        min-h-screen
        theme-bg
        theme-text
        pb-20
      "
    >

      {/* =================================================
          BANDEAU APERÇU
      ================================================= */}

      <div
        className="
          sticky
          top-0
          z-40

          bg-blue-600
          text-white

          px-4
          py-2.5

          shadow-md
        "
      >

        <div
          className="
            max-w-2xl
            mx-auto

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
              gap-2
              min-w-0
            "
          >

            <span
              className="
                text-lg
                shrink-0
              "
            >
              👁️
            </span>

            <div className="min-w-0">

              <p
                className="
                  text-sm
                  font-bold
                  truncate
                "
              >
                Aperçu de l'application élève
              </p>

              <p
                className="
                  text-xs
                  text-blue-100
                "
              >
                Vue générale — aucune donnée élève ne sera modifiée
              </p>

            </div>

          </div>


          {/* RETOUR ADMIN */}

          <button
            type="button"
            onClick={leavePreview}
            className="
              shrink-0

              flex
              items-center
              gap-1.5

              px-3
              py-1.5

              rounded-lg

              bg-white/15
              hover:bg-white/25

              text-xs
              font-semibold

              transition
            "
          >

            <ArrowLeft size={15} />

            <span>
              Admin
            </span>

          </button>

        </div>

      </div>


      {/* =================================================
          CONTENU
      ================================================= */}

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


      {/* =================================================
          NAVIGATION BASSE
      ================================================= */}

      <nav
        className="
          fixed
          bottom-0
          left-0
          right-0

          z-30

          bg-white
          dark:bg-slate-900

          border-t
          border-gray-200
          dark:border-slate-700

          shadow-lg
        "
      >

        <div
          className="
            max-w-2xl
            mx-auto

            grid
            grid-cols-5
          "
        >

          {/* ACCUEIL */}

          <button
            type="button"
            onClick={goHome}
            className={`
              flex
              flex-col
              items-center
              justify-center

              gap-1

              py-2

              text-xs
              font-medium

              transition

              ${
                isHome
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }
            `}
          >

            <Home size={20} />

            <span>
              Accueil
            </span>

          </button>


          {/* PROGRESSION */}

          <button
            type="button"
            onClick={goDashboard}
            className={`
              flex
              flex-col
              items-center
              justify-center

              gap-1

              py-2

              text-xs
              font-medium

              transition

              ${
                isDashboard
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }
            `}
          >

            <BarChart3 size={20} />

            <span>
              Progression
            </span>

          </button>


          {/* TÉLÉCHARGEMENTS */}

          <button
            type="button"
            onClick={goDownloads}
            className={`
              flex
              flex-col
              items-center
              justify-center

              gap-1

              py-2

              text-xs
              font-medium

              transition

              ${
                isDownloads
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }
            `}
          >

            <Download size={20} />

            <span>
              Téléchargés
            </span>

          </button>


          {/* PROFIL */}

          <button
            type="button"
            onClick={goProfile}
            className={`
              flex
              flex-col
              items-center
              justify-center

              gap-1

              py-2

              text-xs
              font-medium

              transition

              ${
                isProfile
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }
            `}
          >

            <User size={20} />

            <span>
              Profil
            </span>

          </button>


          {/* PARAMÈTRES */}

          <button
            type="button"
            onClick={goSettings}
            className={`
              flex
              flex-col
              items-center
              justify-center

              gap-1

              py-2

              text-xs
              font-medium

              transition

              ${
                isSettings
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }
            `}
          >

            <Settings size={20} />

            <span>
              Paramètres
            </span>

          </button>

        </div>

      </nav>

    </div>
  );
}