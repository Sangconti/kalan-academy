// src/components/Layout.jsx

import {
  Outlet,
  useNavigate
} from "react-router-dom";

import {
  useState,
  useEffect,
  useRef
} from "react";

import { useUser } from "../hooks/useUser";
import { useNetwork } from "../hooks/useNetwork";

import UserMenu from "./UserMenu";
import BottomNav from "./BottomNav";

import {
  WifiOff,
  ChevronDown
} from "lucide-react";


export default function Layout() {

  const navigate = useNavigate();

  const { user } = useUser();

  const { isOnline } = useNetwork();

  const [openMenu, setOpenMenu] =
    useState(false);

  const menuRef = useRef(null);


  // =====================================================
  // FERMER LE MENU SI CLIC AILLEURS
  // =====================================================

  useEffect(() => {

    function handleClickOutside(event) {

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenu(false);
      }

    }


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);


  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (

    <div
      className="
        min-h-screen
        bg-gray-50
        pb-20
      "
    >


      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className="
          bg-blue-600
          text-white
          px-4
          py-3
          flex
          justify-between
          items-center
          sticky
          top-0
          z-20
          shadow
        "
      >


        {/* LOGO */}

        <button
          type="button"
          onClick={() => {

            setOpenMenu(false);

            navigate("/");

          }}
          className="
            font-bold
            text-xl
            hover:opacity-80
            transition
          "
        >
          🎓 Kalan Academy
        </button>


        {/* MENU UTILISATEUR */}

        <div
          className="relative"
          ref={menuRef}
        >

          <button
            type="button"
            onClick={() =>
              setOpenMenu(
                previous => !previous
              )
            }
            className="
              flex
              items-center
              gap-2
            "
          >

            {!isOnline && (

              <WifiOff
                size={18}
                className="text-yellow-300"
              />

            )}


            <span className="text-sm">

              {
                user?.email
                  ?.split("@")[0]
                || "Invité"
              }

            </span>


            <ChevronDown size={16} />

          </button>


          {/* USER MENU */}

          {openMenu && (

            <div
              className="
                absolute
                right-0
                mt-3
                w-72
                z-[100]
              "
            >

              <UserMenu />

            </div>

          )}

        </div>

      </header>


      {/* =================================================
          CONTENU
      ================================================= */}

      <main
        className="
          max-w-2xl
          mx-auto
          p-4
        "
      >

        <Outlet />

      </main>


      {/* =================================================
          NAVIGATION BASSE
      ================================================= */}

      <BottomNav />

    </div>

  );

}