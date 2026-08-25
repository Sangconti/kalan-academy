import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  BarChart3,
  Settings,
  GraduationCap,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";


const menu = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Utilisateurs",
    path: "/admin/users",
    icon: Users,
  },
  {
    name: "Matières",
    path: "/admin/subjects",
    icon: BookOpen,
  },
  {
    name: "Vidéos",
    path: "/admin/videos",
    icon: Video,
  },
  {
    name: "Statistiques",
    path: "/admin/stats",
    icon: BarChart3,
  },
  {
    name: "Paramètres",
    path: "/admin/settings",
    icon: Settings,
  },
];


export default function AdminSidebar({
  open = false,
  collapsed = false,
  onClose,
  onToggleCollapse,
}) {

  const navigate = useNavigate();


  // =====================================================
  // FERMER
  // =====================================================

  function handleClose() {

    if (onClose) {
      onClose();
    }

  }


  // =====================================================
  // NAVIGATION
  // =====================================================

  function handleNavigation() {

    handleClose();

  }


  // =====================================================
  // VOIR APPLICATION ÉLÈVE
  // =====================================================

  function handleStudentApp() {

    handleClose();

    navigate("/");

  }


  return (

    <>

      {/* ==================================================
          OVERLAY MOBILE
      ================================================== */}

      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`
          fixed
          inset-0
          z-40

          bg-black/50

          transition-opacity
          duration-300

          md:hidden

          ${
            open
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none"
          }
        `}
      />


      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0

          z-50

          bg-slate-900
          text-white

          flex
          flex-col

          shadow-2xl
          md:shadow-none

          transform

          transition-all
          duration-300
          ease-in-out

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          md:translate-x-0

          ${
            collapsed
              ? "md:w-20"
              : "md:w-64"
          }

          w-64

          p-5
        `}
      >

        {/* ==================================================
            EN-TÊTE
        ================================================== */}

        <div
          className={`
            flex
            items-center

            mb-8

            ${
              collapsed
                ? "md:justify-center"
                : "justify-between"
            }
          `}
        >

          {/* NOM ADMIN */}

          <h1
            className={`
              text-xl
              sm:text-2xl

              font-bold

              whitespace-nowrap

              overflow-hidden

              transition-all
              duration-300

              ${
                collapsed
                  ? "md:w-0 md:opacity-0"
                  : "w-auto opacity-100"
              }
            `}
          >
            Kalan Admin
          </h1>


          {/* ==================================================
              BOUTON FERMER MOBILE
          ================================================== */}

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer le menu"
            className="
              flex
              items-center
              justify-center

              w-9
              h-9

              rounded-lg

              text-slate-300

              hover:bg-slate-700
              hover:text-white

              transition

              md:hidden
            "
          >

            <X size={22} />

          </button>


          {/* ==================================================
              BOUTON RÉDUIRE DESKTOP
          ================================================== */}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={
              collapsed
                ? "Agrandir le menu"
                : "Réduire le menu"
            }
            title={
              collapsed
                ? "Agrandir le menu"
                : "Réduire le menu"
            }
            className={`
              hidden
              md:flex

              items-center
              justify-center

              w-9
              h-9

              rounded-lg

              text-slate-300

              hover:bg-slate-700
              hover:text-white

              transition

              ${
                collapsed
                  ? ""
                  : "ml-auto"
              }
            `}
          >

            {collapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}

          </button>

        </div>


        {/* ==================================================
            MENU PRINCIPAL
        ================================================== */}

        <nav className="space-y-2">

          {menu.map((item) => {

            const Icon = item.icon;

            return (

              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/admin"}
                onClick={handleNavigation}
                title={
                  collapsed
                    ? item.name
                    : undefined
                }
                className={({ isActive }) => `
                  flex
                  items-center

                  ${
                    collapsed
                      ? "md:justify-center"
                      : "gap-3"
                  }

                  gap-3

                  p-3

                  rounded-lg

                  transition

                  ${
                    isActive
                      ? "bg-slate-700"
                      : "hover:bg-slate-700"
                  }
                `}
              >

                <Icon
                  size={20}
                  className="shrink-0"
                />


                {/* TEXTE */}

                <span
                  className={`
                    whitespace-nowrap
                    overflow-hidden

                    transition-all
                    duration-300

                    ${
                      collapsed
                        ? "md:w-0 md:opacity-0"
                        : "w-auto opacity-100"
                    }
                  `}
                >
                  {item.name}
                </span>

              </NavLink>

            );

          })}

        </nav>


        {/* ==================================================
            ESPACE ÉLÈVE
        ================================================== */}

        <div className="mt-auto pt-6">

          <div
            className="
              border-t
              border-slate-700

              pt-5
            "
          >

            <button
              type="button"
              onClick={handleStudentApp}
              title={
                collapsed
                  ? "Voir l'application élève"
                  : undefined
              }
              className={`
                w-full

                flex
                items-center

                ${
                  collapsed
                    ? "md:justify-center"
                    : "gap-3"
                }

                gap-3

                p-3

                rounded-lg

                transition

                text-left
                text-slate-200

                hover:bg-slate-700
                hover:text-white
              `}
            >

              <GraduationCap
                size={20}
                className="shrink-0"
              />


              {/* TEXTE */}

              <span
                className={`
                  whitespace-nowrap
                  overflow-hidden

                  transition-all
                  duration-300

                  ${
                    collapsed
                      ? "md:w-0 md:opacity-0"
                      : "w-auto opacity-100"
                  }
                `}
              >
                Voir l'application élève
              </span>

            </button>

          </div>

        </div>

      </aside>

    </>
  );
}
