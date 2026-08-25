import { useEffect, useState } from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout({ children }) {

  // =====================================================
  // ÉTAT SIDEBAR
  // =====================================================

  // Mobile :
  // false = fermée
  // true  = ouverte

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop :
  // false = sidebar normale
  // true  = sidebar réduite

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);


  // =====================================================
  // FERMER AVEC ESCAPE
  // =====================================================

  useEffect(() => {

    function handleEscape(event) {

      if (event.key === "Escape") {
        setSidebarOpen(false);
      }

    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {

      document.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, []);


  // =====================================================
  // BLOQUER LE SCROLL SUR MOBILE
  // =====================================================

  useEffect(() => {

    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };

  }, [sidebarOpen]);


  // =====================================================
  // BASCULER LA SIDEBAR DESKTOP
  // =====================================================

  function toggleSidebar() {

    setSidebarCollapsed(
      (previous) => !previous
    );

  }


  return (

    <div
      className="
        min-h-screen
        w-full
        bg-gray-100
        overflow-x-hidden
      "
    >

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <AdminSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={toggleSidebar}
      />


      {/* ==================================================
          CONTENU PRINCIPAL
      ================================================== */}

      <div
        className={`
          min-h-screen
          w-full

          transition-[margin]
          duration-300
          ease-in-out

          ${
            sidebarCollapsed
              ? "md:ml-20"
              : "md:ml-64"
          }
        `}
      >

        {/* ==================================================
            BOUTON MENU MOBILE
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            setSidebarOpen(true)
          }
          aria-label="Ouvrir le menu"
          aria-expanded={sidebarOpen}
          className="
            fixed

            top-4
            left-4

            z-40

            flex
            items-center
            justify-center

            w-11
            h-11

            rounded-xl

            bg-slate-900
            text-white

            shadow-lg

            hover:bg-slate-700
            active:scale-95

            transition

            md:hidden
          "
        >

          <span
            className="
              text-2xl
              leading-none
            "
          >
            ☰
          </span>

        </button>


        {/* ==================================================
            HEADER
        ================================================== */}

        <AdminHeader />


        {/* ==================================================
            CONTENU
        ================================================== */}

        <main
          className="
            w-full
            min-w-0

            p-4
            sm:p-5
            md:p-6

            pt-20
            md:pt-6

            overflow-x-hidden
          "
        >

          {children}

        </main>

      </div>

    </div>

  );
}