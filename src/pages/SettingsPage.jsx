// src/pages/SettingsPage.jsx

import {
  Settings,
  User,
  LogOut,
  Bell,
  Globe,
  Wifi,
  WifiOff,
  Trash2,
  RotateCcw,
  Info,
  ChevronRight
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  supabase
} from "../lib/supabase";


// =====================================================
// VERSION APPLICATION
// =====================================================

const APP_VERSION = "1.0.0";


// =====================================================
// COMPOSANT
// =====================================================

export default function SettingsPage() {

  const navigate = useNavigate();

  const [isOnline, setIsOnline] =
    useState(
      typeof navigator !== "undefined"
        ? navigator.onLine
        : true
    );

  const [loggingOut, setLoggingOut] =
    useState(false);


  // ===================================================
  // ÉTAT RÉSEAU
  // ===================================================

  useEffect(() => {

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }


    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );


    return () => {

      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );

    };

  }, []);


  // ===================================================
  // PROFIL
  // ===================================================

  function openProfile() {

    navigate("/profile");

  }


  // ===================================================
  // DÉCONNEXION
  // ===================================================

  async function logout() {

    if (loggingOut) return;

    try {

      setLoggingOut(true);

      const {
        error
      } = await supabase.auth.signOut();


      if (error) {

        console.error(
          "❌ Erreur déconnexion :",
          error
        );

        return;

      }


      navigate("/login");

    } catch (error) {

      console.error(
        "❌ Erreur déconnexion :",
        error
      );

    } finally {

      setLoggingOut(false);

    }

  }


  // ===================================================
  // AFFICHAGE
  // ===================================================

  return (

    <div
      className="
        max-w-3xl
        mx-auto
        px-4
        py-6
        pb-10
      "
    >

      {/* =================================================
          EN-TÊTE
      ================================================= */}

      <div className="mb-7">

        <div
          className="
            w-12
            h-12
            rounded-2xl
            bg-blue-50
            flex
            items-center
            justify-center
            mb-4
          "
        >

          <Settings
            size={25}
            className="text-blue-600"
          />

        </div>


        <p
          className="
            text-sm
            font-medium
            text-blue-600
            mb-1
          "
        >
          Kalan Academy
        </p>


        <h1
          className="
            text-2xl
            md:text-3xl
            font-bold
            text-gray-900
          "
        >
          Paramètres
        </h1>


        <p
          className="
            text-gray-500
            mt-2
          "
        >
          Gère les paramètres de ton application.
        </p>

      </div>


      {/* =================================================
          COMPTE
      ================================================= */}

      <section className="mb-5">

        <h2
          className="
            text-xs
            font-bold
            text-gray-500
            uppercase
            tracking-wider
            mb-2
            px-1
          "
        >
          👤 Compte
        </h2>


        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            overflow-hidden
          "
        >

          {/* MON PROFIL */}

          <button
            type="button"
            onClick={openProfile}
            className="
              w-full
              flex
              items-center
              gap-4
              p-5
              text-left
              hover:bg-gray-50
              transition
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-blue-50
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <User
                size={20}
                className="text-blue-600"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Mon profil
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Consulter et gérer mon profil.
              </p>

            </div>


            <ChevronRight
              size={20}
              className="text-gray-400"
            />

          </button>


          <div
            className="
              border-t
              border-gray-100
            "
          />


          {/* DÉCONNEXION */}

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="
              w-full
              flex
              items-center
              gap-4
              p-5
              text-left
              hover:bg-red-50
              transition
              disabled:opacity-50
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-red-50
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <LogOut
                size={20}
                className="text-red-600"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-red-600
                "
              >
                {loggingOut
                  ? "Déconnexion..."
                  : "Déconnexion"
                }
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Se déconnecter de Kalan Academy.
              </p>

            </div>

          </button>

        </div>

      </section>


      {/* =================================================
          APPLICATION
      ================================================= */}

      <section className="mb-5">

        <h2
          className="
            text-xs
            font-bold
            text-gray-500
            uppercase
            tracking-wider
            mb-2
            px-1
          "
        >
          📱 Application
        </h2>


        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            overflow-hidden
          "
        >

          {/* NOTIFICATIONS */}

          <div
            className="
              flex
              items-center
              gap-4
              p-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-yellow-50
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Bell
                size={20}
                className="text-yellow-600"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Notifications
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Les notifications ne sont pas
                encore configurables.
              </p>

            </div>


            <span
              className="
                text-xs
                font-medium
                text-gray-400
                bg-gray-100
                px-2.5
                py-1
                rounded-full
              "
            >
              Bientôt
            </span>

          </div>


          <div
            className="
              border-t
              border-gray-100
            "
          />


          {/* LANGUE */}

          <div
            className="
              flex
              items-center
              gap-4
              p-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-green-50
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Globe
                size={20}
                className="text-green-600"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Langue
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Français
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          HORS CONNEXION
      ================================================= */}

      <section className="mb-5">

        <h2
          className="
            text-xs
            font-bold
            text-gray-500
            uppercase
            tracking-wider
            mb-2
            px-1
          "
        >
          📴 Hors connexion
        </h2>


        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            overflow-hidden
          "
        >

          {/* ÉTAT SYNCHRONISATION */}

          <div
            className="
              flex
              items-center
              gap-4
              p-5
            "
          >

            <div
              className={`
                w-11
                h-11
                rounded-xl
                flex
                items-center
                justify-center
                shrink-0

                ${
                  isOnline
                    ? "bg-green-50"
                    : "bg-orange-50"
                }
              `}
            >

              {isOnline ? (

                <Wifi
                  size={20}
                  className="text-green-600"
                />

              ) : (

                <WifiOff
                  size={20}
                  className="text-orange-600"
                />

              )}

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                État de synchronisation
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  text-gray-500
                "
              >

                {isOnline
                  ? "Connexion Internet disponible."
                  : "Mode hors connexion actif."
                }

              </p>

            </div>


            <span
              className={`
                text-xs
                font-semibold
                px-2.5
                py-1
                rounded-full

                ${
                  isOnline
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }
              `}
            >

              {isOnline
                ? "En ligne"
                : "Hors ligne"
              }

            </span>

          </div>


          <div
            className="
              border-t
              border-gray-100
            "
          />


          {/* VIDER LE CACHE */}

          <div
            className="
              flex
              items-center
              gap-4
              p-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-gray-100
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Trash2
                size={20}
                className="text-gray-500"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Vider le cache
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Cette fonction sera activée
                avec le gestionnaire de cache.
              </p>

            </div>


            <span
              className="
                text-xs
                font-medium
                text-gray-400
                bg-gray-100
                px-2.5
                py-1
                rounded-full
              "
            >
              Bientôt
            </span>

          </div>

        </div>

      </section>


      {/* =================================================
          APPRENTISSAGE
      ================================================= */}

      <section className="mb-5">

        <h2
          className="
            text-xs
            font-bold
            text-gray-500
            uppercase
            tracking-wider
            mb-2
            px-1
          "
        >
          📚 Apprentissage
        </h2>


        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            overflow-hidden
          "
        >

          {/* RÉINITIALISATION */}

          <div
            className="
              flex
              items-center
              gap-4
              p-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-gray-100
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <RotateCcw
                size={20}
                className="text-gray-500"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Réinitialiser ma progression
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Cette fonction sera activée après
                sécurisation du service de progression.
              </p>

            </div>


            <span
              className="
                text-xs
                font-medium
                text-gray-400
                bg-gray-100
                px-2.5
                py-1
                rounded-full
              "
            >
              Bientôt
            </span>

          </div>

        </div>

      </section>


      {/* =================================================
          À PROPOS
      ================================================= */}

      <section className="mb-5">

        <h2
          className="
            text-xs
            font-bold
            text-gray-500
            uppercase
            tracking-wider
            mb-2
            px-1
          "
        >
          ℹ️ À propos
        </h2>


        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            overflow-hidden
          "
        >

          {/* VERSION */}

          <div
            className="
              flex
              items-center
              gap-4
              p-5
              border-b
              border-gray-100
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-blue-50
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Info
                size={20}
                className="text-blue-600"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Version
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Version actuelle de l'application.
              </p>

            </div>


            <span
              className="
                text-sm
                font-semibold
                text-gray-600
              "
            >
              {APP_VERSION}
            </span>

          </div>


          {/* KALAN ACADEMY */}

          <div
            className="
              flex
              items-center
              gap-4
              p-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-purple-50
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <span className="text-xl">
                🎓
              </span>

            </div>


            <div>

              <h3
                className="
                  font-semibold
                  text-gray-900
                "
              >
                Kalan Academy
              </h3>


              <p
                className="
                  text-sm
                  text-gray-500
                  mt-1
                "
              >
                Plateforme d'apprentissage
                pour les élèves du Mali.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <div
        className="
          text-center
          text-xs
          text-gray-400
          pt-3
        "
      >
        Kalan Academy • Apprendre partout,
        même hors connexion.
      </div>

    </div>

  );

}