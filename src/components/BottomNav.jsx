// src/components/BottomNav.jsx

import {
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  Home,
  Settings,
  BarChart3,
  Download,
  User
} from "lucide-react";

export default function BottomNav() {

  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // NAVIGATION
  // =====================================================

  const items = [

    {
      path: "/",
      label: "Accueil",
      icon: Home
    },

    {
      path: "/settings",
      label: "Paramètres",
      icon: Settings
    },

    {
      path: "/dashboard",
      label: "Progression",
      icon: BarChart3
    },

    {
      path: "/downloads",
      label: "Téléchargés",
      icon: Download
    },

    {
      path: "/profile",
      label: "Profil",
      icon: User
    }

  ];

  // =====================================================
  // ÉTAT ACTIF
  // =====================================================

  function isActive(item) {

    // Accueil
    if (item.path === "/") {

      return location.pathname === "/";

    }

    // Autres pages
    return location.pathname.startsWith(
      item.path
    );

  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  function handleNavigation(item) {

    navigate(item.path);

  }

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-30
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

        {items.map((item) => {

          const Icon = item.icon;

          const active =
            isActive(item);

          return (

            <button
              key={item.path}
              type="button"
              onClick={() =>
                handleNavigation(item)
              }
              className={`
                flex
                flex-col
                items-center
                justify-center
                gap-1
                text-xs
                transition
                active:scale-95

                ${
                  active
                    ? "text-accent font-semibold"
                    : "theme-text-secondary hover:text-accent"
                }
              `}
            >

              <Icon
                size={21}
                strokeWidth={
                  active ? 2.5 : 2
                }
              />

              <span>
                {item.label}
              </span>

            </button>

          );

        })}

      </div>

    </nav>

  );

}