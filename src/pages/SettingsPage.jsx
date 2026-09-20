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
  useOutletContext,
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
  clearLocalUserProgress,
  setLocalProgressResetVersion,
} from "../offline/db";

const APP_VERSION = "1.0.0";

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

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { isOnline } = useNetwork();

  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
  } = useTheme();

  /*
   * =====================================================
   * CONTEXTE DE CONSULTATION
   * =====================================================
   *
   * ConsultationStudentLayout transmet :
   *
   * {
   *   consultationMode: true,
   *   studentId,
   *   studentName,
   *   student
   * }
   *
   * En mode normal ou dans StudentPreviewLayout,
   * aucun contexte n'est fourni.
   */

  const outletContext =
    useOutletContext() || {};

  const {
    consultationMode = false,
    studentId: consultationStudentId = null,
  } = outletContext;

  /*
   * =====================================================
   * MODES ADMINISTRATEUR
   * =====================================================
   */

  const isStudentPreview =
    location.pathname.startsWith(
      "/admin/student-preview"
    );

  const isConsultation =
    consultationMode ||
    location.pathname.includes(
      "/consultation"
    );

  /*
   * Toute action destructive sur la progression
   * est interdite dans les interfaces administrateur.
   *
   * - Aperçu général : aucune donnée élève
   * - Consultation : lecture seule
   */

  const canResetProgress =
    !isStudentPreview &&
    !isConsultation;

  /*
   * Cet identifiant sert uniquement au contexte
   * de navigation de consultation.
   *
   * Il n'est JAMAIS utilisé pour réinitialiser
   * une progression depuis cette page.
   */

  void consultationStudentId;

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [clearingCache, setClearingCache] =
    useState(false);

  const [resettingProgress, setResettingProgress] =
    useState(false);

  const [message, setMessage] =
    useState(null);

  const messageTimeoutRef =
    useRef(null);

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

  /*
   * =====================================================
   * PROFIL
   * =====================================================
   */

  function openProfile() {
    if (isStudentPreview) {
      navigate(
        "/admin/student-preview/profile"
      );

      return;
    }

    if (isConsultation) {
      navigate(
        `/admin/student/${consultationStudentId}/consultation/profile`
      );

      return;
    }

    navigate("/profile");
  }

  /*
   * =====================================================
   * MESSAGES
   * =====================================================
   */

  function showMessage(type, text) {
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

  /*
   * =====================================================
   * DÉCONNEXION
   * =====================================================
   */

  async function logout() {
    if (loggingOut) return;

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

  /*
   * =====================================================
   * VIDER LE CACHE
   * =====================================================
   */

  async function clearCache() {
    if (clearingCache) return;

    const confirmed = window.confirm(
      "Vider le cache ?\n\n" +
        "Les cours, chapitres, leçons, quiz et " +
        "données pédagogiques stockés localement " +
        "seront supprimés.\n\n" +
        "Ta progression, tes tentatives de quiz " +
        "et les données en attente de synchronisation " +
        "seront conservées.\n\n" +
        "Cette action ne supprime pas ton compte."
    );

    if (!confirmed) return;

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

  /*
   * =====================================================
   * RÉINITIALISER LA PROGRESSION
   * =====================================================
   *
   * Cette fonction est disponible uniquement
   * pour l'élève réellement connecté.
   *
   * Elle est interdite :
   *
   * - dans l'aperçu admin ;
   * - dans la consultation.
   *
   * Elle utilise reset_my_progress(), qui ne peut
   * réinitialiser que la progression de auth.uid().
   */

  async function resetProgress() {
    if (resettingProgress) return;

    /*
     * Sécurité supplémentaire :
     * aucune réinitialisation dans les interfaces
     * administrateur.
     */

    if (!canResetProgress) {
      showMessage(
        "error",
        "La réinitialisation de la progression n'est pas disponible dans cette interface."
      );

      return;
    }

    const confirmed = window.confirm(
      "Réinitialiser ta progression ?\n\n" +
        "Cette action supprimera :\n" +
        "• ta progression des leçons\n" +
        "• tes tentatives de quiz\n" +
        "• ton XP\n" +
        "• tes badges\n\n" +
        "Ton niveau sera remis au niveau 1.\n\n" +
        (isOnline
          ? "Les données enregistrées sur le serveur seront également réinitialisées."
          : "Tu es actuellement hors connexion. Seules les données locales seront réinitialisées.") +
        "\n\nCette action est irréversible."
    );

    if (!confirmed) return;

    try {
      setResettingProgress(true);
      setMessage(null);

      /*
       * =================================================
       * VÉRIFICATION SESSION
       * =================================================
       */

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

      /*
       * =================================================
       * DOUBLE SÉCURITÉ ADMIN
       * =================================================
       */

      if (
        isStudentPreview ||
        isConsultation ||
        location.pathname.startsWith("/admin/")
      ) {
        showMessage(
          "error",
          "Cette action n'est pas disponible dans l'espace administrateur."
        );

        return;
      }

      /*
       * =================================================
       * RESET SERVEUR
       * =================================================
       */

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

        /*
         * La RPC retourne la nouvelle version.
         *
         * On l'enregistre immédiatement localement
         * avant de supprimer la progression locale.
         */

        const serverResetVersion =
          Number(
            resetData.progress_reset_version
          ) || 0;

        setLocalProgressResetVersion(
          userId,
          serverResetVersion
        );

        console.log(
          "✅ Réinitialisation serveur confirmée :",
          {
            userId,
            progressResetVersion:
              serverResetVersion,
          }
        );
      }

      /*
       * =================================================
       * RESET LOCAL
       * =================================================
       *
       * Supprime :
       * - userProgress
       * - quizAttempts
       * - anciennes opérations sync
       * - cache XP
       *
       * Les contenus pédagogiques et téléchargements
       * restent intacts.
       */

      await clearLocalUserProgress(
        userId
      );

      /*
       * =================================================
       * CACHES UI COMPLÉMENTAIRES
       * =================================================
       */

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

      /*
       * =================================================
       * SUCCÈS
       * =================================================
       */

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
        "🔄 Progression Kalan Academy réinitialisée :",
        userId
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

  return (
    <div
      className="
        min-h-full
        max-w-3xl
        mx-auto
        px-4
        py-6
        pb-10
        theme-bg
        theme-text
      "
    >
      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {message && (
        <div
          className={`
            mb-5
            rounded-2xl
            border
            px-4
            py-3
            flex
            items-start
            gap-3
            shadow-sm

            ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/60 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300"
            }
          `}
        >
          {message.type === "success" ? (
            <Check
              size={20}
              className="shrink-0 mt-0.5"
            />
          ) : (
            <AlertTriangle
              size={20}
              className="shrink-0 mt-0.5"
            />
          )}

          <p className="text-sm font-medium">
            {message.text}
          </p>
        </div>
      )}

      {/* =====================================================
          EN-TÊTE
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-accent-soft
          border
          border-accent
          shadow-lg
          p-6
          mb-8
        "
      >
        <div
          className="
            absolute
            -top-12
            -right-12
            w-32
            h-32
            rounded-full
            bg-accent
            opacity-10
          "
        />

        <div
          className="
            absolute
            -bottom-16
            -left-10
            w-32
            h-32
            rounded-full
            bg-accent
            opacity-10
          "
        />

        <div className="relative">
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-accent
              text-white
              px-3
              py-1.5
              text-xs
              font-semibold
              mb-4
            "
          >
            <Settings size={15} />

            <span>
              Kalan Academy
            </span>
          </div>

          <h1
            className="
              text-2xl
              sm:text-3xl
              font-bold
              theme-text
            "
          >
            Paramètres
          </h1>

          <p
            className="
              mt-2
              text-sm
              sm:text-base
              theme-text-secondary
            "
          >
            Gère les paramètres et les préférences
            de ton application.
          </p>

          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-2
            "
          >
            <span
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                px-3
                py-2
                text-xs
                font-medium
                theme-text
              "
            >
              <Settings size={14} />
              Personnalisation
            </span>

            <span
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white/70
                dark:bg-gray-950/30
                px-3
                py-2
                text-xs
                font-medium
                theme-text
              "
            >
              {isOnline ? (
                <Wifi
                  size={14}
                  className="text-green-500"
                />
              ) : (
                <WifiOff
                  size={14}
                  className="text-orange-500"
                />
              )}

              {isOnline
                ? "En ligne"
                : "Hors connexion"}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          APPARENCE
      ===================================================== */}

      <section className="mb-8">
        <h2
          className="
            text-lg
            font-bold
            theme-text
            mb-3
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
          <div className="p-5">
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
                  theme-text-secondary
                  mt-1
                "
              >
                Choisis l'apparence de Kalan Academy.
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-3
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
                    aria-pressed={selected}
                    onClick={() =>
                      setTheme(option.id)
                    }
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
                          ? "bg-accent-soft border-accent shadow-sm"
                          : "theme-surface theme-border theme-text hover:bg-accent-soft"
                      }
                    `}
                  >
                    {selected && (
                      <span
                        className="
                          absolute
                          top-2
                          right-2
                          w-5
                          h-5
                          rounded-full
                          bg-accent
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Check
                          size={12}
                          className="text-white"
                        />
                      </span>
                    )}

                    <Icon
                      size={22}
                      className={
                        selected
                          ? "text-accent"
                          : "theme-text-secondary"
                      }
                    />

                    <span
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      {option.label}
                    </span>

                    <span
                      className="
                        hidden
                        sm:block
                        text-[11px]
                        leading-tight
                        theme-text-secondary
                        text-center
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

          <div className="p-5">
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
                  theme-text-secondary
                  mt-1
                "
              >
                Choisis la couleur principale de
                l'application.
              </p>
            </div>

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-5
              "
            >
              {COLOR_OPTIONS.map((option) => {
                const selected =
                  accentColor === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`Choisir la couleur ${option.label}`}
                    aria-pressed={selected}
                    onClick={() =>
                      setAccentColor(option.id)
                    }
                    className="
                      flex
                      flex-col
                      items-center
                      gap-2
                      transition-transform
                      hover:scale-105
                    "
                  >
                    <span
                      className={`
                        w-10
                        h-10
                        rounded-full
                        ${option.className}
                        ${
                          selected
                            ? "ring-4 ring-offset-2 ring-accent dark:ring-offset-gray-900 scale-110"
                            : ""
                        }
                        transition-all
                      `}
                    />

                    <span
                      className="
                        text-xs
                        font-medium
                        theme-text-secondary
                      "
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p
              className="
                mt-4
                text-xs
                theme-text-secondary
              "
            >
              Couleur actuelle :{" "}
              <span className="font-semibold theme-text">
                {
                  COLOR_OPTIONS.find(
                    (option) =>
                      option.id === accentColor
                  )?.label || "Bleu"
                }
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          COMPTE
      ===================================================== */}

      <section className="mb-8">
        <h2
          className="
            text-lg
            font-bold
            theme-text
            mb-3
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
              theme-text
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
                size={21}
                className="text-accent"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  font-semibold
                  theme-text
                "
              >
                Mon profil
              </p>

              <p
                className="
                  text-sm
                  theme-text-secondary
                  mt-0.5
                "
              >
                Consulter et gérer mon profil.
              </p>
            </div>

            <ChevronRight
              size={20}
              className="theme-text-secondary shrink-0"
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
              text-red-600
              dark:text-red-400
              hover:bg-red-50
              dark:hover:bg-red-950/20
              transition
              disabled:opacity-60
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
                  size={21}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={21} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {loggingOut
                  ? "Déconnexion..."
                  : "Déconnexion"}
              </p>

              <p
                className="
                  text-sm
                  text-red-500/80
                  dark:text-red-400/80
                  mt-0.5
                "
              >
                Se déconnecter de Kalan Academy.
              </p>
            </div>

            <ChevronRight
              size={20}
              className="shrink-0"
            />
          </button>
        </div>
      </section>

      {/* =====================================================
          APPLICATION
      ===================================================== */}

      <section className="mb-8">
        <h2
          className="
            text-lg
            font-bold
            theme-text
            mb-3
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
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Bell
                size={21}
                className="text-accent"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  font-semibold
                  theme-text
                "
              >
                Notifications
              </p>

              <p
                className="
                  text-sm
                  theme-text-secondary
                  mt-0.5
                "
              >
                Les notifications ne sont pas encore
                configurables.
              </p>
            </div>

            <span
              className="
                shrink-0
                rounded-lg
                bg-accent-soft
                text-accent
                px-2.5
                py-1
                text-xs
                font-semibold
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
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Globe
                size={21}
                className="text-accent"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  font-semibold
                  theme-text
                "
              >
                Langue
              </p>

              <p
                className="
                  text-sm
                  theme-text-secondary
                  mt-0.5
                "
              >
                Langue de l'application.
              </p>
            </div>

            <span
              className="
                theme-text
                text-sm
                font-semibold
              "
            >
              Français
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          HORS CONNEXION
      ===================================================== */}

      <section className="mb-8">
        <h2
          className="
            text-lg
            font-bold
            theme-text
            mb-3
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
                rounded-2xl
                flex
                items-center
                justify-center
                shrink-0

                ${
                  isOnline
                    ? "bg-green-50 dark:bg-green-950/30"
                    : "bg-orange-50 dark:bg-orange-950/30"
                }
              `}
            >
              {isOnline ? (
                <Wifi
                  size={21}
                  className="
                    text-green-600
                    dark:text-green-400
                  "
                />
              ) : (
                <WifiOff
                  size={21}
                  className="
                    text-orange-600
                    dark:text-orange-400
                  "
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  font-semibold
                  theme-text
                "
              >
                Synchronisation
              </p>

              <p
                className="
                  text-sm
                  theme-text-secondary
                  mt-0.5
                "
              >
                {isOnline
                  ? "Connexion Internet disponible."
                  : "Tu peux continuer à apprendre hors connexion."}
              </p>
            </div>

            <span
              className={`
                shrink-0
                rounded-lg
                px-2.5
                py-1
                text-xs
                font-semibold

                ${
                  isOnline
                    ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                    : "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
                }
              `}
            >
              {isOnline
                ? "En ligne"
                : "Hors ligne"}
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
              theme-text
              hover:bg-accent-soft
              transition
              disabled:opacity-60
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
                  size={21}
                  className="
                    text-accent
                    animate-spin
                  "
                />
              ) : (
                <Trash2
                  size={21}
                  className="text-accent"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  font-semibold
                  theme-text
                "
              >
                {clearingCache
                  ? "Vidage du cache..."
                  : "Vider le cache"}
              </p>

              <p
                className="
                  text-sm
                  theme-text-secondary
                  mt-0.5
                "
              >
                Supprimer les données pédagogiques
                stockées localement.
              </p>
            </div>

            {!clearingCache && (
              <ChevronRight
                size={20}
                className="theme-text-secondary shrink-0"
              />
            )}
          </button>
        </div>
      </section>

      {/* =====================================================
          APPRENTISSAGE
      ===================================================== */}

      {canResetProgress && (
        <section className="mb-8">
          <h2
            className="
              text-lg
              font-bold
              theme-text
              mb-3
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
                theme-text
                hover:bg-orange-50
                dark:hover:bg-orange-950/20
                transition
                disabled:opacity-60
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
                    size={21}
                    className="
                      text-orange-600
                      dark:text-orange-400
                      animate-spin
                    "
                  />
                ) : (
                  <RotateCcw
                    size={21}
                    className="
                      text-orange-600
                      dark:text-orange-400
                    "
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="
                    font-semibold
                    text-orange-700
                    dark:text-orange-300
                  "
                >
                  {resettingProgress
                    ? "Réinitialisation..."
                    : "Réinitialiser ma progression"}
                </p>

                <p
                  className="
                    text-sm
                    text-orange-600/80
                    dark:text-orange-400/80
                    mt-0.5
                  "
                >
                  Supprimer ma progression, mes
                  tentatives de quiz et mon XP.
                </p>
              </div>

              {!resettingProgress && (
                <ChevronRight
                  size={20}
                  className="
                    text-orange-500
                    dark:text-orange-400
                    shrink-0
                  "
                />
              )}
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          À PROPOS
      ===================================================== */}

      <section className="mb-8">
        <h2
          className="
            text-lg
            font-bold
            theme-text
            mb-3
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
                size={21}
                className="text-accent"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  font-semibold
                  theme-text
                "
              >
                Version
              </p>

              <p
                className="
                  text-sm
                  theme-text-secondary
                  mt-0.5
                "
              >
                Version actuelle de l'application.
              </p>
            </div>

            <span
              className="
                theme-text
                text-sm
                font-semibold
              "
            >
              {APP_VERSION}
            </span>
          </div>

          <div
            className="
              border-t
              theme-border
            "
          />

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
                rounded-2xl
                bg-accent-soft
                flex
                items-center
                justify-center
                shrink-0
                text-xl
              "
            >
              🎓
            </div>

            <div className="min-w-0">
              <p
                className="
                  font-semibold
                  theme-text
                "
              >
                Kalan Academy
              </p>

              <p
                className="
                  text-sm
                  theme-text-secondary
                  mt-0.5
                "
              >
                Plateforme d'apprentissage pour les
                élèves du Mali.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className="
          text-center
          text-xs
          theme-text-secondary
          pt-2
        "
      >
        Kalan Academy • Apprendre partout, même hors
        connexion.
      </footer>
    </div>
  );
}