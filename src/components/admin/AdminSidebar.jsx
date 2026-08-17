import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  BarChart3,
  Settings,
  GraduationCap,
  X
} from "lucide-react";

import {
  NavLink,
  useNavigate
} from "react-router-dom";

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
    name: "Matières",
    path: "/admin/subjects",
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

export default function AdminSidebar({
  open = false,
  onClose
}) {
  const navigate = useNavigate();

  // ==========================================
  // FERMER
  // ==========================================

  function handleClose() {
    if (onClose) {
      onClose();
    }
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  function handleNavigation() {
    handleClose();
  }

  return (
    <>
      {/* ==========================================
          OVERLAY MOBILE
      ========================================== */}

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

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0

          z-50

          w-64

          bg-slate-900
          text-white

          p-5

          flex
          flex-col

          shadow-2xl

          transform
          transition-transform
          duration-300
          ease-in-out

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          md:translate-x-0
          md:shadow-none
        `}
      >

        {/* ==========================================
            EN-TÊTE
        ========================================== */}

        <div
          className="
            flex
            items-center
            justify-between

            mb-8
          "
        >

          <h1
            className="
              text-xl
              sm:text-2xl
              font-bold
              whitespace-nowrap
            "
          >
            Kalan Admin
          </h1>

          {/* ========================================
              FERMER MOBILE
          ======================================== */}

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

        </div>

        {/* ==========================================
            MENU
        ========================================== */}

        <nav className="space-y-2">

          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/admin"}
                onClick={handleNavigation}
                className={({ isActive }) => `
                  flex
                  items-center
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

                <Icon size={20} />

                <span>
                  {item.name}
                </span>

              </NavLink>
            );
          })}

        </nav>

        {/* ==========================================
            ESPACE ÉLÈVE
        ========================================== */}

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
              onClick={() => {
                handleClose();
                navigate("/");
              }}
              className="
                w-full

                flex
                items-center
                gap-3

                p-3

                rounded-lg

                transition

                text-left
                text-slate-200

                hover:bg-slate-700
                hover:text-white
              "
            >

              <GraduationCap size={20} />

              <span>
                Voir l'application élève
              </span>

            </button>

          </div>

        </div>

      </aside>
    </>
  );
}