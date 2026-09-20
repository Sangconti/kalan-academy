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
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase";

import {
  useNetwork,
} from "../hooks/useNetwork";

import {
  useTheme,
} from "../hooks/useTheme";

import {
  db,
} from "../offline/db";


// =====================================================
// VERSION APPLICATION
// =====================================================

const APP_VERSION = "1.0.0";


// =====================================================
// XP CACHE
// =====================================================

const XP_CACHE_PREFIX = "kalan_xp_cache_";


// =====================================================
// THÈMES
// =====================================================

const THEME_OPTIONS = [
  {
    id: "light",
    label: "Clair",
    description: "Utiliser le thème clair.",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Sombre",
    description: "Utiliser le thème sombre.",
    icon: Moon,
  },
  {
    id: "system",
    label: "Système",
    description: "Suivre le thème de ton appareil.",
    icon: Monitor,
  },
];


// =====================================================
// COULEURS
// =====================================================

const COLOR_OPTIONS = [
  {
    id: "blue",
    label: "Bleu",
    className: "bg-blue-500",
  },
  {
    id: "green",
    label: "Vert",
    className: "bg-green-500",
  },
  {
    id: "purple",
    label: "Violet",
    className: "bg-purple-500",
  },
  {
    id: "orange",
    label: "Orange",
    className: "bg-orange-500",
  },
  {
    id: "pink",
    label: "Rose",
    className: "bg-pink-500",
  },
];


// =====================================================
// COMPOSANT
// =====================================================

export default function SettingsPage() {

  const navigate = useNavigate();

  const location = useLocation();


  const {
    isOnline,
  } = useNetwork();


  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
  } = useTheme();


  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);


  const [
    clearingCache,
    setClearingCache,
  ] = useState(false);


  const [
    resettingProgress,
    setResettingProgress,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState(null);


  // ===================================================
  // MODE APERÇU ADMIN
  // ===================================================

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );


  // ===================================================
  // TIMER MESSAGE
  // ===================================================

  const messageTimeoutRef = useRef(null);


  useEffect(() => {

    return () => {

      if (messageTimeoutRef.current) {

        window.clearTimeout(
          messageTimeoutRef.current
        );

        messageTimeoutRef.current = null;

      }

    };

  }, []);


  // ===================================================
  // PROFIL
  // ===================================================

  function openProfile() {

    if (isStudentPreview) {

      navigate(
        "/admin/student-preview/profile"
      );

      return;

    }


    navigate("/profile");

  }


  // ===================================================
  // MESSAGE
  // ===================================================

  function showMessage(
    type,
    text
  ) {

    if (messageTimeoutRef.current) {

      window.clearTimeout(
        messageTimeoutRef.current
      );

      messageTimeoutRef.current = null;

    }


    setMessage({
      type,
      text,
    });


    messageTimeoutRef.current =
      window.setTimeout(() => {

        setMessage(null);

        messageTimeoutRef.current = null;

      }, 4000);

  }


  // ===================================================
  // DÉCONNEXION
  // ===================================================

  async function logout() {

    if (loggingOut) {
      return;
    }


    try {

      setLoggingOut(true);


      const {
        error,
      } = await supabase.auth.signOut({
        scope: "local",
      });


      if (error) {

        console.error(
          "❌ Erreur déconnexion :",
          error
        );


        if (!isOnline) {
          navigate("/login");
        }


        return;

      }


      navigate("/login");

    } catch (error) {

      console.error(
        "❌ Erreur déconnexion :",
        error
      );


      if (!isOnline) {
        navigate("/login");
      }

    } finally {

      setLoggingOut(false);

    }

  }


  // ===================================================
  // VIDER LE CACHE PÉDAGOGIQUE
  // ===================================================

  async function clearCache() {

    if (clearingCache) {
      return;
    }


    const confirmed =
      window.confirm(

        "Vider le cache ?\n\n" +

        "Les cours, chapitres, leçons, quiz et " +
        "données pédagogiques stockés localement " +
        "seront supprimés.\n\n" +

        "Ta progression, tes tentatives de quiz " +
        "et les données en attente de synchronisation " +
        "seront conservées.\n\n" +

        "Cette action ne supprime pas ton compte."

      );


    if (!confirmed) {
      return;
    }


    try {

      setClearingCache(true);

      setMessage(null);


      await db.transaction(

        "rw",

        [
          db.classes,
          db.subjects,
          db.chapters,
          db.lessons,
          db.lessonBlocks,
          db.exercises,
          db.quizzes,
          db.quizQuestions,
          db.badges,
          db.downloads,
        ],

        async () => {

          await Promise.all([

            db.classes.clear(),

            db.subjects.clear(),

            db.chapters.clear(),

            db.lessons.clear(),

            db.lessonBlocks.clear(),

            db.exercises.clear(),

            db.quizzes.clear(),

            db.quizQuestions.clear(),

            db.badges.clear(),

            db.downloads.clear(),

          ]);

        }

      );


      showMessage(
        "success",
        "Le cache pédagogique a été vidé avec succès."
      );


      console.log(
        "🗑️ Cache pédagogique Kalan Academy supprimé."
      );


    } catch (error) {

      console.error(
        "❌ Impossible de vider le cache :",
        error
      );


      showMessage(
        "error",
        "Impossible de vider le cache."
      );


    } finally {

      setClearingCache(false);

    }

  }


  // ===================================================
  // RÉINITIALISER LA PROGRESSION
  // ===================================================

  async function resetProgress() {

    if (resettingProgress) {
      return;
    }


    const confirmed =
      window.confirm(

        "Réinitialiser ta progression ?\n\n" +

        "Cette action supprimera :\n" +

        "• ta progression des leçons\n" +

        "• tes tentatives de quiz\n" +

        "• ton XP\n\n" +

        "Ton niveau sera remis au niveau 1.\n\n" +

        "Tes badges seront également supprimés.\n\n" +

        (
          isOnline
            ? "Les données enregistrées sur le serveur seront également réinitialisées."
            : "Tu es actuellement hors connexion. Seules les données locales seront réinitialisées."
        ) +

        "\n\nCette action est irréversible."

      );


    if (!confirmed) {
      return;
    }


    try {

      setResettingProgress(true);

      setMessage(null);


      const {
        data,
        error: sessionError,
      } = await supabase.auth.getSession();


      if (sessionError) {

        console.error(
          "❌ Impossible de récupérer la session :",
          sessionError
        );

      }


      const userId =
        data?.session?.user?.id;


      if (!userId) {

        showMessage(
          "error",
          "Utilisateur non identifié."
        );

        return;

      }


      if (isOnline) {

        const {
          data: resetData,
          error: resetError,
        } = await supabase.rpc(
          "reset_my_progress"
        );


        if (resetError) {

          console.error(
            "❌ Erreur réinitialisation serveur :",
            resetError
          );


          showMessage(
            "error",
            resetError.message ||
              "Impossible de réinitialiser ta progression sur le serveur."
          );


          return;

        }


        if (
          !resetData ||
          resetData.success !== true
        ) {

          showMessage(
            "error",
            resetData?.message ||
              "La réinitialisation du serveur a été refusée."
          );


          return;

        }


        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("xp, level")
          .eq("id", userId)
          .maybeSingle();


        if (profileError) {

          console.error(
            "❌ Vérification XP serveur impossible :",
            profileError
          );


          showMessage(
            "error",
            "La réinitialisation a été effectuée, mais sa vérification a échoué."
          );


          return;

        }


        if (
          !profileData ||
          Number(profileData.xp) !== 0 ||
          Number(profileData.level) !== 1
        ) {

          showMessage(
            "error",
            "La progression du serveur n'a pas été correctement remise à zéro."
          );


          return;

        }

      }


      await db.transaction(

        "rw",

        [
          db.userProgress,
          db.quizAttempts,
          db.syncQueue,
        ],

        async () => {

          await Promise.all([

            db.userProgress
              .where("user_id")
              .equals(userId)
              .delete(),

            db.quizAttempts
              .where("user_id")
              .equals(userId)
              .delete(),

            db.syncQueue
              .filter(
                item =>
                  item.table_name ===
                    "user_progress"
                  ||
                  item.table_name ===
                    "quiz_attempts"
                  ||
                  (
                    item.table_name ===
                      "profiles"
                    &&
                    item.action ===
                      "xp"
                  )
              )
              .delete(),

          ]);

        }

      );


      try {

        localStorage.removeItem(
          `${XP_CACHE_PREFIX}${userId}`
        );

      } catch (error) {

        console.warn(
          "⚠️ Impossible de supprimer le cache XP :",
          error
        );

      }


      try {

        localStorage.removeItem(
          `kalan_badges_${userId}`
        );

      } catch (error) {

        console.warn(
          "⚠️ Impossible de supprimer le cache des badges :",
          error
        );

      }


      try {

        sessionStorage.removeItem(
          `kalan_dashboard_${userId}`
        );

      } catch (error) {

        console.warn(
          "⚠️ Impossible de supprimer le cache Dashboard :",
          error
        );

      }


      if (isOnline) {

        showMessage(
          "success",
          "Ta progression a été entièrement réinitialisée."
        );


        window.setTimeout(() => {

          window.location.reload();

        }, 500);

      } else {

        showMessage(
          "success",
          "Ta progression locale a été réinitialisée. Les données du serveur restent inchangées hors connexion."
        );

      }


      console.log(
        "🔄 Progression Kalan Academy réinitialisée."
      );


    } catch (error) {

      console.error(
        "❌ Impossible de réinitialiser la progression :",
        error
      );


      showMessage(
        "error",
        error?.message ||
          "Impossible de réinitialiser la progression."
      );


    } finally {

      setResettingProgress(false);

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

      {message && (

        <div
          className={`
            mb-5
            rounded-2xl
            border
            px-4
            py-3
            flex
            items-center
            gap-3
            ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400"
            }
          `}
        >

          {message.type === "success" ? (

            <Check
              size={18}
              className="shrink-0"
            />

          ) : (

            <AlertTriangle
              size={18}
              className="shrink-0"
            />

          )}


          <p className="text-sm font-medium">
            {message.text}
          </p>

        </div>

      )}


      {/* =================================================
          EN-TÊTE
      ================================================= */}

      <div
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          p-6
          md:p-8
          shadow-lg
          mb-7
        "
      >

        <div
          className="
            absolute
            -right-10
            -top-10
            w-40
            h-40
            rounded-full
            bg-accent
            opacity-10
          "
        />


        <div
          className="
            absolute
            -left-16
            -bottom-20
            w-48
            h-48
            rounded-full
            bg-accent
            opacity-10
          "
        />


        <div
          className="
            absolute
            right-16
            -bottom-24
            w-56
            h-56
            rounded-full
            bg-accent
            opacity-5
          "
        />


        <div
          className="
            relative
            z-10
          "
        >

          <div
            className="
              inline-flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              bg-accent
              text-white
              text-xs
              font-semibold
              mb-4
            "
          >

            <Settings size={14} />

            Kalan Academy

          </div>


          <h1
            className="
              text-2xl
              md:text-3xl
              font-bold
              leading-tight
              theme-text
            "
          >
            Paramètres
          </h1>


          <p
            className="
              theme-text-secondary
              mt-3
              leading-relaxed
              max-w-2xl
            "
          >
            Gère les paramètres et les préférences
            de ton application.
          </p>


          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
              mt-5
            "
          >

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                theme-text
                text-sm
                font-medium
                border
                border-white/50
                dark:border-white/10
              "
            >
              <Settings
                size={16}
                className="text-accent"
              />

              Personnalisation
            </div>


            <div
              className="
                inline-flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                theme-text
                text-sm
                font-medium
                border
                border-white/50
                dark:border-white/10
              "
            >

              {isOnline ? (
                <Wifi
                  size={16}
                  className="text-accent"
                />
              ) : (
                <WifiOff
                  size={16}
                  className="text-accent"
                />
              )}

              {isOnline
                ? "En ligne"
                : "Hors ligne"
              }

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          APPARENCE
      ================================================= */}

      <section className="mb-5">

        <h2
          className="
            text-xs
            font-bold
            uppercase
            tracking-wider
            mb-2
            px-1
            theme-text-secondary
          "
        >
          🎨 Apparence
        </h2>


        <div
          className="
            rounded-3xl
            theme-surface
            theme-border
            border
            shadow-sm
            overflow-hidden
          "
        >

          <div className="p-5 md:p-6">

            <div className="mb-4">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                Thème
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
                "
              >
                Choisis l'apparence de Kalan Academy.
              </p>

            </div>


            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-3
                gap-3
              "
            >

              {THEME_OPTIONS.map((option) => {

                const Icon = option.icon;

                const selected =
                  theme === option.id;


                return (

                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    className={`
                      relative
                      flex
                      flex-col
                      items-center
                      justify-center
                      gap-2
                      p-4
                      rounded-2xl
                      border
                      transition-all
                      ${
                        selected
                          ? "theme-option-selected"
                          : "theme-option theme-border hover:bg-accent-soft"
                      }
                    `}
                  >

                    {selected && (

                      <div
                        className="
                          absolute
                          top-2
                          right-2
                          w-5
                          h-5
                          rounded-full
                          flex
                          items-center
                          justify-center
                          accent-bg
                        "
                      >

                        <Check
                          size={13}
                          className="text-white"
                        />

                      </div>

                    )}


                    <Icon
                      size={22}
                      className={
                        selected
                          ? "theme-accent-text"
                          : "theme-text-secondary"
                      }
                    />


                    <span
                      className="
                        text-sm
                        font-semibold
                        theme-text
                      "
                    >
                      {option.label}
                    </span>


                    <span
                      className="
                        text-xs
                        text-center
                        theme-text-secondary
                      "
                    >
                      {option.description}
                    </span>

                  </button>

                );

              })}

            </div>

          </div>


          <div
            className="
              border-t
              theme-border
            "
          />


          <div className="p-5 md:p-6">

            <div className="mb-4">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                Couleur principale
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
                "
              >
                Choisis la couleur principale de l'application.
              </p>

            </div>


            <div
              className="
                flex
                flex-wrap
                gap-3
              "
            >

              {COLOR_OPTIONS.map((color) => {

                const selected =
                  accentColor === color.id;


                return (

                  <button
                    key={color.id}
                    type="button"
                    onClick={() =>
                      setAccentColor(color.id)
                    }
                    title={color.label}
                    aria-label={`Couleur ${color.label}`}
                    className={`
                      relative
                      w-12
                      h-12
                      rounded-full
                      ${color.className}
                      transition-all
                      ${
                        selected
                          ? "ring-4 ring-offset-2 ring-accent scale-110"
                          : "hover:scale-105"
                      }
                    `}
                  >

                    {selected && (

                      <Check
                        size={20}
                        className="
                          absolute
                          inset-0
                          m-auto
                          text-white
                          drop-shadow
                        "
                      />

                    )}

                  </button>

                );

              })}

            </div>


            <p
              className="
                text-xs
                mt-4
                theme-text-secondary
              "
            >
              Couleur sélectionnée :{" "}

              <span
                className="
                  font-semibold
                  theme-accent-text
                "
              >
                {
                  COLOR_OPTIONS.find(
                    (color) =>
                      color.id === accentColor
                  )?.label
                }
              </span>

            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          COMPTE
      ================================================= */}

      <section className="mb-5">

        <h2
          className="
            text-xs
            font-bold
            uppercase
            tracking-wider
            mb-2
            px-1
            theme-text-secondary
          "
        >
          👤 Compte
        </h2>


        <div
          className="
            rounded-3xl
            theme-surface
            theme-border
            border
            shadow-sm
            overflow-hidden
          "
        >

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
              hover:bg-accent-soft
              transition
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <User
                size={20}
                className="text-accent"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                Mon profil
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
                "
              >
                Consulter et gérer mon profil.
              </p>

            </div>


            <ChevronRight
              size={20}
              className="theme-text-secondary"
            />

          </button>


          <div
            className="
              border-t
              theme-border
            "
          />


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
              dark:hover:bg-red-950/20
              transition
              disabled:opacity-50
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-red-50
                dark:bg-red-950/30
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              {loggingOut ? (

                <Loader2
                  size={20}
                  className="
                    text-red-600
                    dark:text-red-400
                    animate-spin
                  "
                />

              ) : (

                <LogOut
                  size={20}
                  className="
                    text-red-600
                    dark:text-red-400
                  "
                />

              )}

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  text-red-600
                  dark:text-red-400
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
                  mt-1
                  theme-text-secondary
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
            uppercase
            tracking-wider
            mb-2
            px-1
            theme-text-secondary
          "
        >
          📱 Application
        </h2>


        <div
          className="
            rounded-3xl
            theme-surface
            theme-border
            border
            shadow-sm
            overflow-hidden
          "
        >

          <div className="flex items-center gap-4 p-5">

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Bell
                size={20}
                className="text-accent"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                Notifications
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
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
                theme-text-secondary
                bg-accent-soft
                px-2.5
                py-1
                rounded-full
                border
                theme-border
              "
            >
              Bientôt
            </span>

          </div>


          <div
            className="
              border-t
              theme-border
            "
          />


          <div className="flex items-center gap-4 p-5">

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Globe
                size={20}
                className="text-accent"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                Langue
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
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
            uppercase
            tracking-wider
            mb-2
            px-1
            theme-text-secondary
          "
        >
          📴 Hors connexion
        </h2>


        <div
          className="
            rounded-3xl
            theme-surface
            theme-border
            border
            shadow-sm
            overflow-hidden
          "
        >

          <div className="flex items-center gap-4 p-5">

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              {isOnline ? (

                <Wifi
                  size={20}
                  className="text-accent"
                />

              ) : (

                <WifiOff
                  size={20}
                  className="text-accent"
                />

              )}

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                État de synchronisation
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
                "
              >
                {isOnline
                  ? "Connexion Internet disponible."
                  : "Mode hors connexion actif."
                }
              </p>

            </div>


            <span
              className="
                text-xs
                font-semibold
                px-2.5
                py-1
                rounded-full
                bg-accent-soft
                text-accent
                border
                border-accent
              "
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
              theme-border
            "
          />


          <button
            type="button"
            onClick={clearCache}
            disabled={clearingCache}
            className="
              w-full
              flex
              items-center
              gap-4
              p-5
              text-left
              hover:bg-accent-soft
              transition
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              {clearingCache ? (

                <Loader2
                  size={20}
                  className="
                    text-accent
                    animate-spin
                  "
                />

              ) : (

                <Trash2
                  size={20}
                  className="text-accent"
                />

              )}

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                {clearingCache
                  ? "Vidage du cache..."
                  : "Vider le cache"
                }
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
                "
              >
                Supprimer les données pédagogiques
                stockées localement sans supprimer
                ta progression.
              </p>

            </div>


            {!clearingCache && (

              <ChevronRight
                size={20}
                className="theme-text-secondary"
              />

            )}

          </button>

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
            uppercase
            tracking-wider
            mb-2
            px-1
            theme-text-secondary
          "
        >
          📚 Apprentissage
        </h2>


        <div
          className="
            rounded-3xl
            theme-surface
            theme-border
            border
            shadow-sm
            overflow-hidden
          "
        >

          <button
            type="button"
            onClick={resetProgress}
            disabled={resettingProgress}
            className="
              w-full
              flex
              items-center
              gap-4
              p-5
              text-left
              hover:bg-orange-50
              dark:hover:bg-orange-950/20
              transition
              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-orange-50
                dark:bg-orange-950/30
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              {resettingProgress ? (

                <Loader2
                  size={20}
                  className="
                    text-orange-600
                    dark:text-orange-400
                    animate-spin
                  "
                />

              ) : (

                <RotateCcw
                  size={20}
                  className="
                    text-orange-600
                    dark:text-orange-400
                  "
                />

              )}

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                {resettingProgress
                  ? "Réinitialisation..."
                  : "Réinitialiser ma progression"
                }
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
                "
              >
                Supprimer ma progression locale,
                mes tentatives de quiz et mon cache XP.
              </p>

            </div>


            {!resettingProgress && (

              <ChevronRight
                size={20}
                className="theme-text-secondary"
              />

            )}

          </button>

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
            uppercase
            tracking-wider
            mb-2
            px-1
            theme-text-secondary
          "
        >
          ℹ️ À propos
        </h2>


        <div
          className="
            rounded-3xl
            theme-surface
            theme-border
            border
            shadow-sm
            overflow-hidden
          "
        >

          <div
            className="
              flex
              items-center
              gap-4
              p-5
              border-b
              theme-border
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >

              <Info
                size={20}
                className="text-accent"
              />

            </div>


            <div className="flex-1">

              <h3
                className="
                  font-semibold
                  theme-text
                "
              >
                Version
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
                "
              >
                Version actuelle de l'application.
              </p>

            </div>


            <span
              className="
                text-sm
                font-semibold
                theme-text-secondary
              "
            >
              {APP_VERSION}
            </span>

          </div>


          <div className="flex items-center gap-4 p-5">

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-accent-soft
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
                  theme-text
                "
              >
                Kalan Academy
              </h3>


              <p
                className="
                  text-sm
                  mt-1
                  theme-text-secondary
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
          theme-text-secondary
          pt-3
        "
      >
        Kalan Academy • Apprendre partout,
        même hors connexion.
      </div>

    </div>

  );

}