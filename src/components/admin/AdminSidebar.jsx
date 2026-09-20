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
  // APERÇU APPLICATION ÉLÈVE
  // =====================================================

  function handleStudentApp() {
    handleClose();

    navigate("/admin/student-preview");
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

          bg-accent-soft
          theme-text

          border-r
          border-accent

          flex
          flex-col

          shadow-2xl
          md:shadow-lg

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

          p-4
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

          <div
            className={`
              flex
              items-center
              gap-3

              min-w-0

              ${
                collapsed
                  ? "md:hidden"
                  : ""
              }
            `}
          >
            <div
              className="
                w-10
                h-10
                shrink-0

                rounded-2xl

                bg-accent
                text-white

                flex
                items-center
                justify-center

                shadow-sm
              "
            >
              <LayoutDashboard size={21} />
            </div>

            <div
              className="
                min-w-0
                overflow-hidden
              "
            >
              <h1
                className="
                  text-lg
                  sm:text-xl
                  font-bold
                  whitespace-nowrap
                  truncate
                  theme-text
                "
              >
                Kalan Admin
              </h1>

              <p
                className="
                  text-xs
                  theme-text-secondary
                  whitespace-nowrap
                "
              >
                Administration
              </p>
            </div>
          </div>

          {/* LOGO EN MODE RÉDUIT */}

          {collapsed && (
            <div
              className="
                hidden
                md:flex

                w-10
                h-10

                rounded-2xl

                bg-accent
                text-white

                items-center
                justify-center

                shadow-sm
              "
            >
              <LayoutDashboard size={21} />
            </div>
          )}

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

              rounded-xl

              theme-text-secondary

              hover:bg-white/70
              dark:hover:bg-gray-950/30

              hover:text-accent

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

              rounded-xl

              theme-text-secondary

              hover:bg-white/70
              dark:hover:bg-gray-950/30

              hover:text-accent

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

                  rounded-xl

                  font-medium

                  transition-all

                  ${
                    isActive
                      ? `
                        bg-accent
                        text-white
                        shadow-sm
                      `
                      : `
                        theme-text
                        hover:bg-white/70
                        dark:hover:bg-gray-950/30
                        hover:text-accent
                      `
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
              border-accent

              pt-5
            "
          >
            <button
              type="button"
              onClick={handleStudentApp}
              title={
                collapsed
                  ? "Aperçu de l'application élève"
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

                rounded-xl

                transition-all

                text-left

                theme-text

                hover:bg-white/70
                dark:hover:bg-gray-950/30

                hover:text-accent
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
                Aperçu de l'application élève
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}