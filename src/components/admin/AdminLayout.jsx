import { useEffect, useState } from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";


export default function AdminLayout({ children }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);


  // ==========================================
  // FERMER LE MENU AVEC ESCAPE
  // ==========================================

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


  // ==========================================
  // BLOQUER LE SCROLL MOBILE QUAND LE MENU
  // EST OUVERT
  // ==========================================

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


  return (

    <div className="
      flex
      min-h-screen
      bg-gray-100
      overflow-x-hidden
    ">


      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />


      {/* ==========================================
          CONTENU PRINCIPAL
      ========================================== */}

      <div className="
        flex-1
        min-w-0
        w-full
      ">


        {/* ==========================================
            BOUTON MENU MOBILE
        ========================================== */}

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
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
            transition
            md:hidden
          "
        >

          <span className="text-2xl leading-none">
            ☰
          </span>

        </button>


        {/* ==========================================
            HEADER
        ========================================== */}

        <AdminHeader />


        {/* ==========================================
            CONTENU
        ========================================== */}

        <main className="
          p-4
          sm:p-5
          md:p-6
          pt-20
          md:pt-6
          w-full
          min-w-0
        ">

          {children}

        </main>


      </div>


    </div>

  );

}